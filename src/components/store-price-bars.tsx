import Link from "next/link";
import type { Produto } from "@/core/domain/types";
import { formatBRL, corLoja } from "@/lib/utils";

/** Preço e título real por loja, sem estado cliente ou consulta adicional. */
export function StorePriceBars({ ofertas, menorPreco, maiorPreco, limit = 5 }: { ofertas: Produto[]; menorPreco: number; maiorPreco: number; limit?: number }) {
  return <div className="space-y-4">{ofertas.slice(0, limit).map((oferta, index) => {
    const menor = index === 0;
    const width = maiorPreco > 0 ? Math.max(10, Math.round(((oferta.precoAtual as number) / maiorPreco) * 100)) : 100;
    return <Link prefetch={false} key={oferta.id} href={`/produto/${oferta.id}`} className="group block rounded-md focus-visible:outline-offset-4">
      <div className="flex items-baseline justify-between gap-2 text-xs"><span className="min-w-0 truncate font-medium text-ink">{oferta.lojaNome}{menor && <span className="ml-1.5 text-[10px] font-normal text-brand">menor preço</span>}</span><span className={`price shrink-0 font-semibold ${menor ? "text-brand" : "text-ink"}`}>{formatBRL(oferta.precoAtual)}</span></div>
      <p className="mb-2 mt-1 line-clamp-1 text-[11px] leading-4 text-muted" title={oferta.titulo}>{oferta.titulo}</p>
      <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-bg-soft"><div className="h-full rounded-full" style={{width: `${width}%`, backgroundColor: corLoja(oferta.lojaSlug ?? oferta.lojaNome)}} /></div>
      {!menor && <p className="mt-1 text-right text-[10px] text-muted">+{formatBRL((oferta.precoAtual as number) - menorPreco)} sobre o menor preço</p>}
    </Link>;
  })}</div>;
}
