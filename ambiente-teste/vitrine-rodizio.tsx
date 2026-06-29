"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowRight, ImageOff, Trophy } from "lucide-react";
import type { ProdutoRodizio } from "@/infrastructure/repositories/produtos.repo";
import { formatBRL, timeAgo } from "@/lib/utils";
import { PriceHistoryChart, buildPriceVariationPoints, type PriceVariationPoint } from "@/components/price-history-chart";

const LANTERN_CLIP = "polygon(50% 0%, 84% 11%, 96% 49%, 79% 84%, 50% 100%, 21% 84%, 4% 49%, 16% 11%)";
const FLAG_CLIP = "polygon(0 0, 100% 0, 88% 100%, 50% 72%, 12% 100%)";
const CARD_POSITIONS = [
  "sm:rotate-[-4deg] sm:translate-y-4",
  "sm:rotate-[2deg] sm:-translate-y-3",
  "sm:rotate-[4deg] sm:translate-y-6",
];
const ACCENTS = ["#22e06b", "#f97316", "#a78bfa", "#facc15", "#38bdf8", "#fb7185", "#2dd4bf"];

function accentForProduct(product: ProdutoRodizio, index: number) {
  const seed = [...product.id].reduce((total, char) => total + char.charCodeAt(0), index);
  return ACCENTS[seed % ACCENTS.length]!;
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

function LanternProductCard({
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
  const accent = accentForProduct(product, index);
  const discount = product.precoOriginal && product.precoAtual && product.precoOriginal > product.precoAtual
    ? Math.round((1 - product.precoAtual / product.precoOriginal) * 100)
    : null;
  const style = {
    "--lantern-accent": accent,
    clipPath: LANTERN_CLIP,
    filter: `drop-shadow(0 26px 30px ${accent}${selected ? "80" : "42"})`,
  } as CSSProperties;

  return (
    <a
      href={`/r/${product.id}?o=vitrine-rodizio`}
      rel="nofollow sponsored"
      style={style}
      onFocus={onSelect}
      onMouseEnter={onSelect}
      className={`group relative mx-auto block aspect-[0.56] w-full max-w-[238px] overflow-visible bg-[color:var(--lantern-accent)] p-[2px] outline-none transition duration-500 motion-safe:animate-lantern-float hover:-translate-y-8 hover:scale-[1.04] focus-visible:ring-2 focus-visible:ring-lime-200 sm:max-w-none sm:motion-safe:animate-none ${CARD_POSITIONS[index] ?? ""} ${index > 0 ? "hidden sm:block" : "block"}`}
    >
      <span className="relative block h-full w-full">
        <span
          aria-hidden="true"
          className="absolute -inset-3 opacity-70 blur-2xl transition duration-500 motion-safe:animate-lantern-aura group-hover:-inset-6 group-hover:opacity-100"
          style={{ background: `radial-gradient(circle at 50% 42%, ${accent}75, transparent 64%)`, clipPath: LANTERN_CLIP }}
        />
        <span aria-hidden="true" className="absolute inset-[2px] bg-[linear-gradient(180deg,rgba(8,22,34,.96),rgba(2,8,18,.94)_52%,rgba(4,20,22,.94))]" style={{ clipPath: LANTERN_CLIP }} />
        <span aria-hidden="true" className="absolute inset-[2px] bg-[radial-gradient(circle_at_50%_5%,rgba(255,255,255,.16),transparent_31%),linear-gradient(90deg,rgba(255,255,255,.13),transparent_22%,transparent_78%,rgba(255,255,255,.1))]" style={{ clipPath: LANTERN_CLIP }} />
        <span aria-hidden="true" className="absolute left-1/2 top-0 z-20 h-12 w-px -translate-x-1/2 -translate-y-10 bg-gradient-to-t from-amber-200/80 to-amber-700/40 shadow-[0_0_14px_rgba(251,191,36,.28)]" />
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-2 z-20 h-9 w-16 -translate-x-1/2 -translate-y-1 rounded-t-sm border border-white/20 shadow-[0_6px_14px_rgba(0,0,0,.25)]"
          style={{
            clipPath: FLAG_CLIP,
            backgroundColor: accent,
            backgroundImage:
              "linear-gradient(45deg, rgba(255,255,255,.24) 25%, transparent 25%, transparent 75%, rgba(255,255,255,.24) 75%), linear-gradient(45deg, rgba(0,0,0,.18) 25%, transparent 25%, transparent 75%, rgba(0,0,0,.18) 75%)",
            backgroundPosition: "0 0, 8px 8px",
            backgroundSize: "16px 16px",
          }}
        />
        <span aria-hidden="true" className="absolute bottom-0 left-1/2 z-20 grid h-14 w-14 -translate-x-1/2 translate-y-8 grid-cols-4 gap-1">
          {Array.from({ length: 8 }).map((_, stripIndex) => (
            <span
              key={stripIndex}
              className="h-full rounded-full bg-[color:var(--lantern-accent)] shadow-[0_8px_14px_rgba(0,0,0,.3)]"
              style={{ transform: `translateY(${stripIndex % 2 ? 8 : 0}px) rotate(${stripIndex % 2 ? 8 : -8}deg)` }}
            />
          ))}
        </span>

        <span className="relative z-10 flex h-full flex-col items-center px-4 pb-8 pt-11 text-center">
          <span className="relative grid h-28 w-28 place-items-center rounded-[1.35rem] border border-white/14 bg-white text-slate-950 shadow-[inset_0_1px_18px_rgba(255,255,255,.08),0_18px_30px_-22px_rgba(0,0,0,.9)] sm:h-24 sm:w-24 lg:h-28 lg:w-28">
            {product.imagemUrl ? (
              <Image src={product.imagemUrl} alt={product.titulo} fill sizes="112px" className="object-contain p-2" />
            ) : (
              <ImageOff className="h-9 w-9 text-slate-400" />
            )}
          </span>
          <strong className="mt-3 line-clamp-2 min-h-[2rem] text-sm font-black leading-tight text-white sm:text-[13px] lg:text-sm">
            {product.titulo}
          </strong>
          <span className="mt-1 line-clamp-1 text-[11px] font-medium leading-snug text-zinc-100/72">
            {product.lojaNome} {product.categoriaNome ? `· ${product.categoriaNome}` : ""}
          </span>
          <span className="mt-2 text-lg font-black text-[#00f06a] drop-shadow-[0_0_16px_rgba(34,224,107,.34)] sm:text-base lg:text-lg">
            {formatBRL(product.precoAtual)}
          </span>
          {discount != null ? (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-400/14 px-2 py-0.5 text-[10px] font-black text-emerald-200">
              <Trophy className="h-3 w-3" /> -{discount}%
            </span>
          ) : (
            <span className="mt-1 text-[10px] text-zinc-300/65">{timeAgo(product.atualizadoEm)}</span>
          )}
          <span className="mt-3 inline-flex items-center gap-1 rounded-full border border-[color:var(--lantern-accent)] bg-black/24 px-3 py-1 text-[10px] font-extrabold text-white transition group-hover:bg-white group-hover:text-slate-950">
            Oferta
            <ArrowRight className="h-3 w-3" />
          </span>
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
  const selectedAccent = accentForProduct(selectedProduct, activeIndex);

  return (
    <>
      <div className="mt-10 max-w-[620px] sm:mt-12 lg:absolute lg:left-[46.5%] lg:top-[48%] lg:mt-0 lg:w-[620px] lg:max-w-[620px] lg:-translate-y-1/2 xl:left-[45%] xl:w-[690px] xl:max-w-[690px]">
        <p className="sr-only" aria-live="polite">
          Vitrine rotativa com produtos afiliados atualizados pelo banco.
        </p>
        <div className="grid min-h-[410px] grid-cols-1 items-center gap-4 px-8 sm:min-h-[360px] sm:grid-cols-3 sm:px-1 lg:min-h-[410px]">
          {visibleProducts.map((product, index) => (
            <LanternProductCard
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
