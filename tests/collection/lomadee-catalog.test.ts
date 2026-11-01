import test from "node:test";
import assert from "node:assert/strict";
import { lomadeeAffordableCandidates, shopifyAvailablePrice } from "../../src/core/lomadee-catalog";
import { LomadeeAdapter } from "../../src/infrastructure/scraping/adapters/lomadee.adapter";

test("Shopify não combina o preço de uma variante com a referência de outra ou usa esgotados", () => {
  assert.deepEqual(shopifyAvailablePrice([{ price: "1", compare_at_price: "900", available: false },
    { price: "100", compare_at_price: "120", available: true }, { price: "200", compare_at_price: "800", available: true }]), { precoAtual: 100, precoOriginal: 120 });
  assert.equal(shopifyAvailablePrice([{ price: "9", available: false }, { price: "10" }]), null);
  assert.deepEqual(shopifyAvailablePrice([{ price: "8", available: true, compare_at_price: "7" }]), { precoAtual: 8, precoOriginal: null });
});

test("Lomadee prioriza preços acessíveis, aceita catálogo pequeno e exclui foto genérica e preço inválido", () => {
  const row = { skuBase: "1", titulo: "Organizador de gaveta", urlProduto: "https://loja.test/produto", imagemUrl: "https://cdn.test/photo.jpg", precoAtual: 25 };
  const result = lomadeeAffordableCandidates([row, row, { ...row, skuBase: "cheap", precoAtual: 9 },
    { ...row, skuBase: "large", precoAtual: 6000 }, { ...row, skuBase: "invalid", precoAtual: NaN },
    { ...row, skuBase: "photo", imagemUrl: "https://cdn.test/noimage.gif" }], 250);
  assert.deepEqual(result.map(p => p.skuBase), ["cheap", "1"]);
});

test("falha de marcas é reportada como coleta incompleta, sem cunhar links nem alterar produtos", async context => {
  const before = process.env.LOMADEE_API_KEY;
  process.env.LOMADEE_API_KEY = "fixture-key";
  let calls = 0; const failures: string[] = [];
  context.mock.method(globalThis, "fetch", async (_url: unknown, init?: RequestInit) => {
    calls++; assert.ok(!init?.method || init.method === "GET"); return new Response("", { status: 503 });
  });
  try {
    assert.deepEqual(await new LomadeeAdapter().coletar({ log: () => {}, reportFailure: code => failures.push(code) }), []);
    assert.deepEqual(failures, ["lomadee_brands_incomplete"]); assert.equal(calls, 1);
    await assert.rejects(new LomadeeAdapter().coletar({ log: () => {} }), /lomadee_brands_incomplete/);
  } finally { if (before === undefined) delete process.env.LOMADEE_API_KEY; else process.env.LOMADEE_API_KEY = before; }
});

test("adapter preserva configuração de tipo legado e valida a instância real da resposta do encurtador", async context => {
  const beforeKey = process.env.LOMADEE_API_KEY, beforeChannel = process.env.LOMADEE_SOURCE_ID;
  process.env.LOMADEE_API_KEY = "fixture-key";
  try {
    for (const [expected, returned, accepted] of [["comparator-type", "owner-channel", true], ["owner-channel", "owner-channel", true], ["comparator-type", "different-channel", false]] as const) {
      process.env.LOMADEE_SOURCE_ID = expected;
      const failures: string[] = []; let posts = 0;
      const channel = { id: "owner-channel", availableChannel: { id: "comparator-type", name: "PriceComparator" }, shortUrls: ["https://lmdee.link/fixture"] };
      context.mock.method(globalThis, "fetch", async (input: unknown, init?: RequestInit) => {
        const url = new URL(String(input));
        if (url.pathname.endsWith("/brands")) return Response.json({ data: [{ id: "brand", name: "Sieno Perfumes", network: { active: true }, channels: [channel] }], pagination: { page: 1, totalPages: 1 } });
        if (url.pathname.endsWith("/products.json")) return Response.json({ products: [{ id: 1, title: "Perfume real", handle: "perfume", images: [{ src: "https://cdn.test/photo.jpg" }], variants: [{ available: true, price: "49.90", compare_at_price: "59.90" }] }] });
        assert.equal(url.pathname, "/affiliate/shortener/url"); assert.equal(init?.method, "POST"); posts++;
        assert.deepEqual(Object.keys(JSON.parse(String(init?.body))).sort(), ["organizationId", "type", "url"]);
        return Response.json([{ ...channel, id: returned }], { status: 201 });
      });
      const rows = await new LomadeeAdapter().coletar({ log: () => {}, reportFailure: code => failures.push(code) });
      assert.equal(posts, 1); assert.equal(rows.length, accepted ? 1 : 0);
      assert.deepEqual(failures, accepted ? [] : ["lomadee_affiliate_link_failed"]);
      if (accepted) assert.equal(rows[0]?.precoAtual, 49.9);
      context.mock.restoreAll();
    }
  } finally {
    if (beforeKey === undefined) delete process.env.LOMADEE_API_KEY; else process.env.LOMADEE_API_KEY = beforeKey;
    if (beforeChannel === undefined) delete process.env.LOMADEE_SOURCE_ID; else process.env.LOMADEE_SOURCE_ID = beforeChannel;
  }
});
