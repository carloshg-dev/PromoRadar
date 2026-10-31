import test from "node:test";
import assert from "node:assert/strict";
import { publicCacheFetch } from "../../src/infrastructure/cloudflare/public-response-cache";

const html = '<main data-public-cache="ready">Preço coletado: R$ 99,90</main>';
class LabCache {
  clock = 0;
  reads = 0;
  records = new Map<string, { response: Response; expires: number }>();
  async match(request: Request): Promise<Response | undefined> {
    this.reads++;
    const entry = this.records.get(request.url);
    return entry && entry.expires > this.clock ? entry.response.clone() : undefined;
  }
  async put(request: Request, response: Response): Promise<void> {
    const bytes = await response.arrayBuffer();
    const ttl = Number(response.headers.get("cache-control")?.match(/max-age=(\d+)/)?.[1]);
    this.records.set(request.url, { response: new Response(bytes, response), expires: this.clock + ttl * 1000 });
  }
}
function harness(factory: () => Response = () => new Response(html, { headers: { "content-type": "text/html" } })) {
  const cache = new LabCache();
  let renders = 0;
  return {
    cache,
    get renders() { return renders; },
    async read(path = "/ofertas", init?: RequestInit, build = "build-one") {
      const pending: Promise<unknown>[] = [];
      const response = await publicCacheFetch(new Request(new URL(path, "https://site.test"), init), build, cache,
        { waitUntil(task) { pending.push(task); } }, async () => { renders++; return factory(); });
      const text = await response.text();
      await Promise.all(pending);
      return { response, text };
    },
  };
}

test("cache público preserva corpo/preço, dispensa renderização quente e expira em dois minutos", async () => {
  const lab = harness();
  const first = await lab.read();
  assert.equal(first.response.headers.get("x-promodetec-cache"), "MISS");
  const second = await lab.read();
  assert.equal(second.response.headers.get("x-promodetec-cache"), "HIT");
  assert.equal(second.text, html);
  assert.equal(second.response.headers.get("cache-control"), "private, no-store");
  assert.equal(lab.renders, 1);
  lab.cache.clock += 120_001;
  assert.equal((await lab.read()).response.headers.get("x-promodetec-cache"), "MISS");
  assert.equal(lab.renders, 2);
});

test("login, medição, saída afiliada, métodos e credenciais nunca consultam o cache público", async () => {
  const lab = harness();
  for (const path of ["/login", "/cadastro", "/admin", "/onboarding", "/auth/callback", "/api/track", "/api/search?q=fone", "/r/123", "/_promodetec-cache/build-one/key"]) await lab.read(path);
  for (const init of [
    { method: "POST" }, { method: "HEAD" },
    { headers: { authorization: "Bearer session" } }, { headers: { cookie: "sb-project-auth-token.0=session" } },
    { headers: { cookie: "__prerender_bypass=preview" } }, { headers: { cookie: "unknown_personalization=value" } },
    { headers: { range: "bytes=0-20" } }, { headers: { "next-action": "action" } },
    { headers: { "x-prerender-revalidate": "secret" } }, { headers: { "x-middleware-subrequest": "middleware" } },
    { headers: { "x-invoke-path": "/admin" } }, { headers: { "x-matched-path": "/admin" } },
    { headers: { "x-forwarded-host": "foreign.test" } },
    { headers: { "cache-control": "no-cache" } },
  ] as RequestInit[]) await lab.read("/ofertas", init);
  assert.equal(lab.cache.reads, 0);
  assert.equal(lab.cache.records.size, 0);
});

test("somente rotas e parâmetros conhecidos entram no cache, com tamanho limitado", async () => {
  const lab = harness();
  for (const path of ["/ofertas?busca=" + "a".repeat(161), "/ofertas?pagina=1&pagina=2", "/ofertas?unknown=value", "/categoria/a%2fb", "/ofertas?busca=" + "a".repeat(2100)]) await lab.read(path);
  await lab.read("/ofertas", { headers: { "next-router-state-tree": "a".repeat(8193) } });
  assert.equal(lab.cache.reads, 0);
});

test("filtros, host e build não compartilham uma resposta incorreta", async () => {
  const lab = harness();
  for (const path of ["/ofertas?ate=100", "/ofertas?ate=300", "/ofertas?busca=fone", "/ofertas?busca=creatina", "https://other.test/ofertas?ate=100"]) await lab.read(path);
  await lab.read("/ofertas?ate=100", undefined, "build-two");
  assert.equal(lab.renders, 6);
  assert.equal((await lab.read("/ofertas?ate=100")).response.headers.get("x-promodetec-cache"), "HIT");
});

test("HTML, RSC e árvores diferentes não se misturam; nonce RSC não duplica a mesma variante", async () => {
  let rsc = false;
  const lab = harness(() => new Response(rsc ? '0:["main",{"data-public-cache":"ready"}]' : html,
    { headers: { "content-type": rsc ? "text/x-component" : "text/html", vary: "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Url, Accept-Encoding" } }));
  await lab.read();
  rsc = true;
  const headers = { rsc: "1", "next-router-state-tree": "tree-one", "next-url": "/" };
  await lab.read("/ofertas?_rsc=nonce-one", { headers });
  assert.equal((await lab.read("/ofertas?_rsc=nonce-two", { headers })).response.headers.get("x-promodetec-cache"), "HIT");
  await lab.read("/ofertas?_rsc=nonce-three", { headers: { ...headers, "next-router-state-tree": "tree-two" } });
  assert.equal(lab.renders, 3);
  assert.equal((await lab.read()).text, html);
});

test("cookies Cloudflare/analytics sem estado no servidor não eliminam a economia", async () => {
  const lab = harness();
  await lab.read();
  const result = await lab.read("/ofertas", { headers: { cookie: "cf_clearance=proof; _ga=metrics; _clck=metrics" } });
  assert.equal(result.response.headers.get("x-promodetec-cache"), "HIT");
  assert.equal(lab.renders, 1);
});

test("Set-Cookie, redirects, erros, Vary desconhecido e fallback 200 não são guardados", async () => {
  const cases: [string, ResponseInit][] = [
    [html, { status: 500 }], [html, { status: 503 }], [html, { status: 404 }],
    [html, { status: 302, headers: { location: "/login" } }],
    [html, { headers: { "set-cookie": "session=value" } }],
    [html, { headers: { vary: "Cookie" } }], [html, { headers: { vary: "*" } }],
    ['<main data-public-cache="unavailable">Tente novamente</main>', {}],
    ["Sem marcador de integridade", {}],
  ];
  for (const [body, init] of cases) {
    const lab = harness(() => new Response(body, { ...init, headers: { "content-type": "text/html", ...Object.fromEntries(new Headers(init.headers)) } }));
    await lab.read(); await lab.read();
    assert.equal(lab.cache.records.size, 0);
    assert.equal(lab.renders, 2);
  }
});

test("falhas de cache não mudam o corpo/status da resposta original", async () => {
  const lab = harness();
  lab.cache.match = async () => { throw new Error("cache_down"); };
  lab.cache.put = async () => { throw new Error("cache_full"); };
  assert.equal((await lab.read()).text, html);
});

test("bypass preserva cookies separados, status e destino da autenticação", async () => {
  const cookies = ["session=one; Path=/; HttpOnly; Secure", "session-extra=two; Path=/; Expires=Wed, 21 Oct 2037 07:28:00 GMT; HttpOnly"];
  const headers = new Headers({ location: "/conta", "cache-control": "no-store" });
  for (const value of cookies) headers.append("set-cookie", value);
  const lab = harness(() => new Response(null, { status: 303, headers }));
  const result = await lab.read("/auth/callback?code=lab");
  assert.equal(result.response.status, 303);
  assert.equal(result.response.headers.get("location"), "/conta");
  assert.deepEqual(result.response.headers.getSetCookie(), cookies);
  assert.equal(result.response.headers.get("cache-control"), "no-store");
  assert.equal(lab.cache.reads, 0);
});

test("prefixo e UTF-8 em chunks preservam todos os bytes, sem carregar a resposta inteira", async () => {
  const bytes = new TextEncoder().encode(html + "conteúdo".repeat(20_000));
  const lab = harness(() => new Response(new ReadableStream<Uint8Array>({
    start(controller) { for (let i = 0; i < bytes.length; i += 23) controller.enqueue(bytes.subarray(i, i + 23)); controller.close(); },
  }), { headers: { "content-type": "text/html" } }));
  assert.equal((await lab.read()).text, new TextDecoder().decode(bytes));
  assert.equal((await lab.read()).text, new TextDecoder().decode(bytes));
  assert.equal(lab.renders, 1);
});

test("corpos maiores que um MiB ou sem marcador no prefixo não ocupam o cache", async () => {
  for (const body of ["a".repeat(66 * 1024) + html, html + "a".repeat(1024 * 1024)]) {
    const lab = harness(() => new Response(body, { headers: { "content-type": "text/html" } }));
    assert.equal((await lab.read()).text, body);
    assert.equal(lab.cache.records.size, 0);
  }
});

test("mil leituras em lotes concorrentes de cache quente não repetem a renderização", async () => {
  const lab = harness();
  await lab.read();
  for (let batch = 0; batch < 16; batch++) {
    const results = await Promise.all(Array.from({ length: 64 }, () => lab.read()));
    assert.ok(results.every(result => result.text === html && result.response.headers.get("x-promodetec-cache") === "HIT"));
  }
  assert.equal(lab.renders, 1);
});
