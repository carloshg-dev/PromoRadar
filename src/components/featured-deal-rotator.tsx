"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { DestaqueItem } from "@/infrastructure/repositories/produtos.repo";
import { PriceChart } from "@/components/price-chart";
import { StorePriceBars } from "@/components/store-price-bars";
import { formatBRL, corLoja } from "@/lib/utils";
import { temaSazonal } from "@/lib/seasonal";
import { Sparkles, ImageOff, TrendingDown, ArrowUpRight, LineChart as LineChartIcon } from "lucide-react";

const INTERVAL_MS = 6500;

/**
 * "Oferta em destaque" da home — gira em LOOP entre produtos de várias marcas
 * monetizadas (regra do dono 02/07: nada de card estático, nada de parede de
 * uma marca só). Cada item já chega do servidor com — ou sem — uma comparação
 * REAL resolvida (ofertasEmDestaque); o comparador (barras por loja) só ativa
 * quando o item sorteado tem 2+ lojas vendendo a mesma classe de modelo.
 */
export function FeaturedDealRotator({ itens }: { itens: DestaqueItem[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => setIndex(0), [itens]);

  useEffect(() => {
    if (itens.length <= 1) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % itens.length), INTERVAL_MS);
    return () => window.clearInterval(t);
  }, [itens]);

  if (!itens.length) return null;
  const d = itens[index % itens.length]!;
  const tema = temaSazonal();
  const c = d.comparacao;
  // Normaliza os 2 casos (com/sem comparação real) pros mesmos campos de exibição.
  const ref = c ? c.ofertas[0]! : d.produto;
  const rotulo = c ? c.rotulo : d.produto.titulo;
  const cor = corLoja(ref.lojaSlug ?? ref.lojaNome);
  const preco = c ? c.menorPreco : (d.produto.precoAtual as number);

  return (
    <div key={d.produto.id} className="glow-green card-grad animate-fade-up rounded-3xl border border-neon/20 p-5"
      style={tema ? { boxShadow: `0 0 0 1.5px ${tema.corHex}77, 0 10px 44px -14px ${tema.corHex}88` } : undefined}>
      <div className="mb-4 flex items-center justify-between">
        <span className="label-mono inline-flex items-center gap-1.5 text-[11px] text-neon">
          <Sparkles className="h-3.5 w-3.5" /> Oferta em destaque {tema && <span aria-hidden title={tema.frase}>{tema.emoji}</span>}
        </span>
        <Link href={c ? "/comparar" : "/ofertas"} className="text-xs text-brand-2 hover:underline">ver todas →</Link>
      </div>

      <div className="flex items-center gap-4">
        <Link href={`/produto/${ref.id}`} className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white">
          {ref.imagemUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ref.imagemUrl} alt={rotulo} className="h-full w-full object-contain p-1.5" />
          ) : <ImageOff className="h-7 w-7 text-muted/40" />}
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/produto/${ref.id}`} className="line-clamp-1 font-display text-lg font-bold tracking-tightest text-white hover:text-neon">
            {rotulo}
          </Link>
          <div className="label-mono mt-0.5 text-[10px] text-neon">Melhor preço</div>
          <div className="font-display text-2xl font-extrabold text-neon text-neon-glow">{formatBRL(preco)}</div>
          <div className="mt-0.5 inline-flex items-center gap-1.5 label-mono text-[10px]" style={{ color: cor }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: cor }} />{ref.lojaNome}
          </div>
        </div>
      </div>

      {/* comparador ATIVO só quando existe comparação real (2+ lojas na mesma classe) */}
      {c && (
        <div className="mt-4 rounded-2xl border border-line bg-bg-soft/40 p-3">
          <div className="mb-2 label-mono text-[10px] text-muted">Preço por loja (R$) · {c.lojas} lojas</div>
          <StorePriceBars ofertas={c.ofertas} menorPreco={c.menorPreco} maiorPreco={c.maiorPreco} />
        </div>
      )}

      {d.historico.length >= 2 ? (
        <div className="mt-3 rounded-2xl border border-line bg-bg-soft/40 p-3">
          <div className="mb-1 label-mono text-[10px] text-muted">Histórico de preços (R$)</div>
          <PriceChart points={d.historico} height={140} />
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-bg-soft/40 px-3 py-2 text-[11px] text-muted">
          <LineChartIcon className="h-3.5 w-3.5 text-neon" /> Gráfico de histórico em construção — enche a cada coleta diária.
        </div>
      )}

      {c && c.economia > 0 ? (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-neon/10 px-3 py-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-neon">
            <TrendingDown className="h-3.5 w-3.5" /> economize até {formatBRL(c.economia)}
          </span>
          <Link href="/comparar" className="inline-flex items-center gap-1 text-xs font-semibold text-neon hover:underline">
            comparar <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      ) : !c && d.produto.descontoPct != null && d.produto.descontoPct > 0 ? (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-neon/10 px-3 py-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-neon">
            <TrendingDown className="h-3.5 w-3.5" /> {d.produto.descontoPct}% de desconto
          </span>
          <Link href={`/produto/${d.produto.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-neon hover:underline">
            ver oferta <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
