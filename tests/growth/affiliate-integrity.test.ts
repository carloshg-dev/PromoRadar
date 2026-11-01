import assert from "node:assert/strict";
import test from "node:test";
import { ehLinkMonetizado, linkAfiliado } from "../../src/lib/afiliados";
import { AWIN_ANUNCIANTES } from "../../src/core/awin-anunciantes";

test("Mercado Livre comum não promete comissão sem link do painel", () => {
  assert.equal(ehLinkMonetizado("https://www.mercadolivre.com.br/produto-MLB123456789"), false);
  assert.equal(ehLinkMonetizado("https://meli.la/link-real-do-painel"), true);
});

test("domínio parecido com a Shopee não é reconhecido como loja afiliada", () => {
  assert.equal(ehLinkMonetizado("https://fake-shopee.com.br/product/1"), false);
  assert.equal(ehLinkMonetizado("https://shopee.com.br/product/1?utm_source=an_18318451097"), true);
});

test("cadastro Awin corresponde aos 14 programas ativos consultados, incluindo Trocafy", () => {
  assert.deepEqual(AWIN_ANUNCIANTES.map(a=>a.mid).sort(), ["17665","17698","17729","17837","17846","17891","18878","18879","23524","26113","30615","51277","76888","78382"].sort());
  const link = new URL(linkAfiliado("https://www.trocafy.com.br/produto"));
  assert.equal(link.searchParams.get("awinmid"), "51277");
  assert.equal(link.hostname, "www.awin1.com");
});
