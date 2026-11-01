import test from "node:test";
import assert from "node:assert/strict";
import { awinFeedWithCurrency } from "../../src/core/collection/awin-feed-url";

test("exportação Awin solicita moeda e preço atuais sem modificar credencial, feed ou colunas existentes", () => {
  const raw = "https://datafeed.api.productserve.com/datafeed/download/apikey/fixture-private/fid/123/format/csv/language/pt/delimiter/%2C/compression/gzip/columns/product_name%2Csearch_price/?sample=kept";
  const result = new URL(awinFeedWithCurrency(raw)), source = new URL(raw);
  const parts = result.pathname.split("/");
  const columns = decodeURIComponent(parts[parts.indexOf("columns") + 1]!).split(",");
  assert.equal(result.hostname, source.hostname); assert.equal(result.search, source.search);
  for (const name of ["apikey", "fid", "format", "language", "delimiter", "compression"]) {
    const original = source.pathname.split("/"); assert.equal(parts[parts.indexOf(name) + 1], original[original.indexOf(name) + 1]);
  }
  assert.ok(columns.includes("currency")); assert.ok(columns.includes("search_price")); assert.ok(columns.includes("product_name"));
  assert.equal(columns.filter(c => c === "search_price").length, 1);
  assert.equal(awinFeedWithCurrency(result.href), result.href);
  const currentHost = awinFeedWithCurrency(raw.replace("datafeed.api.productserve.com", "productdata.awin.com"));
  assert.equal(new URL(currentHost).hostname, "productdata.awin.com");
  assert.match(decodeURIComponent(new URL(currentHost).pathname), /,currency,/);
});

test("exportação sem seleção recebe o contrato completo; outros hosts não são reescritos", () => {
  const result = awinFeedWithCurrency("https://datafeed.api.productserve.com/datafeed/download/apikey/fixture/fid/123/format/csv/");
  assert.ok(result.includes("/columns/")); assert.ok(result.includes("aw_deep_link")); assert.ok(result.includes("currency"));
  const external = "https://feed.test/good";
  assert.equal(awinFeedWithCurrency(external), external);
  const similar = "https://datafeed.api.productserve.com.evil.test/datafeed/download/columns/price/";
  assert.equal(awinFeedWithCurrency(similar), similar);
});
