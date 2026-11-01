import test from "node:test";
import assert from "node:assert/strict";
import type { Produto } from "../../src/core/domain/types";
import { selectStoreRecommendations } from "../../src/core/store-recommendations";
import { alternativasParaLoja } from "../../src/infrastructure/repositories/produtos.repo";

const now = Date.parse("2026-11-01T12:00:00Z");
const row = { id: "one", titulo: "Fone", lojaSlug: "kabum", precoAtual: 25, emEstoque: true, imagemUrl: "https://cdn.test/photo.jpg", atualizadoEm: new Date(now - 1000).toISOString() } as Produto;

test("alternativas preservam orçamento, recência, imagem, identidade e preço, inclusive lojas do comparador", () => {
  const selection = selectStoreRecommendations([row, row, { ...row, id: "cheaper", precoAtual: 9 },
    { ...row, id: "costly", precoAtual: 21 }, { ...row, id: "old", atualizadoEm: "2020-01-01" },
    { ...row, id: "future", atualizadoEm: "2027-01-01" }, { ...row, id: "image", imagemUrl: "https://cdn.test/noimage.gif" },
    { ...row, id: "currency", lojaSlug: "aliexpress" }, { ...row, id: "stock", emEstoque: false }], 20, now);
  assert.deepEqual(selection.map(p => p.id), ["cheaper"]); assert.equal(selection[0]?.lojaSlug, "kabum");
  assert.deepEqual(selectStoreRecommendations([row, { ...row, id: "over-300", precoAtual: 301 }], null, now).map(p => p.id), ["one"]);
});

test("recuperação usa quatro pools limitados, não esconde falha nem atribui produto de outra loja à escolhida", async context => {
  const beforeUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, beforeKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fixture.test"; process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "fixture-anon";
  let calls = 0;
  context.mock.method(globalThis, "fetch", async (input: unknown, init?: RequestInit) => {
    calls++; const url = new URL(String(input)), slug = url.searchParams.get("loja_slug")?.slice(3);
    assert.equal(url.hostname, "fixture.test"); assert.equal(url.searchParams.get("limit"), "96");
    assert.equal(url.searchParams.get("order"), "id.asc"); assert.ok(init?.signal);
    assert.equal(new Headers(init?.headers).get("prefer")?.includes("count="), undefined);
    if (slug === "eudora") return Response.json({ code: "57014", message: "timeout" }, { status: 500 });
    return Response.json(slug === "shopee" ? [{ id: "shopee-real", titulo: "Chocolate", loja_slug: "shopee", loja_nome: "Shopee", url: "https://s.shopee.com.br/real", preco_atual: 12, imagem_url: "https://cdn.test/photo.jpg", em_estoque: true, atualizado_em: new Date(Date.now() - 1000).toISOString() }] : []);
  });
  try {
    const result = await alternativasParaLoja("carrefour", 20);
    assert.equal(calls, 4); assert.equal(result.partial, true); assert.equal(result.mesmaLoja, false);
    assert.deepEqual(result.produtos.map(p => [p.id, p.lojaSlug, p.precoAtual]), [["shopee-real", "shopee", 12]]);
  } finally {
    if (beforeUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = beforeUrl;
    if (beforeKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = beforeKey;
  }
});
