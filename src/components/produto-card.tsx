import Link from "next/link";
import type { Produto } from "@/core/domain/types";
import { formatBRL, timeAgo } from "@/lib/utils";
import { ehLinkMonetizado } from "@/lib/afiliados";
import { Trophy, ImageOff, ArrowUpRight, Scale } from "lucide-react";

export function ProdutoCard({ p, rank }: { p: Produto; rank?: number }) {
  const monetizado = ehLinkMonetizado(p.url);
  const temHistorico = p.precoMinHist != null && p.precoMaxHist != null && p.precoMaxHist > p.precoMinHist;
  const menorHist = temHistorico && p.precoAtual != null && p.precoAtual <= (p.precoMinHist as number);
  const desconto = p.precoOriginal && p.precoAtual && p.precoOriginal > p.precoAtual ? Math.round((1 - p.precoAtual / p.precoOriginal) * 100) : null;
  const pos = temHistorico && p.precoAtual != null ? Math.max(0, Math.min(1, (p.precoAtual - (p.precoMinHist as number)) / ((p.precoMaxHist as number) - (p.precoMinHist as number)))) : null;
  return <article className="catalog-card group relative isolate flex min-w-0 flex-col overflow-hidden">
    <Link prefetch={false} href={`/produto/${p.id}`} aria-label={p.titulo} className="absolute inset-0 z-10 rounded-2xl" />
    <div className="flex min-h-11 items-center justify-between gap-2 px-4 pt-2 text-xs text-muted"><span className="truncate">{p.lojaNome}</span>{rank != null && rank <= 3 && <span className="tabular-nums">#{rank}</span>}{desconto != null && <span className="shrink-0 rounded-md bg-bg-soft px-2 py-1 font-semibold text-brand">−{desconto}%</span>}</div>
    <div className="relative aspect-[4/3] overflow-hidden bg-white">{p.imagemUrl ? <img src={p.imagemUrl} alt={p.titulo} loading="lazy" decoding="async" width={360} height={270} className="product-picture h-full w-full object-contain p-5" /> : <div className="grid h-full place-items-center bg-bg-soft"><ImageOff className="h-8 w-8 text-muted" /></div>}</div>
    <div className="flex flex-1 flex-col p-4 pt-3">
      <h3 className="mb-4 line-clamp-2 min-h-[2.6rem] text-sm font-medium leading-snug text-ink group-hover:text-brand">{p.titulo}</h3>
      <div className="mt-auto">
        {p.precoOriginal && desconto != null && <p className="mb-1 text-xs text-muted line-through">{formatBRL(p.precoOriginal)}</p>}
        <p className="price text-[clamp(1.2rem,2vw,1.65rem)] font-semibold leading-none text-ink">{formatBRL(p.precoAtual)}</p>
        {pos != null && <div className="mt-4"><div aria-hidden="true" className="relative h-1 rounded-full bg-bg-over"><span className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand" style={{left: `${pos * 100}%`}} /></div><div className="mt-2 grid grid-cols-2 gap-2 text-[11px] leading-4 text-muted"><span>Mín. <span className="block tabular-nums">{formatBRL(p.precoMinHist)}</span></span><span className="text-right">Máx. <span className="block tabular-nums">{formatBRL(p.precoMaxHist)}</span></span></div></div>}
        <div className="mt-3 min-h-5 text-[11px] text-brand">{menorHist && <span className="inline-flex items-center gap-1"><Trophy className="h-3.5 w-3.5" />Menor preço histórico</span>}</div>
        <time dateTime={p.atualizadoEm} suppressHydrationWarning className="mt-1 block text-xs text-muted">{timeAgo(p.atualizadoEm)}</time>
        {monetizado ? <a href={`/r/${p.id}?o=card`} rel="nofollow sponsored" aria-label={`Ver oferta na ${p.lojaNome}`} className="relative z-20 mt-4 flex min-h-11 items-center justify-between gap-1 rounded-lg bg-bg-soft px-3 py-2 text-xs font-semibold text-brand transition-colors hover:bg-lime">Ver oferta na loja<ArrowUpRight className="h-4 w-4 shrink-0" /></a> : <Link prefetch={false} href={`/produto/${p.id}`} className="relative z-20 mt-4 flex min-h-11 items-center justify-between gap-1 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-brand hover:bg-bg-soft">Comparar preço<Scale className="h-4 w-4 shrink-0" /></Link>}
      </div>
    </div>
  </article>;
}
