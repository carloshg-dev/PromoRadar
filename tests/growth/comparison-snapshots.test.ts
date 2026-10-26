import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { Produto } from "../../src/core/domain/types";
import { agruparComparacoes } from "../../src/core/matching/comparison";
import { snapshotHash, snapshotScope, validateSnapshotIndex, currentComparisons, SNAPSHOT_MAX_BYTES } from "../../src/core/matching/snapshot";
import { buildComparisonSnapshots } from "../../src/services/comparison-snapshot.service";
import { lerComparacao, lerListaComparacoes } from "../../src/infrastructure/repositories/comparison-snapshot.repo";
import { comparisonProductBatches } from "../../src/infrastructure/repositories/comparison-source.repo";

const now = Date.now();
const product = (store: string, price: number, overrides: Partial<Produto> = {}): Produto => ({
  id: randomUUID(), titulo: "Placa de video RTX 4060 8GB", marca: "Asus", url: "https://www.amazon.com.br/dp/B000000001",
  imagemUrl: "https://images.example/product.jpg", precoAtual: price, precoOriginal: null, descontoPct: null,
  promoScore: 90, precoMinHist: null, precoMaxHist: null, precoAvgHist: null, emEstoque: true,
  atualizadoEm: new Date(now).toISOString(), lojaNome: store, lojaSlug: store,
  categoriaNome: "Placas de vídeo", categoriaSlug: "placas-de-video", categoriaEmoji: null, ...overrides,
});
const a = product("a", 100), b = product("b", 150);
const comparison = agruparComparacoes([a, b], 1)[0]!;
const index = { schema: 1, version: randomUUID(), generatedAt: new Date(now).toISOString() };
const envKeys = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"] as const;
const prior = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://db.test";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "fake-anon";
process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-server-only";
after(() => { for (const key of envKeys) if (prior[key] === undefined) delete process.env[key]; else process.env[key] = prior[key]; });

test("matching preserva uma oferta mais barata por loja e descarta outliers", () => {
  const c = agruparComparacoes([a, product("a", 110), b, product("c", 800)], 60)[0]!;
  assert.deepEqual(c.ofertas.map(p => p.precoAtual), [100, 150]);
  assert.equal(c.lojas, 2); assert.equal(c.economia, 50);
});

test("geração por lotes encontra loja tardia, publica o índice por último e não duplica vertical unitária", async () => {
  const output = new Map<string, unknown>();
  const receipt = await buildComparisonSnapshots({ categories: ["placas-de-video"], verticals: [{ categorias: [{ slug: "placas-de-video" }] }], now,
    batches: async function* () { yield [product("a", 120)]; yield [a, b]; },
    write: async (path, body) => { output.set(path, JSON.parse(body)); },
  });
  assert.equal([...output.keys()].at(-1), "v1/index.json");
  assert.deepEqual(output.get(`v1/${receipt.version}/index.json`), output.get("v1/index.json"));
  assert.equal(receipt.rows, 3); assert.equal(receipt.comparisons, 1); assert.equal(receipt.maxGroupStores, 2);
  const path = `v1/${receipt.version}/lists/${await snapshotHash("placas-de-video")}.json`;
  const result = output.get(path) as { comparacoes: typeof comparison[] };
  assert.equal(result.comparacoes.length, 1); assert.equal(result.comparacoes[0]!.menorPreco, 100);
});

test("falha no manifesto de geração completa preserva o ponteiro anterior", async () => {
  const writes: string[] = [];
  await assert.rejects(buildComparisonSnapshots({ categories: ["placas-de-video"], verticals: [], now,
    batches: async function* () { yield [a, b]; },
    write: async path => {
      if (/^v1\/[^/]+\/index\.json$/.test(path)) throw new Error("manifest_failed");
      writes.push(path);
    },
  }), /manifest_failed/);
  assert.ok(writes.length > 0); assert.ok(!writes.includes("v1/index.json"));
});

test("erro de leitura, gravação, lote excessivo ou catálogo vazio preserva o índice anterior", async () => {
  for (const failure of ["read", "write", "batch", "empty"]) {
    const writes: string[] = [];
    await assert.rejects(buildComparisonSnapshots({ categories: ["placas-de-video"], verticals: [], now,
      batches: async function* () {
        if (failure === "read") throw new Error("source_failed");
        if (failure === "empty") return;
        yield failure === "batch" ? Array.from({ length: 251 }, () => a) : [a, b];
      },
      write: async (path) => { if (failure === "write") throw new Error("sink_failed"); writes.push(path); },
    }));
    assert.ok(!writes.includes("v1/index.json"), failure);
  }
});

test("snapshots expirados/futuros são rejeitados e ofertas que envelheceram saem da comparação", () => {
  assert.throws(() => validateSnapshotIndex({ ...index, generatedAt: new Date(now - 49 * 3_600_000).toISOString() }, now), /expired/);
  assert.throws(() => validateSnapshotIndex({ ...index, generatedAt: new Date(now + 120_000).toISOString() }, now), /expired/);
  const stale = { ...comparison, ofertas: [a, { ...b, atualizadoEm: new Date(now - 8 * 86_400_000).toISOString() }] };
  assert.deepEqual(currentComparisons([stale], now), []);
  assert.equal(snapshotScope({ categorias: ["ssds", "placas-de-video", "ssds"] }), "placas-de-video,ssds");
});

test("visita ao produto lê dois objetos pequenos, com cache, sem consultar vw_ofertas", async context => {
  const urls: URL[] = [];
  context.mock.method(globalThis, "fetch", async (url: unknown, init?: RequestInit & { next?: { revalidate?: number } }) => {
    const query = new URL(String(url)); urls.push(query);
    assert.equal(query.hostname, "db.test"); assert.match(query.pathname, /^\/storage\/v1\/object\/authenticated\//);
    assert.equal(init?.next?.revalidate, 300);
    return Response.json(query.pathname.endsWith("index.json") ? index : { ...index, comparacoes: [comparison] });
  });
  assert.equal((await lerComparacao("placas-de-video", comparison.chave))?.menorPreco, 100);
  assert.equal(urls.length, 2);
});

test("grupo ausente retorna null; lista ausente, erro e objeto excessivo não viram vazio válido", async context => {
  for (const failure of ["missing", "error", "oversize", "version"]) {
    context.mock.method(globalThis, "fetch", async (url: unknown) => {
      if (String(url).endsWith("index.json")) return Response.json(index);
      if (failure === "missing") return new Response(null, { status: 404 });
      if (failure === "error") return new Response(null, { status: 503 });
      if (failure === "oversize") return new Response("x".repeat(SNAPSHOT_MAX_BYTES + 1));
      return Response.json({ ...index, version: randomUUID(), comparacoes: [comparison] });
    });
    if (failure === "missing") assert.equal(await lerComparacao("placas-de-video", comparison.chave), null);
    await assert.rejects(lerListaComparacoes({ categoria: "placas-de-video" }));
    context.mock.restoreAll();
  }
});

test("fonte usa cursor estável e lotes de 250, com estoque, prazo e janela de preço", async context => {
  const rows = [a, b].sort((x, y) => x.id.localeCompare(y.id)); let calls = 0;
  context.mock.method(globalThis, "fetch", async (url: unknown, init?: RequestInit) => {
    const query = new URL(String(url)); calls++;
    assert.equal(query.searchParams.get("limit"), "250"); assert.equal(query.searchParams.get("order"), "id.asc");
    assert.equal(query.searchParams.get("em_estoque"), "eq.true"); assert.equal(query.searchParams.getAll("atualizado_em").length, 2);
    assert.ok(init?.signal);
    if (calls > 1) { assert.equal(query.searchParams.get("id"), `gt.${rows[1]!.id}`); return Response.json([]); }
    return Response.json(rows.map(p => ({ id: p.id, titulo: p.titulo, preco_atual: p.precoAtual, em_estoque: true, atualizado_em: p.atualizadoEm, categoria_slug: p.categoriaSlug })));
  });
  let count = 0;
  for await (const batch of comparisonProductBatches("placas-de-video", now)) count += batch.length;
  assert.equal(count, 2); assert.equal(calls, 2);
});
