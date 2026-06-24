/**
 * Lista as marcas da Lomadee (por segmento) e TESTA como puxar produtos de uma
 * marca específica (brandId / brand / organizationId). Só leitura. NÃO imprime a chave.
 *   npx tsx scripts/lomadee-marcas.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const KEY = process.env.LOMADEE_API_KEY as string;
const BASE = "https://api.lomadee.com.br";
const H = { "x-api-key": KEY };

async function get(path: string) {
  const r = await fetch(BASE + path, { headers: H });
  let body: any = null;
  try { body = await r.json(); } catch { /* ignore */ }
  return { status: r.status, body };
}

async function main() {
  if (!KEY) { console.error("Falta LOMADEE_API_KEY"); process.exit(1); }

  // 1) Marcas (1 página de 100)
  const br = await get("/affiliate/brands?limit=100");
  const brands: any[] = br.body?.data ?? [];
  console.log(`MARCAS: ${br.body?.pagination?.total ?? brands.length} total / ${brands.length} nesta página\n`);
  const seg = new Map<string, string[]>();
  for (const b of brands) {
    const s = (b.segment || "?").toString();
    if (!seg.has(s)) seg.set(s, []);
    seg.get(s)!.push(`${b.name}[${String(b.id).slice(0, 8)}]`);
  }
  for (const [s, n] of [...seg.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`[${s}] (${n.length}) ${n.join(", ")}`);
  }

  // 2) Testa puxar produtos de uma marca específica (Atlas / Concórdia)
  const alvo = brands.find((b) => /atlas/i.test(b.name)) ?? brands.find((b) => /conc[oó]rdia/i.test(b.name)) ?? brands[0];
  console.log(`\nTESTE produtos da marca "${alvo?.name}" (id=${alvo?.id}):`);
  for (const q of [
    `brandId=${alvo?.id}`, `brand=${alvo?.id}`, `organizationId=${alvo?.id}`,
    `brandIds=${alvo?.id}`, `brand_id=${alvo?.id}`,
  ]) {
    const rr = await get(`/affiliate/products?${q}&limit=3`);
    const c = rr.body?.count ?? rr.body?.message ?? "-";
    const ex = (rr.body?.data?.[0]?.name ?? "").slice(0, 45);
    console.log(`  ${q.padEnd(40)} → ${rr.status}  count=${c}  ${ex}`);
  }

  // 3) Estrutura completa de 1 marca: channels (link afiliado?) + commission (taxa?)
  console.log(`\nESTRUTURA "${alvo?.name}":`);
  console.log("  commission:", JSON.stringify(alvo?.commission));
  console.log("  channels:", JSON.stringify(alvo?.channels)?.slice(0, 600));
}
main().catch((e) => { console.error("ERRO", e?.message ?? e); process.exit(1); });
