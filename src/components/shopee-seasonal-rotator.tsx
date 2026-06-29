"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { ExternalLink, ShoppingBag, Sparkles } from "lucide-react";
import { SHOPEE_SEASONAL_PRODUCTS, type ShopeeSeasonalProduct } from "@/lib/shopee-seasonal-products";

const BALLOON_POSITIONS = [
  "sm:rotate-[-7deg] sm:translate-y-4",
  "sm:rotate-[3deg] sm:-translate-y-2",
  "sm:rotate-[7deg] sm:translate-y-5",
];

const BALLOON_CLIP = "polygon(50% 0%, 86% 13%, 96% 50%, 78% 82%, 50% 100%, 22% 82%, 4% 50%, 14% 13%)";

function getVisibleProducts(start: number) {
  return BALLOON_POSITIONS.map((_, offset) => {
    const index = (start + offset) % SHOPEE_SEASONAL_PRODUCTS.length;
    return SHOPEE_SEASONAL_PRODUCTS[index]!;
  });
}

function ShopeeBalloonCard({ product, offset }: { product: ShopeeSeasonalProduct; offset: number }) {
  const style = {
    "--shopee-accent": product.accent,
    "--shopee-accent-soft": `${product.accent}4d`,
    "--shopee-accent-strong": `${product.accent}d9`,
    clipPath: BALLOON_CLIP,
    filter: `drop-shadow(0 16px 20px ${product.accent}33)`,
  } as CSSProperties;

  return (
    <a
      href={product.href}
      target="_blank"
      rel="sponsored noopener noreferrer"
      style={style}
      className={`group relative mx-auto block aspect-[0.72] w-full max-w-[245px] overflow-hidden bg-[color:var(--shopee-accent)] p-[2px] outline-none transition duration-300 hover:-translate-y-2 hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-lime-200 sm:max-w-none ${BALLOON_POSITIONS[offset]} ${offset > 0 ? "hidden sm:block" : "block"}`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-[2px] bg-[#062032]/92"
        style={{ clipPath: BALLOON_CLIP }}
      />
      <span aria-hidden="true" className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-white/18" />
      <span aria-hidden="true" className="absolute left-[18%] top-[9%] h-[86%] w-[23%] -skew-x-[9deg] rounded-full bg-white/9" />
      <span aria-hidden="true" className="absolute right-[16%] top-[9%] h-[86%] w-[24%] skew-x-[9deg] rounded-full bg-[color:var(--shopee-accent-soft)]" />
      <span aria-hidden="true" className="absolute inset-x-8 top-8 h-px bg-white/18" />
      <span aria-hidden="true" className="absolute inset-x-8 bottom-8 h-px bg-white/14" />
      <span aria-hidden="true" className="absolute left-1/2 top-0 h-6 w-px -translate-x-1/2 -translate-y-5 bg-lime-200/60" />
      <span aria-hidden="true" className="absolute bottom-0 left-1/2 h-8 w-8 -translate-x-1/2 translate-y-4 rotate-45 rounded-[8px] border border-white/18 bg-[color:var(--shopee-accent-strong)]" />

      <span className="relative z-10 flex h-full flex-col items-center justify-center px-4 py-7 text-center">
        <span className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/18 text-2xl shadow-inner sm:h-12 sm:w-12">
          {product.emoji}
        </span>
        <span className="label-mono mt-3 inline-flex items-center gap-1 rounded-full border border-white/16 bg-black/25 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-lime-100">
          <ShoppingBag className="h-3 w-3" />
          Shopee
        </span>
        <strong className="mt-2 line-clamp-2 text-[13px] font-black leading-tight text-white sm:text-sm">
          {product.title}
        </strong>
        <span className="mt-2 line-clamp-2 text-[10px] leading-snug text-zinc-100/78">
          {product.note}
        </span>
        <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-lime-300 px-3 py-1 text-[10px] font-extrabold text-slate-950 transition group-hover:bg-white">
          Abrir
          <ExternalLink className="h-3 w-3" />
        </span>
      </span>
    </a>
  );
}

export function ShopeeSeasonalRotator() {
  const [activeIndex, setActiveIndex] = useState(0);
  const visibleProducts = getVisibleProducts(activeIndex);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return undefined;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 3) % SHOPEE_SEASONAL_PRODUCTS.length);
    }, 5200);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="mt-8 max-w-[430px] lg:absolute lg:left-[52%] lg:top-[48%] lg:mt-0 lg:w-[420px] lg:max-w-[420px] lg:-translate-y-1/2 xl:left-[53%]">
      <div className="rounded-[2rem] border border-lime-300/35 bg-slate-950/14 p-3 shadow-[0_0_55px_-30px_rgba(132,204,22,.85)] backdrop-blur-[2px]">
        <div className="mb-2 flex items-center justify-between gap-3 px-1">
          <span className="inline-flex items-center gap-2 rounded-full border border-lime-300/40 bg-lime-300/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-lime-100">
            <Sparkles className="h-3.5 w-3.5" />
            Baloes Shopee
          </span>
          <span className="label-mono text-[10px] text-lime-100/72">9 links</span>
        </div>

        <div className="grid min-h-[250px] grid-cols-1 items-center gap-3 px-2 sm:min-h-[224px] sm:grid-cols-3 sm:px-1" aria-live="polite">
          {visibleProducts.map((product, offset) => (
            <ShopeeBalloonCard key={product.id} product={product} offset={offset} />
          ))}
        </div>

        <div className="mt-2 flex justify-center gap-1.5" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all ${index === Math.floor(activeIndex / 3) ? "w-6 bg-lime-300" : "w-1.5 bg-white/35"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
