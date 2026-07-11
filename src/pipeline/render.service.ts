import { Resvg } from "@resvg/resvg-js";
import { readdirSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { listarPorStatus, atualizarCampanha, type Campanha } from "@/pipeline/campanhas.repo";
import { montarArteOferta, type DadosArte } from "@/lib/arte-oferta";

/**
 * SERVIÇO RENDER (etapa 2) — lê campanhas CURATED, gera os PNGs (feed + story)
 * e avança pra READY. O renderizador é ISOLADO: hoje resvg (nativo, sem browser,
 * baixa memória); trocar de lib = mexer só aqui. A arte (SVG) vem de
 * arte-oferta.ts, que não conhece o resvg. Falha marca a campanha FAILED.
 */

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
const SAIDA = join(process.cwd(), "achados-do-dia");

/** Fontes .ttf/.otf empacotadas (Inter) — carregadas no resvg p/ render igual na nuvem. */
function fontesEmpacotadas(): string[] {
  const dir = join(process.cwd(), "assets", "fonts");
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => /\.(ttf|otf)$/i.test(f)).map((f) => join(dir, f));
}

async function fotoDataUri(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") || "image/jpeg";
    if (!ct.startsWith("image/")) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 200) return null;
    return `data:${ct};base64,${buf.toString("base64")}`;
  } catch { return null; }
}

function dadosDaCampanha(c: Campanha, foto: string | null): DadosArte {
  const m = c.metadados as Record<string, number | string | null>;
  const num = (v: unknown) => (typeof v === "number" ? v : null);
  return {
    titulo: (m.titulo as string) ?? c.headline ?? "",
    precoAtual: num(m.precoAtual) ?? 0,
    precoOriginal: num(m.precoOriginal),
    descontoPct: num(m.descontoPct),
    promoScore: num(m.promoScore) ?? c.scoreConteudo,
    lojaNome: (m.lojaNome as string) ?? c.lojaSlug ?? "",
    precoMinHist: num(m.precoMinHist),
    precoAvgHist: num(m.precoAvgHist),
    precoMaxHist: num(m.precoMaxHist),
    fotoDataUri: foto,
  };
}

export async function renderizar(): Promise<{ ok: number; falhas: number }> {
  const pend = await listarPorStatus("CURATED", 20);
  if (!pend.length) return { ok: 0, falhas: 0 };
  mkdirSync(SAIDA, { recursive: true });
  const fontFiles = fontesEmpacotadas();
  let ok = 0, falhas = 0;

  for (const c of pend) {
    try {
      const foto = await fotoDataUri((c.metadados as Record<string, string>).imagemUrl);
      const dados = dadosDaCampanha(c, foto);
      const imagens: Record<string, string> = {};
      for (const [fmt, tall] of [["feed", false], ["story", true]] as const) {
        const svg = montarArteOferta(dados, tall);
        const png = new Resvg(svg, {
          fitTo: { mode: "width", value: 1080 },
          font: { fontFiles, loadSystemFonts: true, defaultFontFamily: "Inter" },
        }).render().asPng();
        const path = join(SAIDA, `campanha-${c.id}-${fmt}.png`);
        writeFileSync(path, png);
        imagens[fmt] = path;
      }
      // RENDERED→READY colapsados: não há gate de aprovação manual ainda. Quando
      // houver (revisão humana), READY passa a ser um passo à parte.
      await atualizarCampanha(c.id, "READY", { imagens });
      ok++;
    } catch (e) {
      await atualizarCampanha(c.id, "FAILED", { erro: `render: ${(e as Error).message}` });
      falhas++;
    }
  }
  return { ok, falhas };
}
