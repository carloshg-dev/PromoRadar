import assert from "node:assert/strict";
import test from "node:test";
import type { Produto } from "../../src/core/domain/types";
import { selecionarAchadosHome, perfumePessoalNaHome } from "../../src/core/home-catalog";

const now = Date.parse("2026-10-31T12:00:00Z");
const base: Produto = {
  id: "base", titulo: "Produto", marca: null, url: "https://www.amazon.com.br/dp/B000000001",
  imagemUrl: "https://images.example/produto.jpg", precoAtual: 100, precoOriginal: 120, descontoPct: 17,
  promoScore: 80, precoMinHist: null, precoMaxHist: null, precoAvgHist: null, emEstoque: true,
  atualizadoEm: "2026-10-30T12:00:00Z", lojaNome: "Amazon", lojaSlug: "amazon",
  categoriaNome: "Gadgets", categoriaSlug: "fones-bluetooth", categoriaEmoji: null,
};

test("primeira vitrine varia lojas antes de repetir a mesma marca", () => {
  const rows = [
    { ...base, id: "a1", promoScore: 100 }, { ...base, id: "a2", promoScore: 99 },
    { ...base, id: "a3", promoScore: 98 },
    { ...base, id: "b", lojaSlug: "polishop", categoriaSlug: "cabelos" },
    { ...base, id: "c", lojaSlug: "sieno", categoriaSlug: "perfumes-importados" },
    { ...base, id: "d", lojaSlug: "shopee" },
  ];
  const selected = selecionarAchadosHome(rows, 4, now);
  assert.equal(selected.length, 4);
  assert.equal(new Set(selected.map(p => p.lojaSlug)).size, 4);
  assert.deepEqual(selecionarAchadosHome(rows, 4, now).map(p => p.id), selected.map(p => p.id));
});

test("seleção remove repetidos e mantém os critérios de segurança/recência da home", () => {
  const rows = [base, base, { ...base, id: "old", atualizadoEm: "2026-09-01" },
    { ...base, id: "price", precoAtual: 0 }, { ...base, id: "store", lojaSlug: "kabum" }];
  assert.deepEqual(selecionarAchadosHome(rows, 8, now).map(p => p.id), ["base"]);
  assert.equal(selecionarAchadosHome(rows, 0, now).length, 0);
  assert.equal(rows.length, 5);
});

test("histórico real prevalece sobre âncora de desconto na mesma loja e categoria", () => {
  const anchor = { ...base, id: "anchor", precoOriginal: 10000, descontoPct: 99, promoScore: 100 };
  const historical = { ...base, id: "historical", precoMinHist: 100, precoMaxHist: 140 };
  assert.equal(selecionarAchadosHome([anchor, historical], 1, now)[0]?.id, "historical");
});

test("perfumes pessoais não incluem aromatizadores de carro e preservam marcas de fragrância", () => {
  for (const titulo of ["Aromatizador de Carro Helicóptero Solar", "Perfume para carros", "Odorizador automotivo"])
    assert.equal(perfumePessoalNaHome({ ...base, titulo }), false, titulo);
  for (const titulo of ["Mercedes Benz Vermelho Perfume Feminino Eau De Parfum", "Carolina Herrera Good Girl", "Essência de perfume feminino"])
    assert.equal(perfumePessoalNaHome({ ...base, titulo }), true, titulo);
});
