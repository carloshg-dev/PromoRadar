import type { Comparacao } from "@/infrastructure/repositories/produtos.repo";
import { ScorePill } from "@/components/score-ring";
import { StorePriceBars } from "@/components/store-price-bars";
import { formatBRL } from "@/lib/utils";
import { TrendingDown, ImageOff } from "lucide-react";

/**
 * Card de comparação — uma classe de produto (ex: "RTX 4060 8GB") com o preço de
 * cada loja em GRÁFICO DE BARRAS (mais barata em verde). Mesmo visual do destaque.
 */
export function ComparacaoCard({ c }: { c: Comparacao }) {
  return (
    <article className="glass hover-raise flex flex-col overflow-hidden rounded-2xl border border-line animate-fade-up">
      {/* header */}
      <div className="flex items-start gap-3 border-b border-line p-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-white">
          {c.ofertas[0]?.imagemUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.ofertas[0].imagemUrl as string} alt={c.rotulo} loading="lazy" className="h-full w-full object-contain p-1.5" />
          ) : (
            <ImageOff className="h-5 w-5 text-muted/40" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="label-mono mb-1 flex items-center gap-1.5 text-[10px] text-muted">
            <span>{c.categoriaEmoji}</span>{c.categoriaNome ?? c.categoriaSlug}
            <span className="text-line">·</span>{c.lojas} lojas
          </div>
          <h3 className="truncate font-display text-lg font-bold tracking-tightest text-white">{c.rotulo}</h3>
        </div>
        <ScorePill score={c.melhorScore} />
      </div>

      {/* gráfico de barras: preço por loja */}
      <div className="p-4">
        <StorePriceBars ofertas={c.ofertas} menorPreco={c.menorPreco} maiorPreco={c.maiorPreco} />
      </div>

      {/* footer: economia */}
      {c.economia > 0 && (
        <div className="mt-auto flex items-center justify-between border-t border-line bg-neon/5 px-4 py-2.5">
          <span className="flex items-center gap-1.5 text-xs text-neon">
            <TrendingDown className="h-3.5 w-3.5" /> economize até {formatBRL(c.economia)}
          </span>
          <span className="rounded-md bg-neon/15 px-1.5 py-0.5 text-[11px] font-bold text-neon">−{c.economiaPct}%</span>
        </div>
      )}
    </article>
  );
}
