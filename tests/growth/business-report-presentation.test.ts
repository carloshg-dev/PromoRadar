import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import csvParser from "csv-parser";
import { presentBusinessReport, type BusinessReport } from "../../src/core/reporting/business-report";
import { assertDiscordReport, reportCsv } from "../../src/core/reporting/presentation";

const fixture = (): BusinessReport => ({
  generatedAt: "2026-11-01T11:00:00.000Z", days: 7, since: "2026-10-25T03:00:00.000Z", until: "2026-11-01T03:00:00.000Z", discordSent: false,
  movement: { totalEventos: 177, counts: { visita: 75, busca: 10, ver_produto: 49, busca_sem_resultado: 3 }, mobile: 174, desktop: 3, registrations: 0, redirectRequests: 122,
    topBuscas: [["controle xbox", 2], ["fone", 2]], topCategorias: [["notebooks", 1]], topProducts: [{ title: "Serra de bancada", count: 5 }], rankingLimited: false, complete: true },
  clicks: { stores: [["shopee", 90]], products: [{ title: "Fone", count: 6 }], rankingLimited: false, complete: true },
  financeStatus: "ok", finance: { statuses: { pending: { transactions: 1, sales: 14249, commission: 328 } }, brlRows: 1, otherCurrency: 0, nonSale: 0, topProducts: [] },
});
async function parseCsv(value: string): Promise<Record<string, string>[]> {
  const rows: Record<string, string>[] = [];
  for await (const row of Readable.from([value.replace(/^\ufeff/, "")]).pipe(csvParser({ separator: ";" }))) rows.push(row);
  return rows;
}

test("relatório separa os três blocos, rankings por linha, janela BRT e dinheiro por status sem mudar os dados", async () => {
  const report = fixture(), before = structuredClone(report);
  const view = presentBusinessReport(report);
  assert.equal(view.payload.embeds.length, 3); assert.deepEqual(view.payload.allowed_mentions, { parse: [] });
  assert.match(view.payload.embeds[0]!.description!, /25\/10\/2026 a 31\/10\/2026 · Brasília/);
  assert.equal(view.payload.embeds[0]!.fields.find(f => f.name.includes("Ações consentidas"))?.value, "**177**");
  assert.match(view.payload.embeds[1]!.fields[0]!.value, /controle xbox.*2.*\nf.*|controle xbox.*2.*\n\*\*2\.\*\* fone/s);
  assert.match(view.payload.embeds[2]!.fields[0]!.value, /142,49/); assert.match(view.payload.embeds[2]!.fields[0]!.value, /3,28/);
  assert.match(view.markdown, /não comprova pagamento/); assert.match(view.markdown, /não forneceu nomes/);
  const rows = await parseCsv(view.csv);
  const pending = rows.find(row => row.secao === "financeiro" && row.item === "pending")!;
  assert.equal(pending.quantidade, "1"); assert.equal(pending.valor_brl, "142,49"); assert.equal(pending.comissao_brl, "3,28");
  assert.equal(rows.find(row => row.indicador === "comissao_paga")!.quantidade, "");
  assert.equal(rows.find(row => row.indicador === "produtos_em_compras")!.status_dado, "nomes_nao_fornecidos");
  const machineData = JSON.parse(view.json);
  assert.equal(machineData.units.financeAmounts, "centavos_de_BRL"); assert.equal(machineData.finance.statuses.pending.commission, 328);
  assert.equal(machineData.discordSent, undefined);
  assert.deepEqual(report, before);
});

test("CSV mantém o ranking retornado completo e protege fórmulas, delimitadores, acentos e células numéricas", async () => {
  const report = fixture(); report.movement.topBuscas = Array.from({ length: 8 }, (_, i) => [`Termo ${i + 1}`, 8 - i]);
  const view = presentBusinessReport(report);
  assert.equal(view.payload.embeds[1]!.fields[0]!.value.split("\n").length, 5);
  assert.equal((await parseCsv(view.csv)).filter(row => row.indicador === "buscas").length, 8);
  const csv = reportCsv(["item", "valor"], [[" =HYPERLINK(\"malicioso\")", 3.28], ["@SUM(1)", null], ["Produto; com \"aspas\" e ação\nextra", -2]]);
  assert.ok(csv.startsWith("\ufeff")); assert.ok(csv.includes("\r\n"));
  const rows = await parseCsv(csv);
  assert.equal(rows[0]!.item, "'=HYPERLINK(\"malicioso\")"); assert.equal(rows[0]!.valor, "3,28");
  assert.equal(rows[1]!.item, "'@SUM(1)"); assert.equal(rows[1]!.valor, "");
  assert.equal(rows[2]!.item, "Produto; com \"aspas\" e ação extra"); assert.equal(rows[2]!.valor, "-2");
});

test("fonte indisponível deixa valores financeiros vazios; zero observado e ranking parcial permanecem distintos", async () => {
  const report = fixture(); report.finance = null; report.financeStatus = "unavailable"; report.clicks.rankingLimited = true;
  const view = presentBusinessReport(report), rows = await parseCsv(view.csv);
  assert.match(view.payload.embeds[2]!.fields[0]!.value, /indisponível.*não significa zero/);
  assert.match(view.payload.embeds[1]!.footer!.text, /parciais, inclusive nos anexos/);
  const unavailable = rows.find(row => row.secao === "financeiro")!;
  assert.equal(unavailable.status_dado, "unavailable"); assert.equal(unavailable.quantidade, ""); assert.equal(unavailable.valor_brl, "");
  assert.equal(rows.find(row => row.indicador === "lojas_clicadas")!.status_dado, "parcial");
  report.financeStatus = "not_configured"; assert.match(presentBusinessReport(report).markdown, /não configurado/);
  report.financeStatus = "ok"; assert.throws(() => presentBusinessReport(report), /report_incomplete/);
});

test("relatório cabe nos limites do Discord com os maiores rankings retornados e recusa truncamento ou dados incompletos", () => {
  const report = fixture();
  const ranking: Array<[string, number]> = Array.from({ length: 8 }, () => ["Nome 🛒 longo com acentos ".repeat(8), 999999]);
  report.movement.topBuscas = ranking; report.movement.topCategorias = ranking;
  report.movement.topProducts = ranking.map(([title, count]) => ({ title, count }));
  report.clicks.stores = ranking; report.clicks.products = report.movement.topProducts;
  report.finance!.topProducts = ranking;
  for (const status of ["pending", "approved", "declined", "deleted", "unknown"]) report.finance!.statuses[status] = { transactions: 99, sales: 123456789, commission: 1234567 };
  const view = presentBusinessReport(report); assert.doesNotThrow(() => assertDiscordReport(view.payload));
  const tooLong = structuredClone(view.payload); tooLong.embeds[0]!.fields[0]!.value = "x".repeat(1025);
  assert.throws(() => assertDiscordReport(tooLong), /discord_report_size_invalid/);
  report.movement.complete = false; assert.throws(() => presentBusinessReport(report), /report_incomplete/);
  assert.throws(() => reportCsv(["coluna"], [[Number.NaN]]), /report_csv_number_invalid/);
});
