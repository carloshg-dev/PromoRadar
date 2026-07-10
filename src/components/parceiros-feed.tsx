"use client";
import Link from "next/link";
import type { Produto } from "@/core/domain/types";
import { ProdutoCard } from "@/components/produto-card";
import { useCarrossel } from "@/components/use-carrossel";
import { useShuffled } from "@/components/use-shuffled";
import { Sparkles, SprayCan, ArrowRight } from "lucide-react";

const ICONES = { parceiros: Sparkles, beleza: SprayCan } as const;

/**
 * Esteira de produtos de afiliado — rola SOZINHA mas é ARRASTÁVEL (mouse + touch,
 * ver useCarrossel). Pausa no hover/arrasto. Trilha duplicada → loop sem emenda.
 * `direcao="reverso"` rola no sentido oposto (2º carrossel de Beleza).
 *
 * O servidor manda um POOL maior (ex: 60), e o componente embaralha NO CLIENTE
 * a cada montagem — assim cada F5 mostra produtos diferentes mesmo com ISR cacheado.
 */
export function ParceirosFeed({
  produtos,
  exibir = 20,
  titulo = "Achados dos parceiros",
  subtitulo = "Ofertas com link direto à loja — arraste pra ver mais. Atualiza a cada coleta.",
  verTudoHref = "/ofertas",
  verTudoLabel = "Ver todas as ofertas",
  direcao = "normal",
  variante = "parceiros",
}: {
  produtos: Produto[];
  /** Quantos produtos exibir do pool (o resto é descartado após o shuffle). */
  exibir?: number;
  titulo?: string;
  subtitulo?: string;
  verTudoHref?: string;
  verTudoLabel?: string;
  direcao?: "normal" | "reverso";
  variante?: "parceiros" | "beleza";
}) {
  const ref = useCarrossel(direcao);
  const Icon = ICONES[variante];
  const shuffled = useShuffled(produtos, exibir);

  if (!shuffled.length) return null;
  const trilho = [...shuffled, ...shuffled]; // duplica p/ o loop contínuo

  return (
    <section className="pt-5">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand to-cyan text-white">
              <Icon className="h-4 w-4" />
            </span>
            {titulo}
          </h2>
          <p className="mt-0.5 text-xs text-muted">{subtitulo}</p>
        </div>
        <Link href={verTudoHref} className="hidden shrink-0 items-center gap-1 text-xs text-brand-2 hover:underline sm:flex">
          ver tudo <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div ref={ref}
        className="flex select-none gap-4 overflow-x-auto overscroll-x-contain pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {trilho.map((p, i) => (
          <div key={`${p.id}-${i}`} className="w-[230px] shrink-0 sm:w-[260px]">
            <ProdutoCard p={p} />
          </div>
        ))}
      </div>

      {/* ROTA DE FUGA — botão "Ver Tudo" visível em TODAS as telas (o do topo some no mobile) */}
      <div className="mt-3 flex justify-center">
        <Link href={verTudoHref}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg-soft/60 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:border-brand hover:bg-brand/10 hover:text-white">
          {verTudoLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
