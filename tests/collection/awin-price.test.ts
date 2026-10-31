import assert from "node:assert/strict";
import test from "node:test";
import { awinPrice, parseFeedPrice } from "../../src/core/collection/awin-price";

test("preço atual Awin vem exclusivamente de search_price, nunca do menor preço antigo", () => {
  assert.deepEqual(awinPrice({ currency: "BRL", search_price: "129.90", rrp_price: "99.90", product_price_old: "89.90" }), { current: 129.9, reference: null });
  assert.deepEqual(awinPrice({ currency: "BRL", search_price: "99.90", rrp_price: "149.90" }), { current: 99.9, reference: 149.9 });
  assert.equal(awinPrice({ currency: "BRL", search_price: "", rrp_price: "149.90" }), null);
});

test("moeda estrangeira/ausente não é convertida em preço brasileiro estimado", () => {
  for (const currency of ["USD", "EUR", "CNY", ""]) assert.equal(awinPrice({ currency, search_price: "100" }), null);
});

test("moeda omitida só usa o programa confirmado, e a moeda explícita sempre prevalece", () => {
  assert.deepEqual(awinPrice({ search_price: "99.90" }, "BRL"), { current: 99.9, reference: null });
  assert.equal(awinPrice({ search_price: "99.90" }, "USD"), null);
  assert.equal(awinPrice({ search_price: "99.90", currency: "USD" }, "BRL"), null);
});

test("parser preserva valores locais e rejeita sinal, faixas e decimais ambíguos", () => {
  for (const [text, expected] of [["99.90", 99.9], ["99,90", 99.9], ["1.234,56", 1234.56], ["1,234.56", 1234.56], ["1234", 1234]] as const)
    assert.equal(parseFeedPrice(text), expected, text);
  for (const text of ["-99", "0", "NaN", "de 99 por 49", "1.234", "99-100", "10USD"]) assert.equal(parseFeedPrice(text), null, text);
});
