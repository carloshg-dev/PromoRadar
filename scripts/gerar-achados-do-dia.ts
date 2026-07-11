/**
 * MÁQUINA DE CONTEÚDO v4.0 — Fase 2 (render). Une o Núcleo (top5DoDia) ao SVG
 * (arte-oferta) e cospe os 5 PNGs finais + legendas, prontos pra postar. Sem
 * browser: resvg (nativo) renderiza SVG→PNG. Processa 1 por vez (baixa memória).
 *
 * Rodar: npx tsx scripts/gerar-achados-do-dia.ts
 * Saída: ./achados-do-dia/achado-N-loja.png (+ .txt com a legenda)
 */
import { config } from "dotenv"; config({ path: ".env.local" });
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

/** Busca a foto do produto e embute como data:URI (resvg não baixa URL remota). */
async function fotoDataUri(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") || "image/jpeg";
    if (!ct.startsWith("image/")) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 200) return null; // GIF-placeholder/erro
    return `data:${ct};base64,${buf.toString("base64")}`;
  } catch { return null; }
}

async function main() {
  const { top5DoDia } = await import("../src/infrastructure/repositories/produtos.repo");
  const { montarArteOferta } = await import("../src/lib/arte-oferta");

  const top = await top5DoDia(5);
  const dir = join(process.cwd(), "achados-do-dia");
  mkdirSync(dir, { recursive: true });
  console.log(`\nGerando ${top.length} artes em ${dir}\n`);

  for (let i = 0; i < top.length; i++) {
    const a = top[i]!;
    const foto = await fotoDataUri(a.imagemUrl);
    const svg = montarArteOferta({
      titulo: a.titulo,
      precoAtual: a.precoAtual ?? 0,
      precoOriginal: a.precoOriginal,
      descontoPct: a.descontoPct,
      promoScore: a.promoScore,
      lojaNome: a.lojaNome,
      precoMinHist: a.precoMinHist,
      precoAvgHist: a.precoAvgHist,
      precoMaxHist: a.precoMaxHist,
      fotoDataUri: foto,
    });
    // 1080px de largura → 1350 de altura (feed 4:5), o resvg cuida da escala.
    const png = new Resvg(svg, { fitTo: { mode: "width", value: 1080 }, font: { loadSystemFonts: true } })
      .render().asPng();
    const base = `achado-${i + 1}-${a.lojaSlug}`;
    writeFileSync(join(dir, `${base}.png`), png);
    writeFileSync(join(dir, `${base}.txt`), a.legenda);
    console.log(`✅ #${i + 1} ${base}.png (${Math.round(png.length / 1024)}KB) — ${a.lojaNome} · ${a.descontoPct}% · sc${a.scoreConteudo} · foto:${foto ? "✓" : "placeholder"}`);
  }
  console.log(`\nPronto! ${top.length} PNGs + legendas em ${dir}`);
}
main().then(() => process.exit(0)).catch((e) => { console.error("FALHOU:", e.message, e.stack); process.exit(1); });
