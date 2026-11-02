import test, { after } from "node:test";
import assert from "node:assert/strict";
import { listarOfertas, listarOfertasPaginado, listarUrlsProdutos, top5DoDia } from "../../src/infrastructure/repositories/produtos.repo";

const priorUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const priorKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://db.test";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "fake-anon-no-real-access";
after(() => {
  if (priorUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = priorUrl;
  if (priorKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = priorKey;
});

function assertRecent(query: URL) {
  assert.equal(query.hostname, "db.test"); assert.equal(query.pathname, "/rest/v1/vw_ofertas");
  assert.equal(query.searchParams.get("em_estoque"), "eq.true");
  assert.equal(query.searchParams.get("preco_atual"), "gt.0");
  const window = query.searchParams.getAll("atualizado_em");
  assert.equal(window.length, 2);
  const lower = window.find(value => value.startsWith("gte."))!;
  const upper = window.find(value => value.startsWith("lte."))!;
  assert.equal(Date.parse(upper.slice(4)) - Date.parse(lower.slice(4)), 7 * 86_400_000);
}

test("busca, categoria e loja paginadas excluem oferta antiga, futura, sem estoque ou preço positivo", async context => {
  let calls = 0;
  context.mock.method(globalThis, "fetch", async (url: unknown, init?: RequestInit) => {
    calls++; const query = new URL(String(url)); assertRecent(query); assert.ok(init?.signal);
    assert.match(query.searchParams.get("order") ?? "", /id\.asc/);
    return new Response("[]", { headers: { "content-type": "application/json", "content-range": "*/0" } });
  });
  for (const filters of [{ busca: "fone" }, { categoria: "fones-bluetooth" }, { loja: "amazon", pagina: 2 }, { pagina: 25 }]) {
    assert.deepEqual(await listarOfertasPaginado(filters), { produtos: [], total: 0 });
  }
  assert.equal(calls, 4);
});

test("recomendações fora da home obedecem à mesma janela de preço", async context => {
  context.mock.method(globalThis, "fetch", async (url: unknown) => { assertRecent(new URL(String(url))); return Response.json([]); });
  assert.deepEqual(await listarOfertas({ categoria: "fones-bluetooth", limit: 4 }), []);
});

test("falha de consulta paginada não vira catálogo vazio válido", async context => {
  context.mock.method(globalThis, "fetch", async () => Response.json({ code: "57014", message: "timeout" }, { status: 500 }));
  await assert.rejects(listarOfertasPaginado({ busca: "fone" }));
});

test("timeout da contagem recupera só a página com os mesmos filtros e sem inventar total", async context => {
  let calls = 0;
  context.mock.method(globalThis, "fetch", async (url: unknown, init?: RequestInit) => {
    calls++; const query = new URL(String(url)); assertRecent(query);
    assert.ok(query.searchParams.getAll("preco_atual").includes("lte.300"));
    if (calls === 1) { assert.match(new Headers(init?.headers).get("prefer") ?? "", /count=exact/); return Response.json({ code: "57014", message: "timeout" }, { status: 500 }); }
    assert.equal(query.searchParams.get("limit"), "61"); assert.ok(!new Headers(init?.headers).get("prefer")?.includes("count=exact"));
    return Response.json(Array.from({ length: 61 }, (_, i) => ({ id: String(i), titulo: "Produto", preco_atual: 20, em_estoque: true })));
  });
  const result = await listarOfertasPaginado({ maxPreco: 300 });
  assert.equal(calls, 2); assert.equal(result.produtos.length, 60); assert.equal(result.total, null); assert.equal(result.hasMore, true);
});

test("posts automáticos não promovem moeda pendente, foto genérica, preço antigo ou acima do teto", async context => {
  const item = { id: "valid", titulo: "Fone", loja_slug: "amazon", loja_nome: "Amazon", categoria_slug: "fones-bluetooth", url: "https://www.amazon.com.br/dp/B0TEST", imagem_url: "https://cdn.test/product.jpg", em_estoque: true, preco_atual: 99, desconto_pct: 25, atualizado_em: new Date().toISOString() };
  context.mock.method(globalThis, "fetch", async (_url: unknown, init?: RequestInit) => {
    assert.ok(init?.signal);
    return Response.json([item, { ...item, id: "currency", loja_slug: "aliexpress" }, { ...item, id: "photo", imagem_url: "https://images2.productserve.com/noimage.gif" }, { ...item, id: "old", atualizado_em: "2020-01-01" }, { ...item, id: "costly", preco_atual: 6000 }]);
  });
  assert.deepEqual((await top5DoDia()).map(item => item.id), ["valid"]);
});

test("curadoria usa amostra por chave com prazo, sem ordenação global nem filtros caros da vitrine", async context => {
  context.mock.method(globalThis, "fetch", async (url: unknown, init?: RequestInit) => {
    const query = new URL(String(url));
    assert.equal(query.searchParams.get("order"), "id.asc");
    assert.equal(query.searchParams.get("limit"), "400");
    assert.equal(query.searchParams.get("imagem_url"), null);
    assert.ok(init?.signal);
    return Response.json({ code: "57014", message: "timeout" }, { status: 500 });
  });
  await assert.rejects(top5DoDia());
});

test("teto e fotos genéricas são filtrados no banco antes da contagem/paginação", async context => {
  const limits: (string | null)[] = [];
  context.mock.method(globalThis, "fetch", async (url: unknown) => {
    const query = new URL(String(url));
    limits.push(query.searchParams.getAll("preco_atual").find(value => value.startsWith("lte.")) ?? null);
    const images = query.searchParams.getAll("imagem_url");
    assert.ok(images.includes("not.is.null"));
    assert.ok(images.includes("not.ilike.%noimage%"));
    assert.ok(images.includes("not.ilike.%://www.dufrio.com.br/media/catalog/product/%"));
    assert.ok(images.includes("not.ilike.%://dufrio.com.br/media/catalog/product/%"));
    assert.equal(query.searchParams.get("loja_slug"), "not.in.(aliexpress)");
    return new Response("[]", { headers: { "content-type": "application/json", "content-range": "*/0" } });
  });
  await listarOfertasPaginado();
  await listarOfertasPaginado({ maxPreco: 300, pagina: 2 });
  await listarOfertasPaginado({ maxPreco: null });
  assert.deepEqual(limits, ["lte.1000", "lte.300", null]);
});

test("uma página de 60 ofertas não transfere um pool de 1000 produtos para promover comissão", async context => {
  context.mock.method(globalThis, "fetch", async (url: unknown) => {
    const query = new URL(String(url));
    assert.equal(query.searchParams.get("offset"), "0");
    assert.equal(query.searchParams.get("limit"), "60");
    return new Response("[]", { headers: { "content-type": "application/json", "content-range": "*/0" } });
  });
  await listarOfertasPaginado({ limit: 60 });
});

test("sitemap usa uma amostra por cursor e só publica produtos recentes, disponíveis e com preço", async context => {
  let calls = 0;
  context.mock.method(globalThis, "fetch", async (url: unknown) => {
    calls++; const query = new URL(String(url));
    assert.equal(query.pathname, "/rest/v1/produtos"); assert.equal(query.searchParams.get("order"), "id.asc");
    assert.equal(query.searchParams.get("limit"), "1000");
    assert.equal(query.searchParams.has("atualizado_em"), false);
    const row = { id: "12345678-1234-4234-8234-123456789abc", atualizado_em: new Date(Date.now() - 1000).toISOString(), em_estoque: true, preco_atual: 99 };
    return Response.json([row, { ...row, em_estoque: false }, { ...row, preco_atual: 0 }, { ...row, atualizado_em: "2020-01-01" }]);
  });
  assert.equal((await listarUrlsProdutos()).length, 1); assert.equal(calls, 1);
});
