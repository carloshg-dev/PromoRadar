import assert from "node:assert/strict";
import test from "node:test";
import { formatBRL, formatShortDate } from "../../src/core/formatting";

test("formatador compartilhado preserva centavos, arredondamento e saída anterior sem alterar valores", () => {
  const values = [0, -0, 0.01, 9.99, 29.995, 99.90, 4251.96, 6124.73, -3.28, NaN, Infinity];
  for (const value of values) {
    const expected = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
    assert.equal(formatBRL(value), expected);
    assert.equal(formatBRL(value), expected);
  }
  assert.equal(formatBRL(null), "—");
  assert.equal(formatBRL(undefined), "—");
});

test("datas compartilhadas mantêm a semântica anterior, incluindo offsets e entrada inválida", () => {
  for (const iso of ["2026-10-31T00:30:00Z", "2026-10-31T23:30:00-03:00", "2026-12-25", "invalid", ""]) {
    assert.equal(formatShortDate(iso), new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }));
  }
});
