import Link from "next/link";
import type { Produto } from "@/core/domain/types";
import { formatBRL, timeAgo } from "@/lib/utils";
import { ehLinkMonetizado } from "@/lib/afiliados";
import { Trophy, ImageOff, ArrowUpRight, Scale } from "lucide-react";
import { CardSaveButton } from "./card-save-button";

export function ProdutoCard({ p, rank }: { p: Produto; rank?: number }) {
  const monetizado = ehLinkMonetizado(p.url);
  const temHistorico = p.precoMinHist != null && p.precoMaxHist != null && p.precoMaxHist > p.precoMinHist;
  const menorHist = temHistorico && p.precoAtual != null && p.precoAtual <= (p.precoMinHist as number);
  const desconto = p.precoOriginal && p.precoAtual && p.precoOriginal > p.precoAtual ? Math.round((1 - p.precoAtual / p.precoOriginal) * 100) : null;
  return <article className="catalog-card group relative isolate flex min-w-0 flex-col overflow-hidden">
    <Link prefetch={false} href={`/produto/${p.id}`} aria-label={p.titulo} className="absolute inset-0 z-10 rounded-2xl" />
    <div className="relative h-36 overflow-hidden bg-white sm:h-44 lg:h-48">
      {p.imagemUrl ? <img src={p.imagemUrl} alt={p.titulo} loading="lazy" decoding="async" width={360} height={270} className="product-picture h-full w-full object-contain px-5 py-4 sm:p-5" /> : <div className="grid h-full place-items-center bg-bg-soft"><ImageOff className="h-8 w-8 text-muted" /></div>}
      <CardSaveButton item={{ id: p.id, titulo: p.titulo }} />
    </div>
    <div className="flex flex-1 flex-col px-3 pb-3 pt-1 sm:px-4 sm:pb-4">
      <div className="mb-1.5 flex min-h-5 items-center justify-between gap-1 text-[11px] text-muted"><span className="truncate">{p.lojaNome}</span>{rank != null && rank <= 3 && <span className="tabular-nums">#{rank}</span>}{desconto != null && <span className="shrink-0 rounded-md bg-bg-soft px-1.5 py-0.5 font-semibold text-brand" title="Sobre o preço de referência da loja; não representa a variação do histórico.">−{desconto}%<span className="sr-only"> sobre o preço de referência da loja</span></span>}</div>
      <h3 className="mb-3 line-clamp-2 min-h-[2.5rem] text-[13px] font-medium leading-5 text-ink group-hover:text-brand sm:text-sm">{p.titulo}</h3>
      <div>
        <p className="mb-1 min-h-4 text-[11px] text-muted">{p.precoOriginal && desconto != null ? <span className="line-through">{formatBRL(p.precoOriginal)}</span> : "Preço coletado"}</p>
        <p className="price whitespace-nowrap text-[clamp(1.35rem,2.2vw,1.85rem)] font-bold leading-none text-ink">{formatBRL(p.precoAtual)}</p>
      </div>
      <div className="mt-auto">
        <div className="mt-3 min-h-5 text-[11px] leading-4 text-brand">{menorHist ? <span className="inline-flex items-start gap-1"><Trophy className="h-3.5 w-3.5 shrink-0" />Menor preço histórico</span> : temHistorico ? <span>Histórico disponível</span> : <span>Confira as condições na loja</span>}</div>
        {temHistorico && <div className="mt-1.5 flex flex-wrap justify-between gap-x-2 text-[10px] leading-4 text-muted"><span>Mín. {formatBRL(p.precoMinHist)}</span><span>Máx. {formatBRL(p.precoMaxHist)}</span></div>}
        <div className="mt-2 flex flex-wrap justify-between gap-1 text-[11px] text-muted"><time dateTime={p.atualizadoEm} suppressHydrationWarning>{timeAgo(p.atualizadoEm)}</time>{p.promoScore != null && Number.isFinite(p.promoScore) && p.promoScore >= 0 && p.promoScore <= 100 && <span title="Indicador PromoDetec; consulte os detalhes do produto.">PromoScore {Math.round(p.promoScore)}</span>}</div>
        {monetizado ? <a href={`/r/${p.id}?o=card`} rel="nofollow sponsored" aria-label={`Ver oferta na ${p.lojaNome}`} className="relative z-20 mt-3 flex min-h-11 items-center justify-between gap-1 rounded-lg bg-brand px-3 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-brand-2 sm:text-xs">Ver oferta na loja<ArrowUpRight className="h-4 w-4 shrink-0" /></a> : <Link prefetch={false} href={`/produto/${p.id}`} className="relative z-20 mt-3 flex min-h-11 items-center justify-between gap-1 rounded-lg border border-line px-3 py-2 text-[11px] font-semibold text-brand hover:bg-bg-soft sm:text-xs">Comparar preço<Scale className="h-4 w-4 shrink-0" /></Link>}
      </div>
    </div>
  </article>;
}
