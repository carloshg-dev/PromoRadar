import Link from "next/link";
import type { Produto } from "@/core/domain/types";
import { formatBRL, timeAgo, corLoja } from "@/lib/utils";
import { temaSazonal } from "@/lib/seasonal";
import { ehLinkMonetizado } from "@/lib/afiliados";
import { Trophy, ImageOff, ArrowUpRight, Scale } from "lucide-react";

export function ProdutoCard({ p, rank }: { p: Produto; rank?: number }) {
  const cor = corLoja(p.lojaSlug ?? p.lojaNome);
  const tema = temaSazonal(); // micro-badge sazonal (Copa/Arraiá/etc.)
  // Modelo "Dois Níveis": só a loja monetizada ganha CTA de saída (não damos clique de graça).
  const monetizado = ehLinkMonetizado(p.url);

  // Só é "menor histórico" se já houver variação real de preço (min < max).
  const temHistorico = p.precoMinHist != null && p.precoMaxHist != null && p.precoMaxHist > p.precoMinHist;
  const menorHist = temHistorico && p.precoAtual != null && p.precoAtual <= (p.precoMinHist as number);
  const desconto = p.precoOriginal && p.precoAtual && p.precoOriginal > p.precoAtual
    ? Math.round((1 - p.precoAtual / p.precoOriginal) * 100) : null;

  // Posição do preço atual entre mín e máx históricos (0 = mínimo, 1 = máximo). Dado real.
  const pos = temHistorico && p.precoAtual != null
    ? Math.max(0, Math.min(1, (p.precoAtual - (p.precoMinHist as number)) / ((p.precoMaxHist as number) - (p.precoMinHist as number))))
    : null;

  return (
    <div className="group glass hover-raise relative isolate flex flex-col overflow-hidden rounded-2xl border border-line transition-colors hover:border-brand/50 animate-fade-up">
      {/* link que cobre o card → página do produto (histórico + comparação) */}
      <Link href={`/produto/${p.id}`} aria-label={p.titulo} className="absolute inset-0 z-10" />
      {/* FOTO DO PRODUTO (servida pelo CDN da loja; guardamos só a URL) */}
      <div className="relative aspect-[4/3] overflow-hidden bg-white">
        <span className="absolute inset-x-0 top-0 z-10 h-[3px]" style={{ background: cor, boxShadow: `0 0 14px ${cor}66` }} />
        {p.imagemUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.imagemUrl} alt={p.titulo} loading="lazy"
            className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center bg-bg-card"><ImageOff className="h-8 w-8 text-muted/40" /></div>
        )}
        {/* loja (signal color) — pílula CHAPADA (fundo quase sólido) p/ o texto da
            loja ler bem sobre qualquer foto; contorno na cor da loja dá identidade. */}
        <span className="absolute left-2 top-2.5 z-10 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 label-mono text-[10px] font-semibold shadow-sm"
          style={{ color: cor, backgroundColor: "rgba(12,12,15,0.92)", border: `1px solid ${cor}55` }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: cor }} />{p.lojaNome}
        </span>
        {/* desconto */}
        {desconto != null && (
          <span className="absolute bottom-2 left-2 z-10 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[11px] font-bold text-emerald-950 shadow">−{desconto}%</span>
        )}
        {rank != null && rank <= 3 && (
          <span className="absolute bottom-2 right-2 z-10 grid h-5 w-5 place-items-center rounded-md bg-bg/80 label-mono text-[10px] text-amber-300 backdrop-blur">#{rank}</span>
        )}
        {/* micro-badge sazonal (só quando não há rank, p/ não poluir) */}
        {tema && !(rank != null && rank <= 3) && (
          <span aria-hidden title={tema.frase}
            className="absolute bottom-2 right-2 z-10 grid h-5 w-5 place-items-center rounded-md bg-bg/80 text-[11px] backdrop-blur"
            style={{ border: `1px solid ${tema.corHex}66` }}>{tema.emoji}</span>
        )}
      </div>

      {/* CONTEÚDO */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-3 line-clamp-2 min-h-[2.6rem] text-sm font-medium leading-snug text-zinc-100 transition-colors group-hover:text-white">
          {p.titulo}
        </h3>

        <div className="mt-auto">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-extrabold tracking-tightest text-white">{formatBRL(p.precoAtual)}</span>
            {p.precoOriginal && desconto != null && (
              <span className="text-[11px] text-muted line-through">{formatBRL(p.precoOriginal)}</span>
            )}
          </div>

          {/* indicador real de posição do preço (mín → máx histórico) */}
          {pos != null ? (
            <div className="mt-3">
              <div className="relative h-1.5 rounded-full bg-gradient-to-r from-emerald-500/40 via-amber-500/30 to-rose-500/40">
                <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg-card bg-white shadow"
                  style={{ left: `${pos * 100}%` }} />
              </div>
              <div className="mt-1 flex justify-between label-mono text-[9px] text-muted">
                <span>mín {formatBRL(p.precoMinHist)}</span>
                <span>máx {formatBRL(p.precoMaxHist)}</span>
              </div>
            </div>
          ) : (
            <div className="mt-3 h-1.5 rounded-full bg-bg-soft/60" />
          )}

          <div className="mt-2 flex items-center justify-between">
            {menorHist ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                <Trophy className="h-3 w-3" /> Menor preço histórico
              </span>
            ) : <span />}
            <span className="label-mono text-[10px] text-muted">{timeAgo(p.atualizadoEm)}</span>
          </div>

          {/* CTA — modelo "Dois Níveis":
              • monetizado → "Ver oferta" leva à loja via /r/ (redirect 302 server-side, registra clique).
                <a> puro (NÃO <Link>): com <Link> o Next faz prefetch/RSC que segue o 302 e toma CORS.
                rel sponsored = boa prática de afiliado p/ o Google.
              • não monetizado → CTA CAPADO "Comparar preço": SEM redirect externo (não damos tráfego
                de graça), só leva à página interna do produto (comparação entre lojas + histórico).
              z-20 fica ACIMA do link que cobre o card. */}
          {monetizado ? (
            <a href={`/r/${p.id}?o=card`} rel="nofollow sponsored"
              className="relative z-20 mt-3 flex items-center justify-center gap-1 rounded-lg border border-brand/30 bg-brand/10 py-2 text-xs font-semibold text-brand-2 transition-colors hover:bg-brand/20 hover:text-white">
              Ver oferta <span className="max-w-[7rem] truncate font-normal opacity-75">· {p.lojaNome}</span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
            </a>
          ) : (
            <Link href={`/produto/${p.id}`}
              className="relative z-20 mt-3 flex items-center justify-center gap-1 rounded-lg border border-line bg-bg-soft/60 py-2 text-xs font-semibold text-muted transition-colors hover:bg-bg-soft hover:text-zinc-200">
              Comparar preço <span className="max-w-[7rem] truncate font-normal opacity-75">· {p.lojaNome}</span>
              <Scale className="h-3.5 w-3.5 shrink-0" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
