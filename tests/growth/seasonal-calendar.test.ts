import assert from "node:assert/strict";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { CALENDARIO_SAZONAL_2026, temaSazonal, scriptTemaSazonal } from "../../src/lib/seasonal";

test("o calendário usa meia-noite de Brasília e encerra cada campanha", () => {
  const anterior = process.env.NEXT_PUBLIC_TEMA_FORCE;
  delete process.env.NEXT_PUBLIC_TEMA_FORCE;
  try {
    const fronteiras = [
      ["2026-10-30", "primavera", "esquenta-black"],
      ["2026-11-27", "esquenta-black", "black-friday"],
      ["2026-11-30", "black-friday", "cyber-monday"],
      ["2026-12-01", "cyber-monday", "esquenta-natal"],
      ["2026-12-14", "esquenta-natal", "natal"],
      ["2026-12-26", "natal", null],
    ] as const;
    for (const [dia, antes, depois] of fronteiras) {
      const inicio = new Date(`${dia}T00:00:00-03:00`);
      assert.equal(temaSazonal(new Date(inicio.getTime() - 1))?.id ?? null, antes, `${dia}: antes`);
      assert.equal(temaSazonal(inicio)?.id ?? null, depois, `${dia}: início`);
      assert.equal(temaSazonal(new Date(inicio.getTime() + 86_399_999))?.id ?? null, depois, `${dia}: fim`);
    }
    assert.equal(temaSazonal(new Date("2027-01-01T00:00:00-03:00")), null);
    assert.equal(temaSazonal(new Date("2027-11-27T00:00:00-03:00")), null);
    let fimAnterior = -Infinity;
    for (const janela of CALENDARIO_SAZONAL_2026) {
      assert.ok(fimAnterior < janela.inicio, "janelas sem sobreposição");
      fimAnterior = janela.fim;
    }
  } finally {
    if (anterior === undefined) delete process.env.NEXT_PUBLIC_TEMA_FORCE;
    else process.env.NEXT_PUBLIC_TEMA_FORCE = anterior;
  }
});

test("bootstrap e calendário concordam mesmo quando o HTML veio de outra campanha", () => {
  const anterior = process.env.NEXT_PUBLIC_TEMA_FORCE;
  delete process.env.NEXT_PUBLIC_TEMA_FORCE;
  try {
    for (const iso of [
      "2026-10-30T02:59:59.999Z", "2026-10-30T03:00:00Z",
      "2026-11-27T02:59:59.999Z", "2026-11-27T03:00:00Z",
      "2026-11-30T03:00:00Z", "2026-12-01T03:00:00Z",
      "2026-12-14T03:00:00Z", "2026-12-26T03:00:00Z", "2027-01-01T03:00:00Z",
    ]) {
      class Clock extends Date { constructor() { super(iso); } }
      const document = { documentElement: { dataset: { campaign: "campanha-antiga" } } };
      runInNewContext(scriptTemaSazonal(), { Date: Clock, Intl, document }, { timeout: 1000 });
      assert.equal(document.documentElement.dataset.campaign, temaSazonal(new Date(iso))?.id ?? "neutro", iso);
    }
    process.env.NEXT_PUBLIC_TEMA_FORCE = "</script><script>nao-refletir</script>";
    assert.ok(!scriptTemaSazonal().includes("nao-refletir"));
  } finally {
    if (anterior === undefined) delete process.env.NEXT_PUBLIC_TEMA_FORCE;
    else process.env.NEXT_PUBLIC_TEMA_FORCE = anterior;
  }
});

test("prévia forçada reconhece as novas fases e valor inválido conserva o calendário", () => {
  const anterior = process.env.NEXT_PUBLIC_TEMA_FORCE;
  try {
    for (const id of ["esquenta-black", "black-friday", "cyber-monday", "esquenta-natal", "natal"]) {
      process.env.NEXT_PUBLIC_TEMA_FORCE = id;
      assert.equal(temaSazonal(new Date("2026-07-01T12:00:00Z"))?.id, id);
    }
    process.env.NEXT_PUBLIC_TEMA_FORCE = "inexistente";
    assert.equal(temaSazonal(new Date("2026-11-27T03:00:00Z"))?.id, "black-friday");
  } finally {
    if (anterior === undefined) delete process.env.NEXT_PUBLIC_TEMA_FORCE;
    else process.env.NEXT_PUBLIC_TEMA_FORCE = anterior;
  }
});
