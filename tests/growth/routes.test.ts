import test, { after } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST } from "../../src/app/api/track/route";
import { GET as outbound, HEAD } from "../../src/app/r/[id]/route";
import { refreshSession } from "../../src/infrastructure/supabase/middleware";
import { historicoPrecos } from "../../src/infrastructure/repositories/produtos.repo";
import { GET as quickSearch } from "../../src/app/api/search/route";

const id = "12345678-1234-4234-8234-123456789abc";
const ua = "Mozilla/5.0 Chrome/140 Safari/537.36";
const priorUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const priorKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const priorAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://db.test";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key-without-real-access";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-without-real-access";
after(() => {
  if (priorUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = priorUrl;
  if (priorKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = priorKey;
  if (priorAnon === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = priorAnon;
});
const payload = { consent: "accepted", events: [{ tipo: "salvar_produto", produtoId: id, origem: "produto" }] };
const req = (body: unknown, headers: Record<string, string> = {}) => new NextRequest("https://site.test/api/track", {
  method: "POST", headers: { origin: "https://site.test", "user-agent": ua, "content-type": "application/json", ...headers }, body: JSON.stringify(body),
});

test("analytics rejeita origem externa, ausência de consentimento, robôs e corpo excessivo sem tocar no banco", async (context) => {
  let calls = 0;
  context.mock.method(globalThis, "fetch", async () => { calls++; throw new Error("external_access_forbidden"); });
  for (const request of [req(payload, { origin: "https://foreign.test" }), req({ tipo: "ver_produto" }), req(payload, { "user-agent": "Googlebot" }), req(payload, { "sec-gpc": "1" }), req(payload, { dnt: "1" }), req({ ...payload, padding: "x".repeat(9000) })]) {
    assert.equal((await POST(request)).status, 204);
  }
  assert.equal(calls, 0);
});

test("medição local usa a autoridade HTTP mesmo quando Next normaliza o endereço", async (context) => {
  let writes = 0;
  context.mock.method(globalThis, "fetch", async () => { writes++; return new Response(null, { status: 201 }); });
  const response = await POST(new NextRequest("http://127.0.0.1:3216/api/track", {
    method: "POST", headers: { host: "127.0.0.1:3216", origin: "http://127.0.0.1:3216", "user-agent": ua, "content-type": "application/json" }, body: JSON.stringify(payload),
  }));
  assert.equal(response.status, 204);
  assert.equal(writes, 1);
});

test("autoridade HTTP não permite origem irmã ou Host com credenciais/caminho", async (context) => {
  context.mock.method(globalThis, "fetch", async () => { throw new Error("external_access_forbidden"); });
  for (const host of ["127.0.0.1:3216", "site.test@foreign.test", "site.test/path", "site.test\\foreign.test"]) {
    const response = await POST(new NextRequest("http://127.0.0.1:3216/api/track", {
      method: "POST", headers: { host, origin: host === "127.0.0.1:3216" ? "http://localhost:3216" : "http://foreign.test", "user-agent": ua, "content-type": "application/json" }, body: JSON.stringify(payload),
    }));
    assert.equal(response.status, 204);
  }
});

function sessionCookie() {
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const accessToken = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: id, exp: expires })).toString("base64url")}.test-signature`;
  const session = { access_token: accessToken, refresh_token: "test-refresh", expires_at: expires, token_type: "bearer", user: { id } };
  return `sb-db-auth-token=base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
}

test("cookie forjado não autoriza rota protegida: Auth precisa validar a identidade", async (context) => {
  let validations = 0;
  context.mock.method(globalThis, "fetch", async (url: unknown) => {
    assert.equal(String(url), "https://db.test/auth/v1/user");
    validations++;
    return new Response(JSON.stringify({ message: "Invalid JWT", code: "bad_jwt" }), { status: 401, headers: { "Content-Type": "application/json" } });
  });
  const response = await refreshSession(new NextRequest("https://site.test/admin", { headers: { cookie: sessionCookie() } }));
  assert.equal(validations, 1);
  assert.equal(response.headers.get("location"), "https://site.test/login?next=%2Fadmin");
});

test("sessão verificada segue para a rota, onde o papel continua sendo conferido", async (context) => {
  let validations = 0;
  context.mock.method(globalThis, "fetch", async (url: unknown) => {
    assert.equal(String(url), "https://db.test/auth/v1/user");
    validations++;
    return new Response(JSON.stringify({ id, aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() }), { headers: { "Content-Type": "application/json" } });
  });
  const response = await refreshSession(new NextRequest("https://site.test/admin", { headers: { cookie: sessionCookie() } }));
  assert.equal(validations, 1);
  assert.equal(response.headers.get("x-middleware-next"), "1");
});

test("gráfico limitado usa os pontos mais recentes, apresentados em ordem cronológica", async (context) => {
  context.mock.method(globalThis, "fetch", async (url: unknown) => {
    const query = new URL(String(url));
    assert.equal(query.pathname, "/rest/v1/historico_precos");
    assert.equal(query.searchParams.get("order"), "coletado_em.desc");
    assert.equal(query.searchParams.get("limit"), "2");
    return new Response(JSON.stringify([{ preco: 90, coletado_em: "2026-10-19" }, { preco: 110, coletado_em: "2026-10-18" }]), { headers: { "Content-Type": "application/json" } });
  });
  const points = await historicoPrecos(id, 2);
  assert.deepEqual(points.map((point) => point.preco), [110, 90]);
});

test("lote consentido faz uma escrita e remove campos privados", async (context) => {
  let saved: unknown[] = [];
  context.mock.method(globalThis, "fetch", async (_url: unknown, init?: RequestInit) => {
    assert.equal(init?.method, "POST");
    saved = JSON.parse(String(init?.body));
    return new Response(null, { status: 201 });
  });
  const response = await POST(req({ ...payload, events: [...payload.events, { tipo: "busca", termo: "user@example.com", email: "private@example.com" }] }));
  assert.equal(response.status, 204);
  assert.equal(saved.length, 2);
  assert.equal(JSON.stringify(saved).includes("example.com"), false);
  assert.equal(JSON.stringify(saved).includes("cidade"), false);
});

test("falha de persistência não se disfarça de coleta bem sucedida", async (context) => {
  context.mock.method(console, "warn", () => {});
  context.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ code: "42501", message: "denied" }), { status: 403, headers: { "Content-Type": "application/json" } }));
  assert.equal((await POST(req(payload))).status, 503);
});

test("HEAD, prefetch e robôs não geram consulta, clique ou visita à rede afiliada", async (context) => {
  context.mock.method(globalThis, "fetch", async () => { throw new Error("external_access_forbidden"); });
  assert.equal((await HEAD()).status, 204);
  assert.equal((await outbound(new NextRequest(`https://site.test/r/${id}`, { headers: { "user-agent": ua, purpose: "prefetch" } }), { params: { id } })).status, 204);
  const response = await outbound(new NextRequest(`https://site.test/r/${id}`, { headers: { "user-agent": "Googlebot" } }), { params: { id } });
  assert.equal(response.headers.get("location"), `https://site.test/produto/${id}`);
});

test("redirect afiliado continua funcionando quando a medição falha", async (context) => {
  context.mock.method(console, "warn", () => {});
  context.mock.method(globalThis, "fetch", async (_url: unknown, init?: RequestInit) => {
    if (init?.method === "POST") throw new Error("offline");
    return new Response(JSON.stringify({ id, url: "https://www.amazon.com.br/dp/B000000001", loja_slug: "amazon" }), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  const response = await outbound(new NextRequest(`https://site.test/r/${id}?o=produto`, { headers: { "user-agent": ua } }), { params: { id } });
  assert.equal(response.status, 302);
  assert.equal(new URL(response.headers.get("location")!).hostname, "www.amazon.com.br");
  assert.ok(new URL(response.headers.get("location")!).searchParams.has("tag"));
});

test("página pública sem sessão não consulta Auth; rota privada redireciona", async (context) => {
  let calls = 0;
  context.mock.method(globalThis, "fetch", async () => { calls++; throw new Error("external_access_forbidden"); });
  const response = await refreshSession(new NextRequest("https://site.test/ofertas"));
  assert.equal(response.headers.get("x-middleware-next"), "1");
  const protectedResponse = await refreshSession(new NextRequest("https://site.test/admin?token=private"));
  assert.equal(protectedResponse.headers.get("location"), "https://site.test/login?next=%2Fadmin");
  assert.equal(calls, 0);
});

test("busca rápida consulta apenas preços recentes, positivos e disponíveis, sem expor URL afiliada", async (context) => {
  let calls = 0;
  context.mock.method(globalThis, "fetch", async (url: unknown) => {
    calls++;
    const query = new URL(String(url));
    assert.equal(query.hostname, "db.test");
    assert.equal(query.pathname, "/rest/v1/vw_ofertas");
    assert.equal(query.searchParams.get("em_estoque"), "eq.true");
    assert.equal(query.searchParams.get("preco_atual"), "gt.0");
    const bounds = query.searchParams.getAll("atualizado_em");
    assert.equal(bounds.length, 2);
    const lower = bounds.find((bound) => bound.startsWith("gte."))!;
    const upper = bounds.find((bound) => bound.startsWith("lte."))!;
    assert.equal(Date.parse(upper.slice(4)) - Date.parse(lower.slice(4)), 7 * 86_400_000);
    return Response.json([{ id, titulo: "Fone", preco_atual: 99, promo_score: 90, url: "https://www.amazon.com.br/dp/B000000001" }]);
  });
  assert.deepEqual(await (await quickSearch(new Request("https://site.test/api/search?q=f"))).json(), { produtos: [] });
  assert.equal(calls, 0);
  const response = await quickSearch(new Request("https://site.test/api/search?q=fone"));
  assert.equal(response.status, 200);
  assert.equal(calls, 1);
  const body = await response.json();
  assert.equal(body.produtos.length, 1);
  assert.equal("url" in body.produtos[0], false);
});

test("busca indisponível não se apresenta como busca sem resultados", async (context) => {
  context.mock.method(globalThis, "fetch", async () => Response.json({ code: "57014", message: "timeout" }, { status: 500 }));
  const response = await quickSearch(new Request("https://site.test/api/search?q=fone"));
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { produtos: [], error: "search_unavailable" });
});
