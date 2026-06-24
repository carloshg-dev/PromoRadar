/**
 * Sonda da API affiliate da Lomadee — descobre o formato real das respostas
 * (canais, produtos, marcas) p/ eu construir o adapter certo. NÃO imprime a chave.
 * Uso:  npx tsx scripts/probe-lomadee.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const KEY = process.env.LOMADEE_API_KEY;
const BASE = process.env.LOMADEE_BASE || "https://api.lomadee.com.br";

async function get(path: string) {
  const r = await fetch(BASE + path, { headers: { "x-api-key": KEY as string } });
  let body: unknown;
  try { body = await r.json(); } catch { body = await r.text(); }
  return { status: r.status, body };
}

function amostra(o: unknown, max = 1800) {
  const s = typeof o === "string" ? o : JSON.stringify(o, null, 2);
  return s.length > max ? s.slice(0, max) + "\n…(cortado)" : s;
}

async function main() {
  if (!KEY) { console.error("❌ Falta LOMADEE_API_KEY no .env.local"); process.exit(1); }
  console.log("Base:", BASE, "\n");

  const ch = await get("/affiliate/channels");
  console.log("== CHANNELS == status", ch.status);
  console.log(amostra(ch.body, 700), "\n");

  const br = await get("/affiliate/brands?limit=50");
  console.log("== BRANDS (id · name · segment · site) == status", br.status);
  for (const b of ((br.body as { data?: Array<Record<string, unknown>> }).data ?? [])) {
    console.log(`  ${b.id} · ${b.name} · ${b.segment} · ${b.site}`);
  }
  console.log("");

  const pr = await get("/affiliate/products?limit=2");
  console.log("== PRODUCTS (1 produto COMPLETO) == status", pr.status);
  const prod0 = (pr.body as { data?: Array<{ url?: string }> }).data?.[0];
  console.log(amostra(prod0, 4000), "\n");

  // Descobre o corpo do shortener testando alguns formatos com a URL do 1o produto.
  const alvo = prod0?.url || "https://www.megamamute.com.br";
  const canais = (ch.body as { data?: Array<{ id?: string }> }).data ?? [];
  const channelId = canais[0]?.id;
  void channelId; void alvo;
  for (const termo of ["perfume", "fogão", "whey", "placa de video"]) {
    const r = await get(`/affiliate/products?search=${encodeURIComponent(termo)}&limit=3`);
    const body = r.body as { data?: Array<Record<string, unknown>>; count?: number };
    console.log(`== search="${termo}" == status ${r.status} · count=${body.count} · n=${body.data?.length}`);
    const p = body.data?.[0] as { name?: string; url?: string; organizationId?: string; options?: Array<{ seller?: string; pricing?: Array<{ price?: number }> }> } | undefined;
    if (p) console.log(`   1o: ${p.name?.slice(0,45)} | seller=${p.options?.[0]?.seller} | preço=${p.options?.[0]?.pricing?.[0]?.price} | org=${p.organizationId ? "ok" : "?"} | ${p.url?.slice(0,40)}`);
  }
}
main().catch((e) => { console.error("❌", e); process.exit(1); });
