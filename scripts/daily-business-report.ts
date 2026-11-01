import { config } from "dotenv";
config({ path: ".env.local", quiet: true } as Parameters<typeof config>[0]);
import { mkdir, writeFile } from "node:fs/promises";
import { carregarMovimento, carregarRankingCliques, nomesProdutos } from "../src/infrastructure/repositories/analytics.repo";
import { boundedJson } from "../src/infrastructure/coupons/sources";
import { reportWindow, summarizeAwinTransactions } from "../src/core/affiliate-report";

const clean = (text: string) => text.replace(/[@`<>*_[\]\\]/g, "").replace(/\s+/g, " ").slice(0, 100);
const money = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
async function main() {
  const args = process.argv.slice(2), days = args.includes("--weekly") ? 7 : 1;
  const { since, until } = reportWindow(days);
  const [movement, clicks] = await Promise.all([carregarMovimento(since, until), carregarRankingCliques(since, until)]);
  if (!movement.complete || !clicks.complete) throw new Error("report_incomplete");
  const names = await nomesProdutos([...movement.topProdutoIds.map(([id]) => id), ...clicks.products.map(([id]) => id)]);
  let finance: ReturnType<typeof summarizeAwinTransactions> | null = null, financeStatus = "not_configured";
  if (process.env.AWIN_API_KEY) {
    try {
      const publisher = process.env.AWIN_PUBLISHER_ID || "2936727";
      if (!/^\d{1,12}$/.test(publisher)) throw new Error("publisher_invalid");
      const url = new URL(`https://api.awin.com/publishers/${publisher}/transactions/`);
      url.search = new URLSearchParams({ startDate: since.slice(0, 19), endDate: new Date(Date.parse(until) - 1000).toISOString().slice(0, 19), timezone: "UTC", dateType: "transaction", showBasketProducts: "true" }).toString();
      const rows = await boundedJson(url.toString(), { headers: { authorization: `Bearer ${process.env.AWIN_API_KEY}` } });
      if (!Array.isArray(rows)) throw new Error("awin_transactions_schema");
      finance = summarizeAwinTransactions(rows); financeStatus = "ok";
    } catch { financeStatus = "unavailable"; }
  }
  const date = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short" });
  const lines = [
    `**PromoDetec — ${days === 1 ? "diário" : "semanal"}**`,
    `${date.format(new Date(since))} a ${date.format(new Date(Date.parse(until) - 1000))} · Brasília`,
    `**Movimento consentido**: ${movement.totalEventos} ações; ${movement.counts.visita ?? 0} páginas abertas; ${movement.counts.ver_produto ?? 0} produtos vistos; ${movement.counts.salvar_produto ?? 0} salvos; ${movement.counts.copiar_cupom ?? 0} cópias de cupom.`,
    `Celular: ${movement.mobile} ações · desktop: ${movement.desktop}. Cadastros: ${movement.registrations}.`,
    `**Buscas**: ${movement.topBuscas.map(([term, n]) => `${clean(term)} (${n})`).join(" · ") || "sem ações registradas"}`,
    `**Produtos mais vistos**: ${movement.topProdutoIds.map(([id, n]) => `${clean(names.get(id) ?? "Produto indisponível")} (${n})`).join(" · ") || "sem ações registradas"}`,
    `**Lojas mais clicadas**: ${clicks.stores.map(([store, n]) => `${clean(store)} (${n})`).join(" · ") || "sem redirecionamentos registrados"}`,
    `**Saídas para lojas**: ${movement.redirectRequests}. ${clicks.products.slice(0, 5).map(([id, n]) => `${clean(names.get(id) ?? "Produto indisponível")} (${n})`).join(" · ")}`,
  ];
  if (finance) {
    lines.push("**Vendas Awin em BRL (data da transação)**");
    for (const [status, bucket] of Object.entries(finance.statuses)) lines.push(`${({ pending: "Pendentes", approved: "Aprovadas", declined: "Recusadas", deleted: "Excluídas", unknown: "Status não reconhecido" } as Record<string, string>)[status]}: ${bucket.transactions} transações · valor ${money(bucket.sales)} · comissão ${money(bucket.commission)}.`);
    if (!finance.brlRows) lines.push("Nenhuma venda BRL retornada para esta janela.");
    lines.push(`**Mais vendidos na Awin**: ${finance.topProducts.map(([name, n]) => `${clean(name)} (${n})`).join(" · ") || "nomes de produtos não fornecidos nesta janela; não inferidos pelos cliques"}.`);
    if (finance.otherCurrency) lines.push(`${finance.otherCurrency} transações em outras moedas ficaram fora dos totais BRL.`);
  } else lines.push(`**Vendas/comissões Awin**: ${financeStatus === "unavailable" ? "consulta indisponível" : "acesso não configurado"}; ausência de dados não significa zero vendas.`);
  lines.push("Shopee, Amazon e Lomadee: vendas/comissões ainda não integradas; não incluídas nos totais.", "Ações não são pessoas únicas; cliques não são compras. Comissões pendentes não são receita paga. Sem identificação pessoal ou navegação individual no Discord.");
  if (movement.rankingLimited || clicks.rankingLimited) lines.push("Ranking limitado pelo teto de agregação; não representa censo completo.");
  const report = { generatedAt: new Date().toISOString(), days, since, until, movement: { ...movement, topProdutoIds: undefined, topProducts: movement.topProdutoIds.map(([id, count]) => ({ title: names.get(id) ?? "indisponível", count })) }, clicks: { ...clicks, products: clicks.products.map(([id, count]) => ({ title: names.get(id) ?? "indisponível", count })) }, financeStatus, finance, discordSent: false };
  await mkdir("reports", { recursive: true });
  const filename = `reports/business-${days === 1 ? "daily" : "weekly"}.json`;
  if (args.includes("--send")) {
    const hook = process.env.PROMODETEC_REPORT_DISCORD_WEBHOOK_URL || process.env.PROMODETEC_LEADS_DISCORD_WEBHOOK_URL;
    if (!hook || !/^https:\/\/(?:discord\.com|discordapp\.com)\/api\/webhooks\/[0-9]+\/[A-Za-z0-9_-]+$/.test(hook)) throw new Error("report_discord_configuration_missing");
    const chunks: string[] = []; let current = "";
    for (const line of lines) { const text = line.slice(0, 1700); if ((current + "\n" + text).length > 1850) { chunks.push(current); current = ""; } current += (current ? "\n" : "") + text; }
    if (current) chunks.push(current);
    for (const content of chunks) {
      const response = await fetch(hook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: "PromoDetec | Operação", allowed_mentions: { parse: [] }, content }), redirect: "error", signal: AbortSignal.timeout(15000) });
      if (!response.ok) { await response.body?.cancel(); throw new Error(`discord_report_http_${response.status}`); }
      await response.body?.cancel();
    }
    report.discordSent = true;
  }
  await writeFile(filename, JSON.stringify(report, null, 2));
  await writeFile(filename.replace(".json", ".md"), lines.join("\n\n"));
  console.log(JSON.stringify({ days, since, until, events: movement.totalEventos, redirects: movement.redirectRequests, financeStatus, discordSent: report.discordSent }));
}
main().catch(error => { console.error(error instanceof Error && /^[a-z0-9_]+$/.test(error.message) ? error.message : "business_report_failed"); process.exitCode = 1; });
