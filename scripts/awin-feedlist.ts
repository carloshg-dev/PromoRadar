/**
 * Sonda a URL Mestre de Feeds da Awin (AWIN_DATAFEED_URL) p/ ver o formato:
 * quais feeds (advertiser, feed id, idioma, URL de download de produtos) temos.
 * Só leitura. NÃO imprime a URL com o token inteiro.
 *   npx tsx scripts/awin-feedlist.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const URL_FEED = process.env.AWIN_DATAFEED_URL;

async function main() {
  if (!URL_FEED) { console.error("❌ Falta AWIN_DATAFEED_URL no .env.local"); process.exit(1); }
  const r = await fetch(URL_FEED);
  const t = await r.text();
  const linhas = t.split("\n");
  console.log("status:", r.status, "| total feeds:", linhas.length - 1, "\n");
  const IDS = ["17665", "18879", "76888", "117737"];
  const grupo = new Map<string, { nome: string; status: string; feeds: string[]; prod: number; primeira: string }>();
  for (const ln of linhas) {
    const c = ln.split('","').map((s) => s.replace(/^"|"$/g, ""));
    const id = c[0] ?? "";
    if (!IDS.includes(id)) continue;
    const g = grupo.get(id) ?? { nome: c[1] ?? "", status: c[3] ?? "", feeds: [], prod: 0, primeira: c[12] ?? "" };
    g.feeds.push(c[5] ?? "");
    g.prod += Number(c[11] ?? 0);
    grupo.set(id, g);
  }
  console.log("== RESUMO DOS MEUS FEEDS BR ==");
  for (const [id, g] of grupo) {
    console.log(`  adv ${id} · ${g.nome} · [${g.status}] · ${g.feeds.length} feeds · ${g.prod} produtos`);
    console.log(`     feeds: ${g.feeds.join(", ")}`);
  }
  console.log("\nIDs faltando:", IDS.filter((i) => !grupo.has(i)).join(", ") || "nenhum");
}
main().catch((e) => { console.error("❌", e?.message ?? e); process.exit(1); });
