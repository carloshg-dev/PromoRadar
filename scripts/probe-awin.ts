/**
 * Sonda a Awin p/ descobrir como puxar o FEED DE PRODUTOS:
 *  1) Datafeed LIST (apikey na URL) → lista os Feed IDs (fid) de cada anunciante.
 *  2) Publisher API (Bearer OAuth2) → confirma o token + lista programas aprovados.
 * Só leitura. NÃO imprime a chave inteira.
 *   npx tsx scripts/probe-awin.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const KEY = process.env.AWIN_API_KEY;
const PUB = process.env.AWIN_PUBLISHER_ID || "2936727";

async function main() {
  if (!KEY) { console.error("❌ Falta AWIN_API_KEY no .env.local"); process.exit(1); }
  console.log("Publisher:", PUB, "| key:", KEY.slice(0, 6) + "…(" + KEY.length + " chars)\n");

  // 1) Datafeed list — apikey vai NA URL (credencial de datafeed). Dá os Feed IDs.
  try {
    const url = `https://productdata.awin.com/datafeed/list/apikey/${KEY}/`;
    const r = await fetch(url);
    console.log("== DATAFEED LIST == status", r.status, r.headers.get("content-type"));
    const t = await r.text();
    console.log(t.slice(0, 1800));
  } catch (e) { console.log("datafeed list ERRO:", (e as Error).message); }

  // 2) Publisher API (Bearer) — confirma se o token é OAuth2 e lista programas.
  try {
    const r = await fetch(`https://api.awin.com/publishers/${PUB}/programmes?relationship=joined`, {
      headers: { Authorization: `Bearer ${KEY}` },
    });
    console.log("\n== PUBLISHER API /programmes (joined) == status", r.status);
    const arr = JSON.parse(await r.text()) as Array<{ id: number; name: string; logoUrl?: string; validDomains?: Array<{ domain: string }> }>;
    for (const p of arr) {
      const dom = (p.validDomains ?? []).map((d) => d.domain).join(", ");
      console.log(`  ${p.id} · ${p.name}\n     logo: ${p.logoUrl}\n     domínios: ${dom}`);
    }
  } catch (e) { console.log("publisher api ERRO:", (e as Error).message); }
}
main().catch((e) => { console.error("❌", e?.message ?? e); process.exit(1); });
