import test, { after } from "node:test";
import assert from "node:assert/strict";
import { listarOfertas, listarOfertasPaginado, listarUrlsProdutos } from "../../src/infrastructure/repositories/produtos.repo";

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
