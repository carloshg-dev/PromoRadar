import assert from "node:assert/strict";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { parse } from "dotenv";

const root = process.cwd();
const lab = path.join(root, ".next/worker-lab");
const origin = "http://127.0.0.1:3215";
const publicNames = new Set(["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SITE_URL", "PROMODETEC_ANALYTICS_DISABLED"]);
const results: { name: string; passed: boolean; status?: number; ms?: number; bytes?: number; cache?: Record<string, string>; error?: string }[] = [];
let worker: ChildProcess | undefined;

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
    services: [{ binding: "WORKER_SELF_REFERENCE", service: "promodetec-lab" }],
    r2_buckets: [{ binding: "NEXT_INC_CACHE_R2_BUCKET", bucket_name: "promodetec-lab-cache", remote: false }],
    vars: { ...values, PROMODETEC_ANALYTICS_DISABLED: "1" },
  };
  assert.equal(config.r2_buckets[0]!.remote, false);
  assert.equal(config.services[0]!.service, config.name);
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
  for (const name of ["cache-control", "age", "x-opennext-cache", "x-nextjs-cache", "content-type"]) {
    const value = response.headers.get(name);
    if (value) cache[name] = value.slice(0, 256);
  }
  return { response, body, bytes, cache, sha256: createHash("sha256").update(body).digest("hex") };
}

async function request(route: string, init?: RequestInit) {
  const start = performance.now();
  const response = await fetch(origin + route, { ...init, redirect: "manual", signal: AbortSignal.timeout(20_000) });
  return { ...await readResponse(response), ms: Math.round(performance.now() - start) };
}
type Receipt = Awaited<ReturnType<typeof request>>;
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
  for (const route of ["/robots.txt", "/sitemap.xml", "/cupons", "/login"]) await check(route, () => request(route));
  await check("admin-anonymous", () => request("/admin"), receipt => {
    assert.equal(receipt.response.status, 307);
    const target = new URL(receipt.response.headers.get("location")!);
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
    runtimeSignals: { queryTimeout: (runtimeLog.match(/57014|source_unavailable/g) ?? []).length, analyticsWriteFailure: (runtimeLog.match(/analytics_write_failed/g) ?? []).length, cpuExceeded: (runtimeLog.match(/CPU time limit|1102/g) ?? []).length },
    limits: ["HTTP checks do not validate browser rendering or hydration", "Local latency is not production Worker CPU, startup or Core Web Vitals", "No authenticated account, live event insertion, human affiliate redirect or real R2 bucket tested", "Cached home reads use the build selection; cache expiry and recovery still need a dedicated test"],
  };
  fs.mkdirSync(path.join(root, "docs/evidence"), { recursive: true });
  const output = path.join(root, `docs/evidence/worker-lab-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
  process.stdout.write(JSON.stringify({ passed: report.passed, failed: report.failed, runtimeSignals: report.runtimeSignals, failures: failures.map(item => item.name), evidence: path.relative(root, output) }) + "\n");
  if (failures.length) process.exitCode = 1;
}

main().catch(error => { process.stderr.write(`worker_lab_failed:${error instanceof Error ? error.message : "unknown"}\n`); process.exitCode = 1; }).finally(stop);
