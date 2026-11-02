import assert from "node:assert/strict";
import test, { after } from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { AchadoDoDia } from "../../src/infrastructure/repositories/produtos.repo";
import { montarRascunho, prepararRascunhos } from "../../src/pipeline/draft.service";
import { montarArteOferta } from "../../src/lib/arte-oferta";

const priorUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, priorKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://db.test";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "fake-anon-no-real-access";
after(() => {
  if (priorUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = priorUrl;
  if (priorKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = priorKey;
});
const item = { id: "00000000-0000-4000-8000-000000000001", titulo: "Webcam USB", lojaSlug: "amazon", lojaNome: "Amazon", categoriaSlug: "webcam-acao", url: "https://www.amazon.com.br/dp/B0TEST", imagemUrl: "https://cdn.test/product.jpg", emEstoque: true, precoAtual: 49.9, precoOriginal: 69.9, descontoPct: 29, promoScore: 80, atualizadoEm: new Date().toISOString() } as AchadoDoDia;

test("rascunhos usam preço real, referência rotulada, data e link canônico por canal", () => {
  for (const channel of ["telegram", "whatsapp"] as const) {
    const draft = montarRascunho(item, channel), url = new URL(draft.link);
    assert.equal(url.origin, "https://promodetec.com.br");
    assert.equal(url.pathname, `/produto/${item.id}`);
    assert.equal(url.searchParams.get("utm_source"), channel);
    assert.equal(draft.priceBRL, item.precoAtual);
    assert.match(draft.text, /Referência informada pela loja/);
    assert.match(draft.text, /Preço coletado em/);
    assert.ok(draft.text.includes(draft.link));
    assert.ok(!/vercel\.app|economize|menor preço do mercado|últimas unidades/i.test(draft.text));
  }
});

test("simulação escreve só arquivos locais e não cria campanhas nem envia mensagens", async context => {
  const directory = await mkdtemp(join(tmpdir(), "promodetec-drafts-test-"));
  context.mock.method(globalThis, "fetch", async (input: unknown, init?: RequestInit) => {
    const url = new URL(String(input));
    assert.equal(url.hostname, "db.test"); assert.equal(url.pathname, "/rest/v1/vw_ofertas");
    assert.equal(init?.method ?? "GET", "GET");
    const row = { id: item.id, titulo: item.titulo, loja_slug: item.lojaSlug, loja_nome: item.lojaNome, categoria_slug: item.categoriaSlug, url: item.url, imagem_url: item.imagemUrl, em_estoque: true, preco_atual: item.precoAtual, preco_original: item.precoOriginal, desconto_pct: 29, atualizado_em: item.atualizadoEm };
    return Response.json([row, { ...row, id: "expensive", preco_atual: 599 }]);
  });
  try {
    assert.deepEqual(await prepararRascunhos(directory), { products: 1, drafts: 2, published: false, databaseWrites: false, directory });
    const report = JSON.parse(await readFile(join(directory, "drafts.json"), "utf8"));
    assert.equal(report.published, false); assert.equal(report.databaseWrites, false);
    assert.equal(report.suggestedHero.length, 1);
    assert.match(await readFile(join(directory, "whatsapp.txt"), "utf8"), /POST 1 — RASCUNHO/);
  } finally {
    assert.equal(resolve(directory).startsWith(resolve(tmpdir()) + "/") || resolve(directory).startsWith(resolve(tmpdir()) + "\\"), true);
    await rm(directory, { recursive: true, force: true });
  }
});

test("arte aponta para o domínio atual sem alterar o preço recebido", () => {
  const svg = montarArteOferta({ titulo: item.titulo, precoAtual: 49.9, precoOriginal: null, descontoPct: null, promoScore: null, lojaNome: "Amazon", precoMinHist: null, precoAvgHist: null, precoMaxHist: null, fotoDataUri: null });
  assert.ok(svg.includes("promodetec.com.br"));
  assert.ok(!svg.includes("vercel.app"));
});
