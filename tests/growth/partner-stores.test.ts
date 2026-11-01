import test, { after } from "node:test";
import assert from "node:assert/strict";
import { partnerStores } from "../../src/core/partner-stores";
import { listarLojasVitrine } from "../../src/infrastructure/repositories/lojas.repo";
import { criarLeituraVitrine } from "../../src/infrastructure/repositories/produtos.repo";

const priorUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const priorKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://db.test";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "fake-anon-no-real-access";
after(() => {
  if (priorUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = priorUrl;
  if (priorKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = priorKey;
});

const amazon = { slug: "amazon", nome: "Amazon", logoUrl: "https://cdn.test/amazon.png", baseUrl: "https://www.amazon.com.br", rede: "Amazon Associados" };

test("carrossel inclui parceira só do comparador, sem duplicar marca ou promover moeda em quarentena", () => {
  const stores = partnerStores([amazon, amazon,
    { ...amazon, slug: "kabum", nome: "KaBuM!", rede: "Awin" },
    { ...amazon, slug: "aliexpress", nome: "AliExpress", rede: "Awin" },
    { ...amazon, slug: "sem-afiliacao", rede: null },
  ]);
  assert.deepEqual(stores.map(store => store.slug), ["amazon", "kabum"]);
  assert.equal(stores[0]?.logoUrl, amazon.logoUrl);
  assert.equal("rede" in stores[0]!, false);
});

test("metadado de logo ausente usa domínio real e inválido mantém fallback textual", () => {
  assert.match(partnerStores([{ ...amazon, logoUrl: null }])[0]!.logoUrl!, /domain=www.amazon.com.br/);
  const result = partnerStores([{ ...amazon, logoUrl: "javascript:invalid", baseUrl: "invalid" }]);
  assert.equal(result[0]?.logoUrl, null); assert.equal(result[0]?.nome, "Amazon");
  assert.equal(partnerStores(Array.from({ length: 40 }, (_, i) => ({ ...amazon, slug: `loja-${i}` }))).length, 24);
});

test("consulta das lojas é limitada, cacheada e usa o mesmo prazo da home, preservando falhas", async context => {
  const read = criarLeituraVitrine(); let fail = false;
  context.mock.method(globalThis, "fetch", async (url: unknown, init?: RequestInit) => {
    const query = new URL(String(url));
    assert.equal(query.pathname, "/rest/v1/lojas");
    assert.equal(query.searchParams.get("ativo"), "eq.true");
    assert.equal(query.searchParams.get("limit"), "200");
    assert.equal(init?.signal, read.signal);
    assert.equal((init as RequestInit & { next?: { revalidate: number } }).next?.revalidate, 300);
    return fail ? Response.json({ code: "57014", message: "timeout" }, { status: 500 }) : Response.json([{ slug: "amazon", nome: "Amazon", adapter_key: "amazon", logo_url: null, base_url: amazon.baseUrl }]);
  });
  assert.equal((await listarLojasVitrine(read))[0]?.slug, "amazon");
  fail = true;
  await assert.rejects(listarLojasVitrine(read), error => (error as { code?: string }).code === "57014");
});
