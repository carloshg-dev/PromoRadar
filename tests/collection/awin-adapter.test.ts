import test, { after } from "node:test";
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { AwinAdapter } from "../../src/infrastructure/scraping/adapters/awin.adapter";

const previousList = process.env.AWIN_DATAFEED_URL, previousLimit = process.env.AWIN_MAX_TOTAL;
process.env.AWIN_DATAFEED_URL = "https://feed.test/list";
after(() => {
  if (previousList === undefined) delete process.env.AWIN_DATAFEED_URL; else process.env.AWIN_DATAFEED_URL = previousList;
  if (previousLimit === undefined) delete process.env.AWIN_MAX_TOTAL; else process.env.AWIN_MAX_TOTAL = previousLimit;
});
class FastAwin extends AwinAdapter { protected override async sleep() {} }
const headers = "product_name,aw_deep_link,merchant_image_url,search_price,rrp_price,currency,aw_product_id,brand_name\n";
const product = '"Fone, modelo\nAzul",https://www.awin1.com/cread.php?x=1,https://image.test/p.jpg,99.90,149.90,BRL,123,Marca\n';
const master = (paths: string[]) => paths.map((path, i) => ["18879", "", "", "", "", String(i + 1), "", "", "", "", "", "", `https://feed.test/${path}`].join(",")).join("\n") + "\n";

test("Awin processa gzip em stream, preserva preço/loja e reporta uma fonte parcial", async (context) => {
  const failures: string[] = [];
  context.mock.method(globalThis, "fetch", async (url: unknown) => {
    const path = new URL(String(url)).pathname;
    if (path === "/list") return new Response(master(["good", "bad"]));
    if (path === "/good") return new Response(gzipSync(headers + product));
    assert.equal(path, "/bad");
    return new Response(null, { status: 503 });
  });
  const result = await new FastAwin().coletar({ log: () => {}, reportFailure: (code) => failures.push(code) });
  assert.equal(result.length, 1);
  assert.equal(result[0]?.titulo, "Fone, modelo\nAzul");
  assert.equal(result[0]?.precoAtual, 99.9);
  assert.equal(result[0]?.precoOriginal, 149.9);
  assert.equal(result[0]?.loja?.slug, "aliexpress");
  assert.deepEqual(failures, ["awin_feed_read_failed:aliexpress"]);
});

test("Awin termina no teto configurado, deduplica e aceita corpo já descompactado", async (context) => {
  process.env.AWIN_MAX_TOTAL = "2";
  context.mock.method(globalThis, "fetch", async (url: unknown) => new Response(new URL(String(url)).pathname === "/list" ? master(["good"])
    : headers + product + product + product.replace(",123,", ",124,") + product.replace(",123,", ",125,")));
  const result = await new FastAwin().coletar({ log: () => {} });
  assert.deepEqual(result.map((item) => item.skuLoja), ["awin-123", "awin-124"]);
  if (previousLimit === undefined) delete process.env.AWIN_MAX_TOTAL; else process.env.AWIN_MAX_TOTAL = previousLimit;
});

test("caller sem suporte a falha parcial recebe erro em vez de catálogo falsamente completo", async (context) => {
  context.mock.method(globalThis, "fetch", async () => new Response(null, { status: 500 }));
  await assert.rejects(new FastAwin().coletar({ log: () => {} }), /feedlist_read_failed/);
});

test("adapter não publica noimage, preços antigos como atuais ou conversão cambial estimada", async context => {
  context.mock.method(globalThis, "fetch", async (url: unknown) => new Response(new URL(String(url)).pathname === "/list" ? master(["good"])
    : headers + product.replace("99.90,149.90", "129.90,99.90")
      + product.replace(",123,", ",124,").replace("BRL", "USD")
      + product.replace(",123,", ",125,").replace("https://image.test/p.jpg", "https://images2.productserve.com/noimage.gif")));
  const result = await new FastAwin().coletar({ log: () => {} });
  assert.equal(result.length, 1);
  assert.equal(result[0]?.precoAtual, 129.9);
  assert.equal(result[0]?.precoOriginal, null);
});

test("feed sem coluna de moeda reporta fonte parcial em vez de supor BRL", async context => {
  const failures: string[] = [];
  context.mock.method(globalThis, "fetch", async (url: unknown) => new Response(new URL(String(url)).pathname === "/list" ? master(["good"]) : headers.replace(",currency", "") + product.replace(",BRL", "")));
  const rows = await new FastAwin().coletar({ log: () => {}, reportFailure: code => failures.push(code) });
  assert.equal(rows.length, 0);
  assert.deepEqual(failures, ["awin_feed_read_failed:aliexpress"]);
});
