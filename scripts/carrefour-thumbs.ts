/**
 * Busca a thumbnail (og:image) de cada oferta verificada da Carrefour, pra dar
 * credibilidade aos cards. Só leitura (fetch das páginas públicas). Imprime
 * "url => imagem" pra eu colar no data file.
 *   npx tsx scripts/carrefour-thumbs.ts
 */
import { OFERTAS_VERIFICADAS } from "@/lib/ofertas-verificadas";

async function ogImage(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
        "accept": "text/html",
      },
    });
    if (!r.ok) return `HTTP ${r.status}`;
    const html = await r.text();
    const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return m?.[1] ?? "(sem og:image)";
  } catch (e) {
    return `ERRO ${(e as Error).message}`;
  }
}

async function main() {
  for (const o of OFERTAS_VERIFICADAS) {
    const img = await ogImage(o.url);
    console.log(`${o.titulo.slice(0, 30)} => ${img}`);
    await new Promise((r) => setTimeout(r, 400));
  }
}
main().catch((e) => { console.error("ERRO", e?.message ?? e); process.exit(1); });
