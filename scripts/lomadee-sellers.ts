/**
 * Valida a abordagem "buscar por termo e filtrar por marca/vendedor": faz buscas
 * por vertical e mostra quais SELLERS aparecem — e se as marcas que o dono curou
 * (Atlas, Bio Bran, Candide...) realmente surgem nos resultados. Só leitura.
 *   npx tsx scripts/lomadee-sellers.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const KEY = process.env.LOMADEE_API_KEY as string;
const BASE = "https://api.lomadee.com.br";
const H = { "x-api-key": KEY };

const TERMOS = [
  "fogao", "cooktop", "geladeira", "robo aspirador",
  "monitor", "ssd", "placa de video", "notebook",
  "whey protein", "creatina", "esteira ergometrica",
  "perfume", "maquiagem", "brinquedo",
];

const CURADAS = ["atlas", "dako", "concordia", "pcyes", "megamamute", "inpower",
  "lenovo", "amakha", "amokarite", "candide", "bio bran", "casa do fitness",
  "defitness", "continental", "electrolux", "gazin", "irobot", "kennedy",
  "le loyn", "esbelt", "loja"];

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

async function main() {
  if (!KEY) { console.error("Falta LOMADEE_API_KEY"); process.exit(1); }
  const sellerCount = new Map<string, number>();
  for (const t of TERMOS) {
    const r = await fetch(`${BASE}/affiliate/products?search=${encodeURIComponent(t)}&limit=100`, { headers: H });
    const j: any = await r.json().catch(() => ({}));
    const prods: any[] = j.data ?? [];
    const sellers = new Set<string>();
    for (const p of prods) {
      const s = p.options?.[0]?.seller;
      if (s) { sellers.add(s); sellerCount.set(s, (sellerCount.get(s) ?? 0) + 1); }
    }
    console.log(`"${t}" → ${prods.length} produtos | sellers: ${[...sellers].slice(0, 8).join(", ")}`);
    await new Promise((res) => setTimeout(res, 300));
  }
  console.log("\n=== SELLERS mais frequentes (top 25) ===");
  for (const [s, n] of [...sellerCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25)) {
    const curada = CURADAS.some((c) => norm(s).includes(c)) ? "  ⭐CURADA" : "";
    console.log(`  ${String(n).padStart(3)}  ${s}${curada}`);
  }
}
main().catch((e) => { console.error("ERRO", e?.message ?? e); process.exit(1); });
