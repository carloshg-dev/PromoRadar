/**
 * Investiga se os FEEDS de oferta por marca (ex: "Concórdia Ofertas de Monitores")
 * vêm pela API de campanhas — e se trazem produtos/links (automatizável) ou se é
 * só o xlsx manual. Só leitura.
 *   npx tsx scripts/lomadee-campanhas.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const KEY = process.env.LOMADEE_API_KEY as string;
const BASE = "https://api.lomadee.com.br";
const H = { "x-api-key": KEY };

async function get(path: string) {
  const r = await fetch(BASE + path, { headers: H });
  let body: any = null;
  try { body = await r.json(); } catch { body = await r.text(); }
  return { status: r.status, body };
}

async function main() {
  if (!KEY) { console.error("Falta LOMADEE_API_KEY"); process.exit(1); }

  const c = await get("/affiliate/campaigns?limit=10");
  console.log("CAMPAIGNS status", c.status, "| total:", c.body?.meta?.total ?? "?");
  const camps: any[] = c.body?.data ?? [];
  console.log("nesta página:", camps.length);
  if (camps[0]) {
    console.log("\nCampos de 1 campanha:", Object.keys(camps[0]).join(", "));
    console.log(JSON.stringify(camps[0], null, 2).slice(0, 1500));
  }
  console.log("\nTipos/nomes das campanhas:");
  for (const c2 of camps.slice(0, 10)) {
    console.log(`  [${c2.type ?? "?"}] ${c2.name ?? c2.title ?? "?"} ${c2.brand?.name ? "(" + c2.brand.name + ")" : ""}`);
  }
}
main().catch((e) => { console.error("ERRO", e?.message ?? e); process.exit(1); });
