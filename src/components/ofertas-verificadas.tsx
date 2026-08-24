"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  Dumbbell,
  Gamepad2,
  Gauge,
  Headphones,
  Home,
  Laptop,
  Package,
  ScanSearch,
  Smartphone,
  SprayCan,
  Store,
  Tablet,
  Trophy,
  Watch,
  Wrench,
} from "lucide-react";
import type { Produto } from "@/core/domain/types";
import { useShuffled } from "@/components/use-shuffled";
import { corLoja, formatBRL, timeAgo } from "@/lib/utils";

const POR_PAGINA = 8;
const MAX_PRODUTOS_NO_CLIENTE = 40;
const INTERVALO_ROTACAO_MS = 7_000;

const ICONES: Record<string, LucideIcon> = {
  notebooks: Laptop,
  monitores: Laptop,
  perifericos: Gamepad2,
  celulares: Smartphone,
  smartwatch: Watch,
  "fones-bluetooth": Headphones,
  "caixa-de-som": Headphones,
  "power-bank": Smartphone,
  "webcam-acao": Smartphone,
  tablets: Tablet,
  "perfumes-importados": SprayCan,
  "perfumes-arabes": SprayCan,
  maquiagem: SprayCan,
  skincare: SprayCan,
  cabelos: SprayCan,
  "whey-protein": Dumbbell,
  creatina: Dumbbell,
  "pre-treino": Dumbbell,
  "fit-outros": Dumbbell,
  geladeiras: Home,
  fogoes: Home,
  "maquinas-lavar": Home,
  tvs: Home,
  "micro-ondas": Home,
  "ar-condicionado": Home,
  furadeiras: Wrench,
  serras: Wrench,
  lixadeiras: Wrench,
  compressores: Wrench,
  "ferramentas-manuais": Wrench,
  "chaves-soquetes": Wrench,
  epi: Wrench,
};

function percentualDesconto(produto: Produto): number | null {
  if (
    produto.precoAtual != null
    && produto.precoOriginal != null
    && produto.precoOriginal > produto.precoAtual
  ) {
    return Math.round((1 - produto.precoAtual / produto.precoOriginal) * 100);
  }

  if (produto.descontoPct != null && produto.descontoPct > 0) {
    return Math.min(99, Math.round(produto.descontoPct));
  }

  return null;
}

function promoScore(produto: Produto): number | null {
  if (produto.promoScore == null || !Number.isFinite(produto.promoScore)) return null;
  return Math.round(Math.max(0, Math.min(100, produto.promoScore)));
}

function estaNoMenorHistorico(produto: Produto): boolean {
  return produto.precoAtual != null
    && produto.precoMinHist != null
    && produto.precoMaxHist != null
    && produto.precoMaxHist > produto.precoMinHist
    && produto.precoAtual <= produto.precoMinHist;
}

function IdentidadeLoja({ produto }: { produto: Produto }) {
  const cor = corLoja(produto.lojaSlug ?? produto.lojaNome);

  return (
    <span
      className="inline-flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-md border bg-bg-soft px-2 text-[10px] font-semibold text-zinc-200 sm:max-w-[132px]"
      style={{ borderColor: `${cor}66` }}
      title={produto.lojaNome}
    >
      <Store className="h-3.5 w-3.5 shrink-0" style={{ color: cor }} />
      <span className="truncate">{produto.lojaNome}</span>
    </span>
  );
}

function ImagemOferta({ produto, Icon }: { produto: Produto; Icon: LucideIcon }) {
  const [erro, setErro] = useState(false);

  if (!produto.imagemUrl || erro) {
    return (
      <div className="mb-3 grid aspect-[4/3] place-items-center rounded-xl border border-line bg-bg-soft/70">
        <Icon className="h-8 w-8 text-brand-2" />
        <span className="sr-only">Imagem indisponível</span>
      </div>
    );
  }

  return (
    <div className="mb-3 aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={produto.imagemUrl}
        alt={produto.titulo}
        loading="lazy"
        decoding="async"
        onError={() => setErro(true)}
        className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.04]"
      />
    </div>
  );
}

export interface OfertasVerificadasProps {
  produtos: Produto[];
}

/**
 * Vitrine de produtos coletados. O Server Component entrega somente um pool
 * curado; este componente apenas limita, embaralha e pagina esse subconjunto.
 */
export function OfertasVerificadas({ produtos }: OfertasVerificadasProps) {
  const elegiveis = useMemo(
    () => produtos.filter((produto) => (
      produto.id
      && produto.emEstoque
      && produto.precoAtual != null
      && produto.precoAtual > 0
    )),
    [produtos],
  );
  const ofertas = useShuffled(
    elegiveis,
    Math.min(MAX_PRODUTOS_NO_CLIENTE, elegiveis.length),
  );
  const [pagina, setPagina] = useState(1);
  const pausado = useRef(false);
  const totalPaginas = Math.ceil(ofertas.length / POR_PAGINA);

  useEffect(() => {
    setPagina((atual) => Math.min(atual, Math.max(1, totalPaginas)));
  }, [totalPaginas]);

  useEffect(() => {
    if (totalPaginas <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      if (!pausado.current) setPagina((atual) => (atual % totalPaginas) + 1);
    }, INTERVALO_ROTACAO_MS);

    return () => window.clearInterval(id);
  }, [totalPaginas]);

  if (!ofertas.length) return null;

  const inicio = (pagina - 1) * POR_PAGINA;
  const visiveis = ofertas.slice(inicio, inicio + POR_PAGINA);

  return (
    <section className="pb-14">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-neon to-emerald-500 text-emerald-950">
          <ScanSearch className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold tracking-tight text-white">Ofertas monitoradas</h2>
          <p className="text-xs text-muted">Produtos coletados dos parceiros, com preço e PromoScore vindos da nossa base.</p>
        </div>
        <span className="hidden shrink-0 text-[11px] text-muted sm:block">{ofertas.length} nesta seleção</span>
      </div>

      <div
        key={pagina}
        onMouseEnter={() => { pausado.current = true; }}
        onMouseLeave={() => { pausado.current = false; }}
        className="grid animate-fade-up grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      >
        {visiveis.map((produto) => {
          const Icon = ICONES[produto.categoriaSlug ?? ""] ?? Package;
          const desconto = percentualDesconto(produto);
          const score = promoScore(produto);
          const menorHistorico = estaNoMenorHistorico(produto);

          return (
            <a
              key={produto.id}
              href={`/r/${encodeURIComponent(produto.id)}?o=ofertas-verificadas`}
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
              className="glass hover-raise group flex flex-col rounded-2xl border border-line p-3 transition-colors hover:border-neon/40"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <IdentidadeLoja produto={produto} />
                <span className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg bg-neon/10 px-2 text-[10px] font-medium text-neon">
                  <Gauge className="h-3.5 w-3.5" />
                  <span className="sm:hidden">{score != null ? `PS ${score}` : "PS --"}</span>
                  <span className="hidden sm:inline">{score != null ? `PromoScore ${score}` : "Score em formação"}</span>
                </span>
              </div>

              <ImagemOferta produto={produto} Icon={Icon} />

              <h3 className="line-clamp-2 min-h-[2.5rem] text-xs font-medium leading-snug text-zinc-100">
                {produto.titulo}
              </h3>

              <div className="mt-2 flex flex-wrap items-baseline gap-2">
                <span className="font-display text-lg font-extrabold tracking-tight text-white">
                  {formatBRL(produto.precoAtual)}
                </span>
                {produto.precoOriginal != null && produto.precoOriginal > (produto.precoAtual ?? 0) ? (
                  <span className="text-[10px] text-muted line-through">{formatBRL(produto.precoOriginal)}</span>
                ) : null}
                {desconto != null ? (
                  <span className="rounded bg-emerald-500/15 px-1 text-[10px] font-bold text-emerald-300">-{desconto}%</span>
                ) : null}
              </div>

              <div className="mt-2 flex min-h-5 items-center justify-between gap-2">
                {menorHistorico ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300">
                    <Trophy className="h-3 w-3" /> Menor histórico
                  </span>
                ) : <span />}
                <span suppressHydrationWarning className="shrink-0 text-[10px] text-muted">
                  {timeAgo(produto.atualizadoEm)}
                </span>
              </div>

              <span className="mt-3 inline-flex items-center justify-center gap-1 rounded-lg border border-brand/30 bg-brand/10 py-1.5 text-xs font-semibold text-brand-2 transition-colors group-hover:bg-brand/20 group-hover:text-white">
                Ver oferta <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </a>
          );
        })}
      </div>

      {totalPaginas > 1 ? (
        <div className="mt-5 flex items-center justify-center gap-2">
          {Array.from({ length: totalPaginas }).map((_, indice) => {
            const numero = indice + 1;
            const ativa = numero === pagina;

            return (
              <button
                key={numero}
                type="button"
                onClick={() => setPagina(numero)}
                aria-label={`Página ${numero}`}
                aria-current={ativa ? "page" : undefined}
                className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors ${ativa ? "bg-brand text-white" : "border border-line text-muted hover:bg-bg-soft hover:text-zinc-200"}`}
              >
                {numero}
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
