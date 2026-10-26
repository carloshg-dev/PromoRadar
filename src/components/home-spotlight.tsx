import Link from "next/link";
import { ArrowUpRight, Clock3, Scale, ImageOff } from "lucide-react";
import type { Produto } from "@/core/domain/types";
import type { Comparacao } from "@/core/matching/comparison";
import { formatBRL, timeAgo } from "@/lib/utils";

export function HomeSpotlight({ produto, comparacao }: { produto?: Produto; comparacao?: Comparacao | null }) {
  if (!produto) return <div className="rounded-2xl bg-lime p-8 sm:p-10"><Scale className="h-9 w-9 text-brand" /><h2 className="mt-7 text-3xl font-semibold tracking-tight">O preço muda.<br />Compare antes de escolher.</h2><p className="mt-4 text-sm leading-6 text-brand">Explore as ofertas disponíveis e consulte a data de cada coleta.</p><Link prefetch={false} href="/comparar" className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-brand">Abrir comparador <ArrowUpRight className="h-4 w-4" /></Link></div>;
  return <article className="overflow-hidden rounded-2xl bg-[#e7eee0]">
    <div className="flex items-center justify-between gap-4 px-6 pt-5 text-sm text-brand sm:px-7"><span className="font-medium">{produto.lojaNome}</span><Link prefetch={false} href={`/produto/${produto.id}`} aria-label={`Ver ${produto.titulo}`} className="grid h-11 w-11 place-items-center rounded-full border border-brand/25 transition-colors hover:bg-white"><ArrowUpRight className="h-5 w-5" /></Link></div>
    <Link prefetch={false} href={`/produto/${produto.id}`} className="mx-6 mt-2 flex h-[190px] items-center justify-center overflow-hidden rounded-xl bg-white sm:mx-7 sm:h-[220px]" aria-label={produto.titulo}>{produto.imagemUrl ? <img src={produto.imagemUrl} alt={produto.titulo} width={400} height={240} fetchPriority="high" decoding="async" className="h-full w-full object-contain p-6" /> : <ImageOff className="h-12 w-12 text-muted" />}</Link>
    <div className="px-6 pb-6 pt-5 sm:px-7 sm:pb-7">
      <h2 className="line-clamp-2 max-w-[42ch] text-base font-semibold leading-6">{produto.titulo}</h2>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs text-muted">Preço coletado</p><p className="price mt-1 text-3xl font-semibold sm:text-4xl">{formatBRL(produto.precoAtual)}</p></div><Link prefetch={false} href={`/produto/${produto.id}`} className="inline-flex min-h-11 items-center gap-2 border-b border-brand text-sm font-semibold text-brand">Ver produto e histórico<ArrowUpRight className="h-4 w-4" /></Link></div>
      {comparacao && comparacao.lojas > 1 && <p className="mt-4 border-t border-brand/15 pt-4 text-sm text-brand">{comparacao.lojas} lojas nesta comparação · diferença de {formatBRL(comparacao.economia)} entre os preços coletados.</p>}
      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted"><Clock3 className="h-3.5 w-3.5" /><time dateTime={produto.atualizadoEm} suppressHydrationWarning>{timeAgo(produto.atualizadoEm)}</time><span>· confira o preço final na loja</span></p>
    </div>
  </article>;
}
