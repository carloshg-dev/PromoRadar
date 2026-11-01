import assert from "node:assert/strict";
import test from "node:test";
import { ehLinkMonetizado } from "../../src/lib/afiliados";

test("Mercado Livre comum não promete comissão sem link do painel", () => {
  assert.equal(ehLinkMonetizado("https://www.mercadolivre.com.br/produto-MLB123456789"), false);
  assert.equal(ehLinkMonetizado("https://meli.la/link-real-do-painel"), true);
});

test("domínio parecido com a Shopee não é reconhecido como loja afiliada", () => {
  assert.equal(ehLinkMonetizado("https://fake-shopee.com.br/product/1"), false);
  assert.equal(ehLinkMonetizado("https://shopee.com.br/product/1?utm_source=an_18318451097"), true);
});
