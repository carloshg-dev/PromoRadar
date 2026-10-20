import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { parse } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { EVENT_TYPES } from "../src/core/analytics/events";
import { carregarMovimento } from "../src/infrastructure/repositories/analytics.repo";

const root = process.cwd(), origin = "http://127.0.0.1:3216";
const productId = "12345678-1234-4234-8234-123456789abc";
const checks: { name: string; passed: boolean; error?: string }[] = [];
let server: ChildProcess | undefined;
async function check(name: string, run: () => Promise<void>) {
  try { await run(); checks.push({ name, passed: true }); }
  catch (error) { checks.push({ name, passed: false, error: error instanceof Error ? error.name : "Error" }); }
}

async function stop() {
  const child = server; server = undefined;
  if (!child?.pid) return;
  try { process.kill(-child.pid, "SIGTERM"); } catch { return; }
  await delay(500);
  try { process.kill(-child.pid, "SIGKILL"); } catch { /* já encerrou */ }
}

async function main() {
  assert.equal(process.platform, "linux", "auth_lab_requires_linux");
  const app = process.env.PROMODETEC_AUTH_LAB_APP;
  const envFile = process.env.PROMODETEC_AUTH_LAB_ENV;
  assert.ok(app && envFile && path.isAbsolute(app) && path.isAbsolute(envFile), "explicit_lab_paths_required");
  assert.notEqual(fs.realpathSync(app), fs.realpathSync(root), "separate_lab_app_required");
  assert.ok(!fs.readdirSync(app).some(name => /^\.env(?:\.|$)|^\.dev\.vars/.test(name)), "lab_app_must_not_contain_env_files");
  const credentials = parse(fs.readFileSync(envFile));
  const url = credentials.API_URL, key = credentials.ANON_KEY, service = credentials.SERVICE_ROLE_KEY;
  assert.ok(url && key && service, "local_credentials_required");
  const target = new URL(url);
  assert.equal(target.hostname, "127.0.0.1", "loopback_database_required");
  assert.equal(target.port, "55321");
  assert.equal(JSON.parse(Buffer.from(service.split(".")[1] ?? "", "base64url").toString()).role, "service_role");
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (input, init) => {
    const endpoint = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
    assert.ok(endpoint.hostname === "127.0.0.1", "auth_lab_external_fetch_forbidden");
    return originalFetch(input, { ...init, redirect: "manual" });
  };
  process.env.NEXT_PUBLIC_SUPABASE_URL = url;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = key;
  process.env.SUPABASE_SERVICE_ROLE_KEY = service;
  const admin = createClient(url, service, { auth: { persistSession: false } });
  const anon = createClient(url, key, { auth: { persistSession: false } });
  const marker = await admin.from("promodetec_lab_contract").select("version").eq("id", true).single();
  assert.equal(marker.error, null, "reference_lab_schema_required");
  assert.equal(marker.data?.version, "measurement-auth-v1");
  const since = "2000-01-01T00:00:00Z", until = "2100-01-01T00:00:00Z";
  const beforeSummary = await carregarMovimento(since, until);
  const countEvents = async () => {
    const { count, error } = await admin.from("eventos").select("id", { count: "exact", head: true });
    assert.equal(error, null); assert.notEqual(count, null); return count!;
  };
  const baseline = await countEvents();
  const lastEvent = await admin.from("eventos").select("id").order("id", { ascending: false }).limit(1);
  assert.equal(lastEvent.error, null);
  const afterId = lastEvent.data?.[0]?.id ?? 0;
  const logFile = path.join(app, ".next-auth-lab.log");
  const guardFile = path.join(app, ".auth-fetch-guard.cjs");
  fs.writeFileSync(guardFile, `const original=globalThis.fetch;globalThis.fetch=(input,init)=>{const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);if(url.hostname!=='127.0.0.1')throw new Error('auth_lab_external_fetch_forbidden');return original(input,{...init,redirect:'manual'});};\n`);
  const childEnv: NodeJS.ProcessEnv = {};
  for (const name of ["PATH", "HOME", "USER", "LANG", "TMPDIR"]) if (process.env[name]) childEnv[name] = process.env[name];
  Object.assign(childEnv, { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: key, SUPABASE_SERVICE_ROLE_KEY: service,
    NEXT_PUBLIC_SITE_URL: origin, PROMODETEC_ANALYTICS_DISABLED: "0", NEXT_TELEMETRY_DISABLED: "1", OPENNEXT_CLOUDFLARE: "1", NODE_OPTIONS: `--require=${guardFile}` });
  const fd = fs.openSync(logFile, "w");
  server = spawn(process.execPath, [path.join(app, "node_modules/next/dist/bin/next"), "dev", "--hostname", "127.0.0.1", "--port", "3216"], { cwd: app, env: childEnv, detached: true, stdio: ["ignore", fd, fd] });
  fs.closeSync(fd);
  server.on("error", () => { process.exitCode = 1; });
  process.once("SIGTERM", () => { void stop(); });
  process.once("SIGINT", () => { void stop(); });
  let ready = false;
  for (let i = 0; i < 160; i++) {
    assert.equal(server.exitCode, null, "auth_lab_app_exited");
    assert.ok(fs.statSync(logFile).size < 512 * 1024, "auth_lab_log_limit");
    if (/Ready in/.test(fs.readFileSync(logFile, "utf8"))) { ready = true; break; }
    await delay(250);
  }
  assert.ok(ready, "auth_lab_app_timeout");
  process.stdout.write("auth_lab: local database and app ready; testing persistence and sessions\n");
  const payload = { consent: "accepted", events: EVENT_TYPES.map(tipo => ({ tipo, produtoId: productId, origem: "home", termo: tipo === "busca" ? "private@promodetec.test" : undefined, email: "private@promodetec.test", referer: "https://private.test" })) };
  const post = (body: unknown = payload, headers: Record<string, string> = {}) => fetch(origin + "/api/track", { method: "POST", redirect: "manual", headers: { origin, "content-type": "application/json", "user-agent": "Mozilla/5.0 Chrome/140 Safari/537.36", ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(45_000) });
  await check("all-14-event-types-persist", async () => { const response = await post(); await response.arrayBuffer(); assert.equal(response.status, 204); assert.equal(await countEvents(), baseline + 14); });
  await check("privacy-fields-are-not-persisted", async () => {
    const { data, error } = await admin.from("eventos").select("tipo,termo,referer,cidade").gt("id", afterId).limit(20);
    assert.equal(error, null); assert.equal(data?.length, 14);
    assert.equal(JSON.stringify(data).includes("private"), false);
    assert.ok(data!.every(row => row.referer === null && row.cidade === null));
  });
  await check("denied-events-do-not-change-database", async () => {
    const before = await countEvents();
    for (const headers of [{ dnt: "1" }, { "sec-gpc": "1" }, { origin: "https://foreign.test" }, { "user-agent": "Googlebot" }, { purpose: "prefetch" }]) {
      const response = await post(payload, headers); await response.arrayBuffer(); assert.equal(response.status, 204);
    }
    const response = await post({ ...payload, consent: "rejected" }); await response.arrayBuffer(); assert.equal(response.status, 204);
    assert.equal(await countEvents(), before);
  });
  await check("database-error-is-503-and-batch-is-atomic", async () => {
    const before = await countEvents();
    const response = await post({ consent: "accepted", events: [{ tipo: "busca", termo: "fone", produtoId: productId }, { tipo: "ver_produto", produtoId: randomUUID() }] });
    await response.arrayBuffer(); assert.equal(response.status, 503); assert.equal(await countEvents(), before);
  });
  await check("anonymous-cannot-insert-events-directly", async () => { const { error } = await anon.from("eventos").insert({ tipo: "visita" }); assert.ok(error); });

  const password = `Lab-${randomUUID()}-Aa1!`, suffix = randomUUID().slice(0, 8);
  const userEmail = `user-${suffix}@promodetec.test`, staffEmail = `staff-${suffix}@promodetec.test`;
  const ordinary = createClient(url, key, { auth: { persistSession: false } });
  const signed = await ordinary.auth.signUp({ email: userEmail, password, options: { data: { full_name: "Usuário fictício", role: "super_admin", is_admin: true } } });
  assert.equal(signed.error, null); assert.ok(signed.data.user);
  const userId = signed.data.user.id;
  const staff = await admin.auth.admin.createUser({ email: staffEmail, password, email_confirm: true });
  assert.equal(staff.error, null); assert.ok(staff.data.user);
  const promoted = await admin.from("usuarios").update({ role: "admin", is_admin: true, onboarding_completo: true }).eq("auth_id", staff.data.user.id);
  assert.equal(promoted.error, null);
  async function login(email: string) {
    const jar = new Map<string, string>();
    const client = createServerClient(url, key, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: rows => rows.forEach(row => jar.set(row.name, row.value)) } });
    const result = await client.auth.signInWithPassword({ email, password });
    assert.equal(result.error, null); assert.ok(result.data.session);
    return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
  }
  const userCookie = await login(userEmail), staffCookie = await login(staffEmail);
  const get = (route: string, cookie?: string) => fetch(origin + route, { redirect: "manual", headers: cookie ? { cookie } : {}, signal: AbortSignal.timeout(45_000) });
  await check("metadata-cannot-promote-new-account", async () => { const { data, error } = await admin.from("usuarios").select("role,is_admin").eq("auth_id", userId).single(); assert.equal(error, null); assert.equal(data?.role, "user"); assert.equal(data?.is_admin, false); });
  await check("authenticated-cannot-promote-profile-or-insert-event", async () => {
    assert.ok((await ordinary.from("usuarios").update({ role: "super_admin", is_admin: true }).eq("auth_id", userId)).error);
    assert.ok((await ordinary.from("eventos").insert({ tipo: "visita" })).error);
    const { data, error } = await ordinary.from("usuarios").select("auth_id"); assert.equal(error, null); assert.deepEqual(data?.map(row => row.auth_id), [userId]);
  });
  await check("anonymous-admin-redirects-to-login", async () => { const response = await get("/admin"); await response.arrayBuffer(); assert.equal(response.status, 307); assert.equal(new URL(response.headers.get("location")!, origin).pathname, "/login"); });
  await check("real-password-session-user-cannot-open-admin", async () => { const response = await get("/admin", userCookie); await response.arrayBuffer(); assert.equal(response.status, 307); assert.equal(new URL(response.headers.get("location")!, origin).pathname, "/"); });
  await check("real-password-session-staff-can-open-admin", async () => { const response = await get("/admin", staffCookie); const body = await response.text(); assert.equal(response.status, 200); assert.ok(body.includes("Dashboard")); assert.equal(body.includes(service), false); });
  await check("ordinary-user-cannot-use-admin-write-api", async () => { const response = await fetch(origin + "/api/admin/produtos", { method: "POST", headers: { cookie: userCookie, "content-type": "application/json" }, body: "{}", signal: AbortSignal.timeout(45_000) }); await response.arrayBuffer(); assert.equal(response.status, 401); });
  await check("staff-reaches-admin-body-validation", async () => { const response = await fetch(origin + "/api/admin/produtos", { method: "POST", headers: { cookie: staffCookie, "content-type": "application/json" }, body: "{}", signal: AbortSignal.timeout(45_000) }); await response.arrayBuffer(); assert.equal(response.status, 400); });
  await check("forged-session-is-rejected-by-real-auth", async () => {
    const expires = Math.floor(Date.now() / 1000) + 3600;
    const token = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: userId, role: "authenticated", exp: expires })).toString("base64url")}.invalid-signature`;
    const session = { access_token: token, refresh_token: "not-a-real-refresh-token", expires_at: expires, token_type: "bearer", user: { id: userId } };
    const name = userCookie.split("=")[0]!.replace(/\.\d+$/, "");
    const response = await get("/admin", `${name}=base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`);
    await response.arrayBuffer(); assert.equal(response.status, 307); assert.equal(new URL(response.headers.get("location")!, origin).pathname, "/login");
  });
  await check("affiliate-redirect-persists-local-click-without-following-merchant", async () => {
    const response = await fetch(`${origin}/r/${productId}?o=produto`, { redirect: "manual", headers: { "user-agent": "Mozilla/5.0 Chrome/140 Safari/537.36" }, signal: AbortSignal.timeout(45_000) });
    await response.arrayBuffer(); assert.equal(response.status, 302); assert.equal(new URL(response.headers.get("location")!).hostname, "www.amazon.com.br");
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  });
  await check("persisted-events-are-readable-by-report", async () => {
    const summary = await carregarMovimento(since, until); assert.equal(summary.complete, true); assert.equal(summary.totalEventos - beforeSummary.totalEventos, 14);
    for (const tipo of EVENT_TYPES) assert.equal((summary.counts[tipo] ?? 0) - (beforeSummary.counts[tipo] ?? 0), 1);
    assert.equal(summary.redirectRequests - beforeSummary.redirectRequests, 1);
    assert.equal(summary.registrations - beforeSummary.registrations, 2);
  });
  await check("service-role-is-not-in-browser-assets", async () => {
    let scanned = 0;
    async function scan(directory: string): Promise<void> {
      for await (const entry of await fs.promises.opendir(directory)) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) { await scan(file); continue; }
        if (!entry.isFile() || !/\.(js|json|css|map)$/.test(entry.name)) continue;
        let carry = Buffer.alloc(0);
        for await (const chunk of fs.createReadStream(file, { highWaterMark: 65536 })) {
          const bytes = Buffer.concat([carry, chunk]);
          assert.equal(bytes.includes(Buffer.from(service)), false, "local_service_role_in_browser_asset");
          carry = bytes.subarray(Math.max(0, bytes.length - service.length + 1));
        }
        scanned++;
      }
    }
    await scan(path.join(app, ".next/static")); assert.ok(scanned > 0);
  });

  const report = { checkedAt: new Date().toISOString(), mode: "Real local Supabase Auth/PostgREST/Postgres and Next dev HTTP; synthetic accounts only", databaseOrigin: target.origin,
    schema: "Reference fixture informed by current OpenAPI columns; production constraints, grants and triggers were not exported",
    checks, passed: checks.filter(item => item.passed).length, failed: checks.filter(item => !item.passed).length,
    productionWrites: false, externalFetchAllowed: false, browserTest: false, limits: ["Local reference policies do not prove production policy parity", "Password login exercised via Supabase SSR SDK and HTTP cookies, not a browser", "OAuth, password recovery and production Cloudflare runtime not covered"] };
  const output = path.join(root, `docs/evidence/auth-measurement-lab-${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
  process.stdout.write(JSON.stringify({ passed: report.passed, failed: report.failed, failures: checks.filter(item => !item.passed).map(item => item.name), evidence: path.relative(root, output) }) + "\n");
  if (report.failed) process.exitCode = 1;
}
main().catch(error => { process.stderr.write(`auth_lab_failed:${error instanceof Error ? error.name : "unknown"}\n`); process.exitCode = 1; }).finally(stop);
