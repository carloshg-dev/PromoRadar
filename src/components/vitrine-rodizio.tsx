"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowUpRight, BadgePercent, ImageOff } from "lucide-react";
import type { ProdutoRodizio } from "@/infrastructure/repositories/produtos.repo";
import { formatBRL, timeAgo } from "@/lib/utils";
import { PriceHistoryChart, buildPriceVariationPoints, type PriceVariationPoint } from "@/components/price-history-chart";

const CARD_ACCENTS = ["#22e06b", "#facc15", "#38bdf8", "#a78bfa", "#2dd4bf", "#fb7185"];

function accentForProduct(product: ProdutoRodizio) {
  const seed = [...product.id].reduce((total, char) => total + char.charCodeAt(0), 0);
  return CARD_ACCENTS[seed % CARD_ACCENTS.length]!;
}

function pricePointsForProduct(product: ProdutoRodizio): PriceVariationPoint[] {
  if (product.historicoPrecos.length >= 2) {
    return product.historicoPrecos.map((point) => ({
      label: new Date(point.coletado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      value: Number(point.preco),
    }));
  }

  return buildPriceVariationPoints({
    min: product.precoMinHist,
    avg: product.precoAvgHist,
    max: product.precoMaxHist,
  }, product.precoAtual);
}

function ProductShowcaseCard({
  product,
  index,
  selected,
  onSelect,
}: {
  product: ProdutoRodizio;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const accent = accentForProduct(product);
  const discount = product.precoOriginal && product.precoAtual && product.precoOriginal > product.precoAtual
    ? Math.round((1 - product.precoAtual / product.precoOriginal) * 100)
    : null;
  const style = {
    "--product-accent": accent,
    borderColor: selected ? accent : "rgba(255,255,255,.14)",
    boxShadow: selected
      ? `0 0 0 1px ${accent}35, 0 26px 56px -34px ${accent}a6`
      : "0 22px 50px -38px rgba(0,0,0,.95)",
  } as CSSProperties;

  return (
    <a
      href={`/r/${product.id}?o=vitrine-rodizio`}
      rel="nofollow sponsored"
      aria-current={selected ? "true" : undefined}
      aria-label={`Ver oferta: ${product.titulo}, ${formatBRL(product.precoAtual)}`}
      style={style}
      onFocus={onSelect}
      onMouseEnter={onSelect}
      className={`group relative mx-auto aspect-[9/16] w-full max-w-[270px] overflow-hidden rounded border bg-[#071018]/92 outline-none backdrop-blur-md transition-[transform,border-color,box-shadow,opacity] duration-300 motion-safe:animate-fade-up hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-white/80 sm:max-w-none ${index > 0 ? "hidden sm:block" : "block"}`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-[3px] bg-[color:var(--product-accent)] transition-opacity duration-300 ${selected ? "opacity-100" : "opacity-35 group-hover:opacity-80"}`}
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.045),transparent_30%),linear-gradient(135deg,rgba(255,255,255,.025),transparent_58%)]"
      />

      <span className="relative flex h-full flex-col p-2.5">
        <span className="flex h-4 items-center justify-between gap-2 text-[10px] font-bold uppercase text-zinc-300/75">
          <span>Seleção {String(index + 1).padStart(2, "0")}</span>
          <span className="inline-flex items-center gap-1.5 text-zinc-100/80">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-[color:var(--product-accent)] shadow-[0_0_10px_var(--product-accent)]"
            />
            {selected ? "Em foco" : "Oferta"}
          </span>
        </span>

        <span className="relative mt-1.5 block aspect-[4/3] w-full overflow-hidden rounded-[6px] border border-white/10 bg-[#f5f5f3]">
          {product.imagemUrl && !imageFailed ? (
            <Image
              src={product.imagemUrl}
              alt={product.titulo}
              fill
              sizes="(max-width: 639px) 246px, (max-width: 1279px) 180px, 206px"
              onError={() => setImageFailed(true)}
              className="object-contain p-2.5 transition-transform duration-500 group-hover:scale-[1.035]"
            />
          ) : (
            <span className="grid h-full place-items-center">
              <ImageOff className="h-9 w-9 text-slate-400" aria-hidden="true" />
            </span>
          )}
        </span>

        <span className="mt-2 line-clamp-1 text-[10px] font-semibold uppercase text-zinc-300/70">
          {product.lojaNome}{product.categoriaNome ? ` · ${product.categoriaNome}` : ""}
        </span>
        <strong className="mt-1 line-clamp-2 min-h-[2rem] text-[13px] font-extrabold leading-[1.15] text-white lg:text-sm">
          {product.titulo}
        </strong>

        <span className="mt-auto flex items-end justify-between gap-2 border-t border-white/10 pt-2">
          <span className="min-w-0">
            <span className="block text-[10px] font-medium text-zinc-300/65">Preço atual</span>
            <span className="block truncate text-lg font-black text-white lg:text-xl">
              {formatBRL(product.precoAtual)}
            </span>
          </span>
          {discount != null ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-[5px] border border-[color:var(--product-accent)] bg-black/30 px-2 py-1 text-[10px] font-black text-white">
              <BadgePercent className="h-3 w-3 text-[color:var(--product-accent)]" aria-hidden="true" />
              -{discount}%
            </span>
          ) : null}
        </span>

        <span className="mt-0.5 h-3.5 text-[10px] text-zinc-300/60">
          {discount != null && product.precoOriginal ? (
            <>Antes <span className="line-through">{formatBRL(product.precoOriginal)}</span></>
          ) : (
            <span suppressHydrationWarning>Atualizado {timeAgo(product.atualizadoEm)}</span>
          )}
        </span>

        <span className="mt-1.5 flex h-7 items-center justify-between rounded-[6px] border border-white/12 bg-white/[.045] px-3 text-[11px] font-bold text-white transition-colors group-hover:border-[color:var(--product-accent)] group-hover:bg-white/[.08]">
          Ver oferta
          <ArrowUpRight className="h-3.5 w-3.5 text-[color:var(--product-accent)]" aria-hidden="true" />
        </span>
      </span>
    </a>
  );
}

export function VitrineRodizio({
  produtos,
  visibleCount = 3,
  intervalMs = 5200,
}: {
  produtos: ProdutoRodizio[];
  visibleCount?: 1 | 2 | 3;
  intervalMs?: number;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(produtos[0]?.id ?? null);

  useEffect(() => {
    setActiveIndex(0);
    setSelectedId(produtos[0]?.id ?? null);
  }, [produtos]);

  useEffect(() => {
    if (produtos.length <= visibleCount) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => {
        const next = (current + visibleCount) % produtos.length;
        setSelectedId(produtos[next]?.id ?? null);
        return next;
      });
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [intervalMs, produtos, visibleCount]);

  const visibleProducts = useMemo(() => {
    return Array.from({ length: Math.min(visibleCount, produtos.length) }, (_, offset) => {
      const index = (activeIndex + offset) % produtos.length;
      return produtos[index]!;
    });
  }, [activeIndex, produtos, visibleCount]);

  if (!produtos.length) return null;

  const selectedProduct = produtos.find((product) => product.id === selectedId) ?? visibleProducts[0]!;
  const selectedAccent = accentForProduct(selectedProduct);

  return (
    <>
      <div className="mt-10 max-w-[620px] sm:mt-12 lg:absolute lg:left-[46.5%] lg:top-[46%] lg:mt-0 lg:w-[620px] lg:max-w-[620px] lg:-translate-y-1/2 xl:left-[45%] xl:w-[690px] xl:max-w-[690px]">
        <p className="sr-only" aria-live="polite">
          Oferta selecionada: {selectedProduct.titulo}, {formatBRL(selectedProduct.precoAtual)}.
        </p>
        <div className="grid min-h-[500px] grid-cols-1 items-center gap-3 px-5 sm:min-h-[370px] sm:grid-cols-3 sm:px-1 lg:min-h-[410px]">
          {visibleProducts.map((product, index) => (
            <ProductShowcaseCard
              key={product.id}
              product={product}
              index={index}
              selected={selectedProduct.id === product.id}
              onSelect={() => setSelectedId(product.id)}
            />
          ))}
        </div>
      </div>

      <PriceHistoryChart
        title={`Histórico de preços · ${selectedProduct.lojaNome}`}
        points={pricePointsForProduct(selectedProduct)}
        summary={{
          min: selectedProduct.precoMinHist,
          avg: selectedProduct.precoAvgHist,
          max: selectedProduct.precoMaxHist,
        }}
        accent={selectedAccent}
      />
    </>
  );
}
