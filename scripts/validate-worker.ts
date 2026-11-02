import assert from "node:assert/strict";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { setTimeout as delay } from "node:timers/promises";
import { parse } from "dotenv";

const root = process.cwd();
const lab = path.join(root, ".next/worker-lab");
// Os adapters escolhem HTTP somente para localhost; manter a autorreferência local.
const origin = "http://localhost:3215";
const publicNames = new Set(["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SITE_URL", "PROMODETEC_ANALYTICS_DISABLED"]);
const results: { name: string; passed: boolean; status?: number; ms?: number; bytes?: number; cache?: Record<string, string>; error?: string }[] = [];
const stress = process.argv.includes("--stress");
const benchmarks: { mode: string; concurrency: number; requests: number; ms: number; processCpuMs: number | null; rssBytes: number | null; cacheHits: number; failed: number; profile?: ProfileSummary }[] = [];
let worker: ChildProcess | undefined;
interface ProfileNode { id: number; callFrame: { functionName: string } }
interface ProfileSummary { activeSamples: number; samplingIntervalUs: number; approximateActiveMs: number; heapUsedBytes: number; arrayBufferBytes: number; topFunctions: { name: string; samples: number }[] }
let profiler: { call(method: string, params?: Record<string, unknown>): Promise<unknown>; close(): void } | undefined;

function readLog(file: string) {
  assert.ok(fs.statSync(file).size <= 512 * 1024, "worker_lab_log_exceeds_512kib");
  return fs.readFileSync(file, "utf8");
}

function prepare() {
  assert.equal(process.platform, "linux", "worker_lab_requires_sanitized_linux_checkout");
  assert.ok(fs.existsSync(path.join(root, ".open-next/worker.js")), "run_cf_build_first");
  const values: Record<string, string> = {};
  for (const directory of [root, lab]) {
    if (!fs.existsSync(directory)) continue;
    const envFiles = fs.readdirSync(directory).filter(name => /^\.env(?:\..+)?$|^\.dev\.vars(?:\..+)?$/.test(name));
    for (const file of envFiles) {
      const vars = parse(fs.readFileSync(path.join(directory, file)));
      assert.ok(Object.keys(vars).every(name => publicNames.has(name)), "worker_lab_refuses_private_env_files");
      Object.assign(values, vars);
    }
  }
  assert.ok(values.NEXT_PUBLIC_SUPABASE_URL && values.NEXT_PUBLIC_SUPABASE_ANON_KEY, "public_database_env_required");
  const key = values.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key.startsWith("sb_publishable_")) {
    assert.equal(JSON.parse(Buffer.from(key.split(".")[1] ?? "", "base64url").toString()).role, "anon", "worker_lab_requires_public_anon_key");
  }
  fs.mkdirSync(lab, { recursive: true });
  const production = JSON.parse(fs.readFileSync(path.join(root, "wrangler.jsonc"), "utf8"));
  const config = {
    name: "promodetec-lab", main: path.join(root, production.main),
    compatibility_date: production.compatibility_date,
    compatibility_flags: production.compatibility_flags,
    assets: { directory: path.join(root, production.assets.directory), binding: "ASSETS" },
    rules: production.rules,
    services: [{ binding: "WORKER_SELF_REFERENCE", service: "promodetec-lab" }],
    durable_objects: production.durable_objects,
    migrations: production.migrations,
    r2_buckets: [{ binding: "NEXT_INC_CACHE_R2_BUCKET", bucket_name: "promodetec-lab-cache", remote: false }],
    vars: { ...production.vars, ...values, PROMODETEC_ANALYTICS_DISABLED: "1" },
  };
  assert.equal(config.r2_buckets[0]!.remote, false);
  assert.equal(config.services[0]!.service, config.name);
  assert.deepEqual(config.durable_objects.bindings, [{ name: "NEXT_CACHE_DO_QUEUE", class_name: "DOQueueHandler" }]);
  assert.deepEqual(config.migrations, [{ tag: "v1-isr-queue", new_sqlite_classes: ["DOQueueHandler"] }]);
  assert.equal("SUPABASE_SERVICE_ROLE_KEY" in config.vars, false);
  const configPath = path.join(lab, "wrangler.jsonc");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  const env: NodeJS.ProcessEnv = {};
  for (const name of ["PATH", "HOME", "USER", "LOGNAME", "LANG", "LC_ALL", "TMPDIR", "XDG_CACHE_HOME", "SHELL"]) {
    if (process.env[name]) env[name] = process.env[name];
  }
  Object.assign(env, { WRANGLER_SEND_METRICS: "false", NEXT_TELEMETRY_DISABLED: "1", PROMODETEC_ANALYTICS_DISABLED: "1" });
  return { configPath, env };
}

async function readResponse(response: Response) {
  const reader = response.body?.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  if (reader) try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      bytes += next.value.byteLength;
      if (bytes > 2 * 1024 * 1024) { await reader.cancel(); throw new Error("response_exceeds_2mib"); }
      chunks.push(next.value);
    }
  } finally { reader.releaseLock(); }
  const body = Buffer.concat(chunks, bytes);
  const cache: Record<string, string> = {};
  for (const name of ["cache-control", "age", "x-opennext-cache", "x-nextjs-cache", "content-type", "x-promodetec-cache", "x-promodetec-build"]) {
    const value = response.headers.get(name);
    if (value) cache[name] = value.slice(0, 256);
  }
  const text = cache["content-type"]?.includes("text/html") ? body.toString() : "";
  const start = text.indexOf("<main"), end = text.lastIndexOf("</main>");
  // Instantes relativos podem mudar entre renders; o datetime e todo o catálogo permanecem comparáveis.
  const main = start >= 0 && end > start ? text.slice(start, end + 7).replace(/(<time\b[^>]*>)[\s\S]*?(<\/time>)/g, "$1$2") : null;
  return { response, body, bytes, cache, sha256: createHash("sha256").update(body).digest("hex"),
    mainSha256: main === null ? null : createHash("sha256").update(main).digest("hex") };
}

async function request(route: string, init?: RequestInit) {
  const start = performance.now();
  const response = await fetch(origin + route, { ...init, redirect: "manual", signal: AbortSignal.timeout(20_000) });
  return { ...await readResponse(response), ms: Math.round(performance.now() - start) };
}
type Receipt = Awaited<ReturnType<typeof request>>;
async function connectProfiler() {
  const list = await fetch("http://127.0.0.1:9235/json/list", { signal: AbortSignal.timeout(5000) }).then(response => response.json()) as { webSocketDebuggerUrl: string; type: string }[];
  assert.equal(list.length, 1, "isolated_workerd_debugger_required");
  const address = new URL(list[0]!.webSocketDebuggerUrl);
  assert.ok(["localhost", "127.0.0.1"].includes(address.hostname) && address.port === "9235", "local_workerd_debugger_only");
  // Cliente já distribuído com o Next: o WebSocket global do Node 22 falha
  // no handshake deste proxy do Wrangler. Nenhuma dependência nova no Worker.
  const { WebSocket: LocalWebSocket } = createRequire(path.join(root, "package.json"))("next/dist/compiled/ws") as { WebSocket: typeof WebSocket };
  const socket = new LocalWebSocket(address.href);
  const pending = new Map<number, { resolve(value: unknown): void; reject(error: Error): void; timer: ReturnType<typeof setTimeout> }>();
  let sequence = 0;
  socket.addEventListener("message", event => {
    const data = typeof event.data === "string" ? event.data : Buffer.isBuffer(event.data) ? event.data.toString() : "";
    if (!data || data.length > 8 * 1024 * 1024) return;
    const message = JSON.parse(data) as { id?: number; result?: unknown; error?: { message: string } };
    const task = message.id === undefined ? undefined : pending.get(message.id);
    if (!task) return;
    pending.delete(message.id!); clearTimeout(task.timer);
    if (message.error) task.reject(new Error("workerd_profiler_command_failed")); else task.resolve(message.result);
  });
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("workerd_profiler_connect_timeout")), 5000);
    socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("workerd_profiler_connect_failed")); }, { once: true });
  });
  const client = {
    call(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
      const id = ++sequence;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => { pending.delete(id); reject(new Error("workerd_profiler_timeout")); }, 5000);
        pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params }));
      });
    },
    close() { socket.close(); for (const task of pending.values()) { clearTimeout(task.timer); task.reject(new Error("workerd_profiler_closed")); } pending.clear(); },
  };
  try {
    await client.call("Profiler.enable");
    await client.call("Profiler.setSamplingInterval", { interval: 100 });
  } catch (error) { client.close(); throw error; }
  return client;
}

async function stopProfile(): Promise<ProfileSummary | undefined> {
  if (!profiler) return undefined;
  const result = await profiler.call("Profiler.stop") as { profile: { nodes: ProfileNode[]; samples?: number[] } };
  const heap = await profiler.call("Runtime.getHeapUsage") as { usedSize: number; backingStorageSize?: number };
  const names = new Map(result.profile.nodes.map(node => [node.id, node.callFrame.functionName]));
  const counts = new Map<string, number>();
  let active = 0;
  for (const sample of result.profile.samples ?? []) {
    const name = names.get(sample) ?? "unknown";
    if (name === "(idle)") continue;
    active++; counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return { activeSamples: active, samplingIntervalUs: 100, approximateActiveMs: active / 10,
    heapUsedBytes: heap.usedSize, arrayBufferBytes: heap.backingStorageSize ?? 0,
    topFunctions: [...counts].sort((a,b) => b[1]-a[1]).slice(0,8).map(([name,samples])=>({name,samples})) };
}
function workerUsage(): { ticks: number; rssBytes: number } | null {
  if (!worker?.pid || process.platform !== "linux") return null;
  const pending = [worker.pid];
  for (let count = 0; pending.length && count < 32; count++) {
    const pid = pending.shift()!;
    try {
      const stat = fs.readFileSync(`/proc/${pid}/stat`, "utf8");
      if (stat.slice(stat.indexOf("(") + 1, stat.lastIndexOf(")")) === "workerd") {
        const fields = stat.slice(stat.lastIndexOf(")") + 2).trim().split(/\s+/);
        const page = spawnSync("getconf", ["PAGESIZE"], { encoding: "utf8" });
        const pageBytes = Number(page.stdout.trim());
        return { ticks: Number(fields[11]) + Number(fields[12]), rssBytes: Number(fields[21]) * pageBytes };
      }
      pending.push(...fs.readFileSync(`/proc/${pid}/task/${pid}/children`, "utf8").trim().split(/\s+/).filter(Boolean).map(Number));
    } catch { /* Filho encerrado; não consultar processos fora do grupo próprio. */ }
  }
  return null;
}

async function cacheHit(route: string, init?: RequestInit): Promise<Receipt> {
  let receipt = await request(route, init);
  for (let attempt = 0; receipt.cache["x-promodetec-cache"] !== "HIT" && attempt < 8; attempt++) {
    await delay(50);
    receipt = await request(route, init);
  }
  assert.equal(receipt.cache["x-promodetec-cache"], "HIT", "public_cache_did_not_warm");
  return receipt;
}

async function benchmark(route: string, mode: "baseline" | "cache", concurrency: number, count: number, reference: Receipt) {
  const ticks = Number(spawnSync("getconf", ["CLK_TCK"], { encoding: "utf8" }).stdout.trim());
  const before = workerUsage();
  if (profiler) await profiler.call("Profiler.start");
  const started = performance.now();
  let hits = 0, failed = 0;
  for (let offset = 0; offset < count; offset += concurrency) {
    const batch = await Promise.all(Array.from({ length: Math.min(concurrency, count - offset) }, async () => {
      try {
        const response = await request(route, mode === "baseline" ? { headers: { cookie: "public_cache_lab=baseline" } } : undefined);
        if (response.cache["x-promodetec-cache"] === "HIT") hits++;
        const sameContent = mode === "cache" ? response.sha256 === reference.sha256 : response.mainSha256 !== null && response.mainSha256 === reference.mainSha256;
        if (response.response.status !== 200 || !sameContent) failed++;
      } catch { failed++; }
    }));
    void batch;
  }
  const after = workerUsage();
  const profile = await stopProfile();
  const row = { mode, concurrency, requests: count, ms: Math.round(performance.now() - started),
    processCpuMs: before && after && ticks > 0 ? (after.ticks - before.ticks) * 1000 / ticks : null,
    rssBytes: after?.rssBytes ?? null, cacheHits: hits, failed, profile };
  benchmarks.push(row);
  assert.equal(failed, 0, "stress_body_or_status_changed");
  if (mode === "cache") assert.equal(hits, count, "stress_request_rendered_again");
  process.stdout.write(`worker_lab: ${mode}, concurrency=${concurrency}, requests=${count}, errors=${failed}\n`);
}
async function check(name: string, run: () => Promise<Receipt>, verify: (receipt: Receipt) => void = receipt => assert.equal(receipt.response.status, 200)) {
  let receipt: Receipt | undefined;
  try {
    receipt = await run();
    verify(receipt);
    results.push({ name, passed: true, status: receipt.response.status, ms: receipt.ms, bytes: receipt.bytes, cache: receipt.cache });
    return receipt;
  } catch (error) {
    results.push({ name, passed: false, status: receipt?.response.status, ms: receipt?.ms, error: error instanceof Error ? error.name : "Error" });
    return undefined;
  }
}

async function stop() {
  profiler?.close(); profiler = undefined;
  const child = worker;
  worker = undefined;
  if (!child?.pid) return;
  // O grupo pertence apenas ao preview iniciado por este processo.
  try { process.kill(-child.pid, "SIGTERM"); } catch { return; }
  await delay(500);
  try { process.kill(-child.pid, "SIGKILL"); } catch { /* já encerrou */ }
}

async function main() {
  const { configPath, env } = prepare();
  const logFile = path.join(lab, "preview.log");
  process.stdout.write("worker_lab: populating local R2\n");
  const cacheLog = fs.openSync(path.join(lab, "cache-population.log"), "w");
  const populated = spawnSync(path.join(root, "node_modules/.bin/opennextjs-cloudflare"), ["populateCache", "local", "--config", configPath], { cwd: root, env, stdio: ["ignore", cacheLog, cacheLog], timeout: 60_000 });
  fs.closeSync(cacheLog);
  assert.equal(populated.status, 0, "worker_lab_cache_population_failed");
  const wrangler = process.env.PROMODETEC_WORKER_WRANGLER ?? path.join(root, "node_modules/wrangler/bin/wrangler.js");
  assert.ok(path.isAbsolute(wrangler) && fs.existsSync(wrangler), "worker_lab_wrangler_cli_missing");
  const wranglerPackage = JSON.parse(fs.readFileSync(path.join(path.dirname(wrangler), "../package.json"), "utf8"));
  assert.equal(wranglerPackage.name, "wrangler");
  const log = fs.openSync(logFile, "w");
  worker = spawn(process.execPath, [wrangler, "dev", "--config", configPath, "--local", "--ip", "127.0.0.1", "--port", "3215", "--inspector-port", "9235", "--show-interactive-dev-session=false"], {
    cwd: root, env, stdio: ["ignore", log, log], detached: true,
  });
  fs.closeSync(log);
  let startupError: Error | undefined;
  worker.on("error", error => { startupError = error; });
  process.once("SIGTERM", () => { void stop(); });
  process.once("SIGINT", () => { void stop(); });
  process.stdout.write(`worker_lab: starting local runtime with Wrangler ${wranglerPackage.version}\n`);
  let ready = false;
  const started = Date.now();
  while (Date.now() - started < 60_000) {
    if (startupError || worker.exitCode !== null) throw new Error("worker_preview_start_failed");
    if (fs.existsSync(logFile) && /Ready on http:\/\/127\.0\.0\.1:3215/.test(readLog(logFile))) { ready = true; break; }
    await delay(250);
  }
  assert.ok(ready, "worker_preview_start_timeout");
  process.stdout.write("worker_lab: runtime ready; checking HTTP contracts\n");
  const first = await check("home-first", () => request("/"), receipt => {
    assert.equal(receipt.response.status, 200);
    assert.equal(receipt.cache["x-nextjs-cache"], "HIT");
    assert.match(receipt.cache["content-type"] ?? "", /text\/html/);
    assert.ok(!receipt.body.toString().includes("/_next/image?"), "home_does_not_need_image_proxy");
  });
  await check("home-warm", () => request("/"), receipt => {
    assert.equal(receipt.response.status, 200);
    assert.equal(receipt.cache["x-nextjs-cache"], "HIT");
    if (first) assert.equal(receipt.sha256, first.sha256);
  });
  await Promise.all(Array.from({ length: 4 }, (_, i) => check(`home-concurrent-${i + 1}`, () => request("/"), receipt => {
    assert.equal(receipt.response.status, 200);
    assert.equal(receipt.cache["x-nextjs-cache"], "HIT");
    if (first) assert.equal(receipt.sha256, first.sha256);
  })));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, ".next/app-build-manifest.json"), "utf8"));
  const assets = [...new Set<string>(Object.values<string[]>(manifest.pages).flat())];
  for (const extension of [".js", ".css"]) {
    const asset = assets.find(file => file.endsWith(extension));
    assert.ok(asset, "static_asset_missing_from_manifest");
    await check(`asset-${extension.slice(1)}`, () => request(`/_next/${asset}`), receipt => {
      assert.equal(receipt.response.status, 200);
      assert.ok(receipt.bytes > 0);
      assert.match(receipt.response.headers.get("content-type") ?? "", extension === ".js" ? /javascript/ : /css/);
    });
  }
  for (const route of ["/robots.txt", "/sitemap.xml", "/login"]) await check(route, () => request(route));
  const isrStartedAt = Date.now();
  const couponsInitial = await check("coupons-initial-isr", () => request("/cupons"), receipt => {
    assert.equal(receipt.response.status, 200);
    assert.equal(receipt.cache["x-opennext-cache"] ?? receipt.cache["x-nextjs-cache"], "HIT");
    assert.match(receipt.body.toString(), /<time dateTime=|<time datetime=/, "build_must_contain_coupon_snapshot");
  });
  await check("admin-anonymous", () => request("/admin"), receipt => {
    assert.equal(receipt.response.status, 307);
    const target = new URL(receipt.response.headers.get("location")!, origin);
    assert.equal(target.origin, new URL(origin).origin);
    assert.equal(target.pathname, "/login");
    assert.equal(target.searchParams.get("next"), "/admin");
  });
  await check("admin-write-anonymous", () => request("/api/admin/produtos", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }), receipt => assert.equal(receipt.response.status, 401));
  await check("track-disabled", () => request("/api/track", { method: "POST", headers: { origin, "content-type": "application/json", "user-agent": "Mozilla/5.0 Chrome/140 Safari/537.36" }, body: JSON.stringify({ consent: "accepted", events: [{ tipo: "visita", origem: "home" }] }) }), receipt => {
    assert.equal(receipt.response.status, 204);
    assert.match(receipt.cache["cache-control"] ?? "", /no-store/);
  });
  const id = "12345678-1234-4234-8234-123456789abc";
  await check("outbound-head", () => request(`/r/${id}`, { method: "HEAD" }), receipt => assert.equal(receipt.response.status, 204));
  await check("outbound-prefetch", () => request(`/r/${id}`, { headers: { purpose: "prefetch" } }), receipt => assert.equal(receipt.response.status, 204));
  await check("outbound-bot", () => request(`/r/${id}`, { headers: { "user-agent": "Googlebot" } }), receipt => {
    assert.equal(receipt.response.status, 307);
    assert.equal(new URL(receipt.response.headers.get("location")!).pathname, `/produto/${id}`);
  });
  await check("outbound-invalid-id", () => request("/r/invalid"), receipt => {
    assert.equal(receipt.response.status, 307);
    assert.equal(new URL(receipt.response.headers.get("location")!).pathname, "/");
  });
  const search = await check("search-live-read", () => request("/api/search?q=fone"), receipt => {
    assert.equal(receipt.response.status, 200);
    const json = JSON.parse(receipt.body.toString()) as { produtos: { id: string }[]; error?: string };
    assert.equal(json.error, undefined);
    assert.ok(Array.isArray(json.produtos) && json.produtos.length <= 8);
  });
  const productId = search && JSON.parse(search.body.toString()).produtos?.[0]?.id;
  if (typeof productId === "string" && /^[0-9a-f-]{36}$/i.test(productId)) await check("product-live-read", () => request(`/produto/${productId}`));
  else results.push({ name: "product-live-read", passed: false, error: "NoSearchProduct" });
  await check("offers-live-read", () => request("/ofertas?busca=fone"));
  await check("comparison-live-read", () => request("/comparar?categoria=fones-bluetooth"));
  await check("unused-image-proxy-disabled", () => request("/_next/image?url=https%3A%2F%2Fexample.invalid%2Fphoto.jpg&w=256&q=75"), receipt => assert.ok([403, 404].includes(receipt.response.status), "image_proxy_must_be_blocked"));
  const cached = await check("public-offers-cache-ready", () => cacheHit("/ofertas?busca=fone"), receipt => {
    assert.equal(receipt.response.status, 200);
    assert.match(receipt.body.toString(), /data-public-cache="ready"/);
    assert.equal(receipt.cache["x-promodetec-build"], fs.readFileSync(path.join(root, ".next/BUILD_ID"), "utf8").trim());
  });
  await check("personal-cookie-bypasses-public-cache", () => request("/ofertas?busca=fone", { headers: { cookie: "public_cache_lab=baseline" } }), receipt => {
    assert.equal(receipt.response.status, 200);
    assert.equal(receipt.cache["x-promodetec-cache"], "BYPASS");
    if (cached) assert.equal(receipt.mainSha256, cached.mainSha256);
  });
  const routerHeaders = { rsc: "1", "next-router-state-tree": encodeURIComponent(JSON.stringify(["", { children: ["__PAGE__", {}] }, null, null, true])), "next-url": "/" };
  const rsc = await check("rsc-cache-ready", () => cacheHit("/ofertas?busca=fone&_rsc=lab-one", { headers: routerHeaders }), receipt => {
    assert.match(receipt.cache["content-type"] ?? "", /text\/x-component/);
    assert.match(receipt.body.toString(), /"data-public-cache":"ready"/);
  });
  await check("rsc-nonce-keeps-variant", () => request("/ofertas?busca=fone&_rsc=lab-two", { headers: routerHeaders }), receipt => {
    assert.equal(receipt.cache["x-promodetec-cache"], "HIT");
    if (rsc) assert.equal(receipt.sha256, rsc.sha256);
  });
  if (stress && cached) {
    try { profiler = await connectProfiler(); } catch { process.stdout.write("worker_lab: V8 profile unavailable; OS counters remain diagnostic only\n"); }
    const expiresAfter = Date.now() + 122_000;
    await check("baseline-without-response-cache", async () => {
      await benchmark("/ofertas?busca=fone", "baseline", 2, 16, cached);
      return request("/ofertas?busca=fone");
    });
    for (const concurrency of [1, 8, 32, 64]) await check(`warm-cache-burst-${concurrency}`, async () => {
      await benchmark("/ofertas?busca=fone", "cache", concurrency, 128, cached);
      return request("/ofertas?busca=fone");
    });
    process.stdout.write("worker_lab: waiting for native Cache API expiry; no requests during wait\n");
    while (Date.now() < expiresAfter) await delay(Math.min(1000, expiresAfter - Date.now()));
    await check("public-cache-expiry", () => request("/ofertas?busca=fone"), receipt => {
      assert.equal(receipt.response.status, 200);
      assert.equal(receipt.cache["x-promodetec-cache"], "MISS");
    });
    await check("public-cache-recovery", () => cacheHit("/ofertas?busca=fone"), receipt => assert.equal(receipt.response.status, 200));
    process.stdout.write("worker_lab: waiting for ISR expiry; no requests during wait\n");
    while (Date.now() < isrStartedAt + 305_000) await delay(Math.min(1000, isrStartedAt + 305_000 - Date.now()));
    await check("coupons-isr-expiry", () => request("/cupons"), receipt => {
      assert.equal(receipt.response.status, 200);
      assert.equal(receipt.cache["x-opennext-cache"] ?? receipt.cache["x-nextjs-cache"], "STALE");
    });
    await check("coupons-isr-recovery", async () => {
      let receipt = await request("/cupons");
      for (let attempt = 0; (receipt.cache["x-opennext-cache"] ?? receipt.cache["x-nextjs-cache"]) !== "HIT" && attempt < 15; attempt++) {
        await delay(1000);
        receipt = await request("/cupons");
      }
      return receipt;
    }, receipt => {
      assert.equal(receipt.response.status, 200);
      assert.equal(receipt.cache["x-opennext-cache"] ?? receipt.cache["x-nextjs-cache"], "HIT", "isr_did_not_revalidate");
      // O build lê o snapshot; o runtime isolado não tem service role e gera o estado vazio honesto.
      assert.ok(couponsInitial?.mainSha256 && receipt.mainSha256 && couponsInitial.mainSha256 !== receipt.mainSha256, "isr_must_generate_new_content");
      assert.match(receipt.body.toString(), /Novos cupons estão a caminho/);
    });
  }
  const runtimeLog = readLog(logFile);
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const compatibilityWarning = runtimeLog.match(/latest compatibility date supported[^\n]*"(\d{4}-\d{2}-\d{2})"/);
  const failures = results.filter(result => !result.passed);
  const report = {
    checkedAt: new Date().toISOString(), buildId: fs.readFileSync(path.join(root, ".next/BUILD_ID"), "utf8").trim(),
    runtime: "Local OpenNext preview / Wrangler / workerd", remoteBindings: false,
    wranglerVersion: wranglerPackage.version,
    requestedCompatibilityDate: config.compatibility_date,
    effectiveCompatibilityDate: compatibilityWarning?.[1] ?? config.compatibility_date,
    credentials: "public anon only; no service role or Cloudflare token inherited", analyticsDisabled: true,
    checks: results, passed: results.length - failures.length, failed: failures.length,
    benchmarks,
    runtimeSignals: { queryTimeout: (runtimeLog.match(/57014|source_unavailable/g) ?? []).length, analyticsWriteFailure: (runtimeLog.match(/analytics_write_failed/g) ?? []).length, cpuExceeded: (runtimeLog.match(/CPU time limit|1102/g) ?? []).length },
    limits: ["HTTP checks do not validate browser rendering or hydration", "Local process CPU/RSS are not Cloudflare billed CPU or isolate memory limits", "Local latency is not production Worker CPU, startup or Core Web Vitals", "No authenticated account, live event insertion, human affiliate redirect or real R2 bucket tested", stress ? "Native Cache API and 300s ISR expiry/recovery tested locally; coupon content changes to the honest empty state without service role. Distributed POPs and production data freshness remain separate" : "Cache expiry has unit coverage; native Cache API/ISR expiry and stress require --stress"],
  };
  fs.mkdirSync(path.join(root, "docs/evidence"), { recursive: true });
  const output = path.join(root, `docs/evidence/worker-lab-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
  process.stdout.write(JSON.stringify({ passed: report.passed, failed: report.failed, runtimeSignals: report.runtimeSignals, failures: failures.map(item => item.name), evidence: path.relative(root, output) }) + "\n");
  if (failures.length) process.exitCode = 1;
}

main().catch(error => { process.stderr.write(`worker_lab_failed:${error instanceof Error ? error.message : "unknown"}\n`); process.exitCode = 1; }).finally(stop);
