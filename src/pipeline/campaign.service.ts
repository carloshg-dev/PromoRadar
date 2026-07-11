import type { AchadoDoDia } from "@/infrastructure/repositories/produtos.repo";
import { legendaPersuasiva } from "@/core/curadoria";

/**
 * SERVIÇO CAMPAIGN — monta o "pacote" de uma campanha a partir de um achado:
 * headline, legenda e metadados. Hoje 1 legenda; curta/média/longa entram no
 * dia em que um canal precisar (evita complexidade sem benefício). Puro/testável.
 */
export interface CampanhaMontada {
  headline: string;
  legenda: string;
  hashtags: string[];
  metadados: Record<string, unknown>;
}

function tituloCurto(t: string, max = 40): string {
  if (t.length <= max) return t;
  const c = t.lastIndexOf(" ", max);
  return t.slice(0, c > 15 ? c : max).trim();
}

export function montarCampanha(a: AchadoDoDia): CampanhaMontada {
  const desconto = a.descontoPct ? `−${a.descontoPct}%` : "OFERTA";
  return {
    headline: `${desconto} · ${tituloCurto(a.titulo)}`,
    legenda: legendaPersuasiva(a),
    hashtags: ["promodetec", "achadododia", "oferta", "promoção"],
    metadados: {
      titulo: a.titulo,
      precoAtual: a.precoAtual,
      precoOriginal: a.precoOriginal,
      descontoPct: a.descontoPct,
      promoScore: a.promoScore,
      precoMinHist: a.precoMinHist,
      precoAvgHist: a.precoAvgHist,
      precoMaxHist: a.precoMaxHist,
      imagemUrl: a.imagemUrl,
      lojaNome: a.lojaNome,
      categoriaNome: a.categoriaNome,
    },
  };
}
