import assert from "node:assert/strict";
import test from "node:test";
import { catalogPriceLimit, validProductImage, verifiedBrlPrice } from "../../src/core/catalog-policy";
import { productMetadata, productStructuredData } from "../../src/lib/product-seo";
import { permitidoNaHome } from "../../src/core/home-catalog";
import type { Produto } from "../../src/core/domain/types";
import { mapProduto } from "../../src/infrastructure/repositories/produto-row";

test("teto público é previsível e valores arbitrários não removem o limite", () => {
  for (const value of [undefined, null, "Infinity", "0", "-1", "1000000", ["todos"]]) assert.equal(catalogPriceLimit(value), 1000);
  assert.equal(catalogPriceLimit("300"), 300);
  assert.equal(catalogPriceLimit(2000), 2000);
  assert.equal(catalogPriceLimit("todos"), null);
});

test("origem com moeda pendente não anuncia preço BRL em metadata ou dados de oferta", () => {
  const item = { id: "test", titulo: "Produto importado", lojaSlug: "aliexpress", lojaNome: "AliExpress", precoAtual: 600, atualizadoEm: new Date().toISOString() } as Produto;
  assert.equal(verifiedBrlPrice(item.lojaSlug), false);
  assert.equal(verifiedBrlPrice("shopee"), true);
  assert.equal(productMetadata(item).description?.includes("Preço coletado"), false);
  const data = productStructuredData(item)[0] as Record<string, unknown>;
  assert.equal("offers" in data, false);
  assert.equal(item.precoAtual, 600);
});

test("foto genérica observada na Awin é recusada mesmo quando retorna HTTP 200", () => {
  for (const value of [null, "", "https://images2.productserve.com/noimage.gif", "https://cdn.test/no-image.png", "https://cdn.test/placeholder.jpg", "javascript:alert(1)", "https://user:pass@cdn.test/photo.jpg"])
    assert.equal(validProductImage(value), false);
  assert.equal(validProductImage("https://cdn.test/produto.jpg"), true);
});

test("rota de fotos Dufrio com 404 fica fora das vitrines sem bloquear outra origem válida", () => {
  for (const host of ["dufrio.com.br", "www.dufrio.com.br"]) {
    assert.equal(validProductImage(`https://${host}/media/catalog/product/p/foto.jpg`), false);
    assert.equal(validProductImage(`http://${host}/MEDIA/CATALOG/PRODUCT/p/foto.jpg`), false);
    assert.equal(validProductImage(`https://${host}/nova-midia/foto.jpg`), true);
  }
  assert.equal(validProductImage("https://cdn.test/media/catalog/product/p/foto.jpg"), true);
});

test("detalhe e metadata recebem foto ausente sem modificar preço, histórico ou URL da loja", () => {
  const row = { id: "produto", titulo: "Ferramenta", loja_slug: "dufrio", loja_nome: "Dufrio", url: "https://www.awin1.com/cread.php?x=1", imagem_url: "https://www.dufrio.com.br/media/catalog/product/p/foto.jpg", preco_atual: 79.9, preco_min_hist: 69.9, atualizado_em: new Date().toISOString() };
  const item = mapProduto(row);
  assert.equal(item.imagemUrl, null);
  assert.equal(item.precoAtual, row.preco_atual);
  assert.equal(item.precoMinHist, row.preco_min_hist);
  assert.equal(item.url, row.url);
  assert.equal(mapProduto({ ...row, imagem_url: "https://cdn.test/product.jpg" }).imagemUrl, "https://cdn.test/product.jpg");
  assert.ok(!JSON.stringify(productMetadata(item)).includes("/media/catalog/product/"));
});

test("teto da home filtra exposição sem alterar o produto ou inventar um preço menor", () => {
  const item = { lojaSlug: "amazon", emEstoque: true, precoAtual: 6000, imagemUrl: "https://cdn.test/produto.jpg", atualizadoEm: "2026-10-30T12:00:00Z" } as Produto;
  assert.equal(permitidoNaHome(item, Date.parse("2026-10-31T12:00:00Z")), false);
  assert.equal(item.precoAtual, 6000);
});
