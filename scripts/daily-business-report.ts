import { config } from "dotenv";
config({ path: ".env.local", quiet: true } as Parameters<typeof config>[0]);
import { mkdir, writeFile } from "node:fs/promises";
import { carregarMovimento, carregarRankingCliques, nomesProdutos } from "../src/infrastructure/repositories/analytics.repo";
import { boundedJson } from "../src/infrastructure/coupons/sources";
import { reportWindow, summarizeAwinTransactions } from "../src/core/affiliate-report";
import { presentBusinessReport, type BusinessReport } from "../src/core/reporting/business-report";
import { reportDate } from "../src/core/reporting/presentation";
import { sendDiscordReport } from "../src/infrastructure/notify/discord-report";

async function main() {
  const args = process.argv.slice(2), days = args.includes("--weekly") ? 7 : 1;
  const { since, until } = reportWindow(days);
  const [movement, clicks] = await Promise.all([carregarMovimento(since, until), carregarRankingCliques(since, until)]);
  if (!movement.complete || !clicks.complete) throw new Error("report_incomplete");
  const names = await nomesProdutos([...movement.topProdutoIds.map(([id]) => id), ...clicks.products.map(([id]) => id)]);
  let finance: BusinessReport["finance"] = null, financeStatus: BusinessReport["financeStatus"] = "not_configured";
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
  const { topProdutoIds, ...totals } = movement;
  const report: BusinessReport = { generatedAt: new Date().toISOString(), days, since, until, movement: { ...totals, topProducts: topProdutoIds.map(([id, count]) => ({ title: names.get(id) ?? "indisponível", count })) }, clicks: { ...clicks, products: clicks.products.map(([id, count]) => ({ title: names.get(id) ?? "indisponível", count })) }, financeStatus, finance, discordSent: false };
  const presentation = presentBusinessReport(report);
  await mkdir("reports", { recursive: true });
  const filename = `reports/business-${days === 1 ? "daily" : "weekly"}.json`;
  await writeFile(filename, JSON.stringify(report, null, 2));
  await writeFile(filename.replace(".json", ".md"), presentation.markdown);
  await writeFile(filename.replace(".json", ".csv"), presentation.csv);
  await writeFile(filename.replace(".json", ".data.json"), presentation.json);
  await writeFile(filename.replace(".json", ".discord.json"), JSON.stringify(presentation.payload, null, 2));
  if (args.includes("--send")) {
    const hook = process.env.PROMODETEC_REPORT_DISCORD_WEBHOOK_URL || process.env.PROMODETEC_LEADS_DISCORD_WEBHOOK_URL;
    if (!hook) throw new Error("report_discord_configuration_missing");
    const tag = `${days === 1 ? "diario" : "semanal"}-${reportDate(since).split("/").reverse().join("-")}`;
    await sendDiscordReport(hook, presentation.payload, [
      { filename: `promodetec-${tag}.csv`, text: presentation.csv, contentType: "text/csv;charset=utf-8" },
      { filename: `promodetec-${tag}.json`, text: presentation.json, contentType: "application/json" },
    ]);
    report.discordSent = true;
    await writeFile(filename, JSON.stringify(report, null, 2));
  }
  console.log(JSON.stringify({ days, since, until, events: movement.totalEventos, redirects: movement.redirectRequests, financeStatus, discordSent: report.discordSent }));
}
main().catch(error => { console.error(error instanceof Error && /^[a-z0-9_]+$/.test(error.message) ? error.message : "business_report_failed"); process.exitCode = 1; });
