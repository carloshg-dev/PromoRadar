import test, { after } from "node:test";
import assert from "node:assert/strict";
import { permitidoNaHome, validarDisponibilidadeHome } from "../../src/core/home-catalog";
import type { Produto } from "../../src/core/domain/types";
import { criarLeituraVitrine, listarOfertas, listarVitrinePorLoja, listarAfiliados, listarAfiliadosRodizio, achadosBelezaCarrossel, achadosPorCategorias, ofertasEmDestaque, listarComparacoes } from "../../src/infrastructure/repositories/produtos.repo";
import { limitedFetch } from "../../src/infrastructure/supabase/limited-fetch";

const now = Date.parse("2026-10-20T12:00:00Z");
const priorUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const priorKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://db.test";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "fake-anon-no-real-access";
after(() => {
  if (priorUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = priorUrl;
  if (priorKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = priorKey;
});
const product: Produto = {
  id: "12345678-1234-4234-8234-123456789abc", titulo: "Fone Bluetooth", url: "https://www.amazon.com.br/dp/B000000001", marca: null,
  imagemUrl: "https://images.example/fone.jpg", precoAtual: 99, precoOriginal: 120, descontoPct: 18, promoScore: 90,
  precoMinHist: 99, precoMaxHist: 120, precoAvgHist: 110, emEstoque: true, atualizadoEm: "2026-10-19T12:00:00Z",
  lojaNome: "Amazon", lojaSlug: "amazon", categoriaNome: "Fones", categoriaSlug: "fones-bluetooth", categoriaEmoji: null,
};
const leitura = () => ({ ...criarLeituraVitrine(), agora: now });

test("indisponibilidade total falha para preservar ISR; vazio válido e resultado parcial são distintos", () => {
  assert.throws(() => validarDisponibilidadeHome([[], []], 2), /home_catalog_unavailable/);
  assert.doesNotThrow(() => validarDisponibilidadeHome([[], []], 0));
  assert.doesNotThrow(() => validarDisponibilidadeHome([[product], []], 1));
});

test("home rejeita preço inválido, estoque ausente, coleta antiga/futura e imagem imprópria", () => {
  assert.equal(permitidoNaHome(product, now), true);
  const invalid: Partial<Produto>[] = [{ precoAtual: null }, { precoAtual: 0 }, { precoAtual: -1 }, { precoAtual: NaN }, { precoAtual: Infinity },
    { emEstoque: false }, { atualizadoEm: "2026-09-01" }, { atualizadoEm: "2026-10-21" }, { atualizadoEm: "invalid" },
    { imagemUrl: null }, { imagemUrl: "https://images.example/placeholder.png" }, { imagemUrl: "javascript:alert(1)" },
    { imagemUrl: "http://" }, { imagemUrl: "https://user:password@images.example/fone.jpg" }, { lojaSlug: "kabum" }];
  for (const patch of invalid) assert.equal(permitidoNaHome({ ...product, ...patch }, now), false, JSON.stringify(patch));
});

test("fontes da home usam pools limitados e cancelamento, sem predicado caro de data na view", async (context) => {
  const read = leitura();
  let queries = 0;
  context.mock.method(globalThis, "fetch", async (url: unknown, init?: RequestInit) => {
    const query = new URL(String(url));
    assert.equal(query.hostname, "db.test");
    assert.equal(init?.signal, read.signal);
    if (query.pathname.endsWith("/lojas")) return Response.json([{ slug: "amazon", adapter_key: "amazon" }]);
    assert.ok(query.pathname.endsWith("/vw_ofertas"));
    queries++;
    assert.equal(query.searchParams.get("em_estoque"), "eq.true");
    assert.ok(query.searchParams.getAll("preco_atual").includes("not.is.null"));
    assert.equal(query.searchParams.has("atualizado_em"), false);
    assert.ok(Number(query.searchParams.get("limit") ?? 1000) <= 1000);
    return Response.json([]);
  });
  await Promise.all([
    listarOfertas({ limit: 4 }, read), listarVitrinePorLoja("amazon", 4, read), listarAfiliados(4, read),
    listarAfiliadosRodizio(4, 12, read), achadosBelezaCarrossel(4, read),
    achadosPorCategorias(["fones-bluetooth"], 4, read), ofertasEmDestaque(4, read),
  ]);
  assert.equal(queries, 6);
});

test("pool recente rejeita linhas antigas, preço zero e imagem inválida antes de selecionar", async (context) => {
  context.mock.method(globalThis, "fetch", async () => Response.json([
    { id: "fresh", titulo: "Fone", url: product.url, loja_slug: "amazon", em_estoque: true, preco_atual: 99, imagem_url: product.imagemUrl, atualizado_em: product.atualizadoEm },
    { id: "stale", titulo: "Antigo", url: product.url, loja_slug: "amazon", em_estoque: true, preco_atual: 99, imagem_url: product.imagemUrl, atualizado_em: "2026-01-01" },
    { id: "zero", titulo: "Zero", url: product.url, loja_slug: "amazon", em_estoque: true, preco_atual: 0, imagem_url: product.imagemUrl, atualizado_em: product.atualizadoEm },
    { id: "bad-image", titulo: "Imagem inválida", url: product.url, loja_slug: "amazon", em_estoque: true, preco_atual: 99, imagem_url: "javascript:alert(1)", atualizado_em: product.atualizadoEm },
  ]));
  const rows = await listarVitrinePorLoja("amazon", 4, leitura());
  assert.deepEqual(rows.map((row) => row.id), ["fresh"]);
});

test("feed, rodízio e destaque usam um pool por render com no máximo quatro lojas em paralelo", async (context) => {
  const read = leitura();
  let storeReads = 0, poolReads = 0, active = 0, maxActive = 0, historyReads = 0;
  const stores = Array.from({ length: 8 }, (_, i) => ({ slug: `loja-${i}`, adapter_key: "awin" }));
  context.mock.method(globalThis, "fetch", async (url: unknown, init?: RequestInit) => {
    const query = new URL(String(url));
    assert.equal(init?.signal, read.signal);
    if (query.pathname.endsWith("/lojas")) { storeReads++; return Response.json(stores); }
    if (query.pathname.endsWith("/historico_precos")) { historyReads++; return Response.json([]); }
    const slug = query.searchParams.get("loja_slug")?.slice(3);
    if (!slug) return Response.json([]);
    poolReads++; active++; maxActive = Math.max(active, maxActive);
    await new Promise<void>((resolve) => setTimeout(resolve, 1));
    active--;
    return Response.json([{ id: `${slug}-id`, titulo: "Fone", url: product.url, imagem_url: product.imagemUrl,
      loja_slug: slug, loja_nome: slug, preco_atual: 99, em_estoque: true, atualizado_em: product.atualizadoEm }]);
  });
  const results = await Promise.all([listarAfiliados(4, read), listarAfiliadosRodizio(2, 12, read), ofertasEmDestaque(2, read)]);
  assert.equal(storeReads, 1);
  assert.equal(poolReads, 8);
  assert.ok(maxActive <= 4);
  assert.equal(historyReads, 3);
  assert.deepEqual(results.map((rows) => rows.length), [4, 2, 2]);
});

test("falha de pool não vira sucesso vazio e não é compartilhada entre renders", async (context) => {
  let calls = 0;
  context.mock.method(globalThis, "fetch", async () => { calls++; return Response.json({ code: "42501", message: "denied" }, { status: 403 }); });
  const read = leitura();
  const results = await Promise.allSettled([listarAfiliados(4, read), listarAfiliadosRodizio(4, 12, read)]);
  assert.ok(results.every((result) => result.status === "rejected"));
  assert.equal(calls, 1);
  await assert.rejects(listarAfiliados(4, leitura()));
  assert.equal(calls, 2);
});

test("destaque compara o pool fresco sem outra varredura e conserva preços por loja", async (context) => {
  context.mock.method(globalThis, "fetch", async (url: unknown) => {
    const query = new URL(String(url));
    if (query.pathname.endsWith("/lojas")) return Response.json([{ slug: "loja-a", adapter_key: "awin" }, { slug: "loja-b", adapter_key: "awin" }]);
    if (query.pathname.endsWith("/historico_precos")) return Response.json([]);
    const slug = query.searchParams.get("loja_slug")?.slice(3);
    assert.ok(slug, "destaque não deve varrer o catálogo completo");
    return Response.json([{ id: `${slug}-ssd`, titulo: "SSD Kingston NV2 1TB", marca: "Kingston", categoria_slug: "ssds", categoria_nome: "SSDs",
      url: product.url, imagem_url: product.imagemUrl, loja_slug: slug, loja_nome: slug, preco_atual: slug === "loja-a" ? 200 : 250,
      em_estoque: true, atualizado_em: product.atualizadoEm }]);
  });
  const items = await ofertasEmDestaque(2, leitura());
  const comparison = items.find((item) => item.comparacao)?.comparacao;
  assert.ok(comparison);
  assert.equal(comparison.lojas, 2);
  assert.equal(comparison.menorPreco, 200);
  assert.equal(comparison.maiorPreco, 250);
  assert.equal(comparison.economia, 50);
  assert.deepEqual(comparison.ofertas.map((row) => row.lojaSlug), ["loja-a", "loja-b"]);
});

test("consulta em andamento é interrompida pelo cancelamento da renderização", async (context) => {
  const controller = new AbortController();
  let observed = false;
  let notifyStarted!: () => void;
  const started = new Promise<void>((resolve) => { notifyStarted = resolve; });
  context.mock.method(globalThis, "fetch", async (_url: unknown, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
    observed = true;
    notifyStarted();
    const signal = init!.signal!;
    const abort = () => reject(new DOMException("Aborted", "AbortError"));
    if (signal.aborted) abort(); else signal.addEventListener("abort", abort, { once: true });
  }));
  const pending = listarVitrinePorLoja("amazon", 4, { ...leitura(), signal: controller.signal });
  await started;
  controller.abort();
  await assert.rejects(pending);
  assert.equal(observed, true);
});

test("recomendações exigem preços recentes; comparador indisponível não inicia varredura como fallback", async (context) => {
  let calls = 0;
  context.mock.method(globalThis, "fetch", async (url: unknown) => {
    calls++;
    const query = new URL(String(url));
    assert.equal(query.searchParams.has("atualizado_em"), true);
    return Response.json([]);
  });
  await listarOfertas({ limit: 4 });
  await assert.rejects(listarComparacoes({ categoria: "fones-bluetooth" }));
  assert.equal(calls, 1);
});

test("concorrência total é limitada mesmo com várias vitrines e pools independentes", async (context) => {
  let active = 0, maxActive = 0;
  context.mock.method(globalThis, "fetch", async (url: unknown) => {
    active++; maxActive = Math.max(active, maxActive);
    await new Promise<void>((resolve) => setTimeout(resolve, 1));
    active--;
    const query = new URL(String(url));
    return Response.json(query.pathname.endsWith("/lojas") ? Array.from({ length: 8 }, (_, i) => ({ slug: `loja-${i}`, adapter_key: "awin" })) : []);
  });
  const read = leitura();
  await Promise.all([listarAfiliados(4, read), achadosBelezaCarrossel(4, read), achadosPorCategorias(["ssds"], 4, read), listarVitrinePorLoja("amazon", 4, read)]);
  assert.ok(maxActive <= 4);
  assert.equal(active, 0);
});

test("cancelar a fila interrompe pendentes sem iniciar mais fetches nem perder vagas", async () => {
  const controller = new AbortController();
  let started = 0;
  const fetcher: typeof fetch = async (input, init) => {
    if (String(input).endsWith("/after")) return Response.json({ ok: true });
    started++;
    return new Promise<Response>((_resolve, reject) => {
      const abort = () => reject(new DOMException("Aborted", "AbortError"));
      if (init?.signal?.aborted) abort(); else init?.signal?.addEventListener("abort", abort, { once: true });
    });
  };
  const limited = limitedFetch(fetcher);
  const requests = Array.from({ length: 10 }, () => limited("https://db.test/wait", { signal: controller.signal }));
  await Promise.resolve();
  controller.abort();
  const results = await Promise.allSettled(requests);
  assert.ok(results.every((result) => result.status === "rejected"));
  assert.equal(started, 4);
  assert.equal((await limited("https://db.test/after")).status, 200);
});
