/**
 * Runner CLI dos scrapers.  Uso:
 *   npm run scrape           -> roda todos os adapters
 *   npm run scrape kabum     -> roda só a Kabum
 *   npm run scrape kabum ml  -> roda Kabum + Mercado Livre
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { executarColeta } from "@/services/collection.service";
import type { AdapterKey } from "@/core/domain/types";

const ALIAS: Record<string, AdapterKey> = {
  kabum: "kabum", ml: "mercadolivre", mercadolivre: "mercadolivre",
  pichau: "pichau", terabyte: "terabyte", amazon: "amazon", amz: "amazon",
  growth: "growth", soldiers: "soldiers",
  maxtitanium: "maxtitanium", max: "maxtitanium",
  integralmedica: "integralmedica", integral: "integralmedica",
  darklab: "darklab", dark: "darklab",
  havan: "havan",
  americanas: "americanas", amz_br: "americanas",
  ferramentasgerais: "ferramentasgerais", fg: "ferramentasgerais",
  lojadomecanico: "lojadomecanico", mecanico: "lojadomecanico",
  lomadee: "lomadee",
  awin: "awin", aliexpress: "awin",
};

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "all");
  const keys = args.length ? (args.map((a) => ALIAS[a]).filter(Boolean) as AdapterKey[]) : undefined;
  console.log("▶ Iniciando coleta:", keys ?? "todos os adapters");
  const r = await executarColeta(keys);
  console.log("\n✅ Coleta concluída");
  console.table(r.porAdapter);
  console.log(`Total: ${r.salvos} salvos / ${r.coletados} coletados / ${r.erros} erros (job ${r.jobId})`);
}
main().catch((e) => { console.error("❌", e); process.exit(1); });
