"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { Ticket, ArrowRight } from "lucide-react";
import { corLoja } from "@/lib/utils";
import type { CupomLomadee } from "@/lib/lomadee-cupons";

/**
 * Carrossel HORIZONTAL de cupons em destaque — topo da home, logo abaixo do
 * carrossel de produtos. Enxuto: tickets compactos (logo + marca + código +
 * "Usar"). Rola sozinho (rAF no scrollLeft), pausa no toque/hover, arrastável,
 * loop sem emenda (lista duplicada). Respeita prefers-reduced-motion.
 */
export function CuponsCarrossel({ cupons }: { cupons: CupomLomadee[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const pausado = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const passo = () => {
      if (!pausado.current) {
        el.scrollLeft += 0.4;
        const meta = el.scrollWidth / 2;
        if (meta > 0 && el.scrollLeft >= meta) el.scrollLeft -= meta;
      }
      raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    const pause = () => { pausado.current = true; };
    const resume = () => { pausado.current = false; };
    el.addEventListener("pointerenter", pause);
    el.addEventListener("pointerdown", pause);
    el.addEventListener("pointerup", resume);
    el.addEventListener("pointerleave", resume);
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("touchend", resume, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerenter", pause);
      el.removeEventListener("pointerdown", pause);
      el.removeEventListener("pointerup", resume);
      el.removeEventListener("pointerleave", resume);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", resume);
    };
  }, []);

  if (cupons.length < 2) return null;
  const trilho = [...cupons, ...cupons];

  return (
    <section className="pt-4">
      <div className="mb-2 flex items-end justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
          <Ticket className="h-4 w-4 text-brand-2" /> Cupons em destaque
        </h2>
        <Link href="/cupons" className="flex shrink-0 items-center gap-1 text-xs text-brand-2 hover:underline">
          ver todos <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div ref={ref}
        className="flex gap-2.5 overflow-x-auto overscroll-x-contain pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {trilho.map((c, i) => {
          const cor = corLoja(c.marca);
          return (
            <a key={`${c.id}-${i}`} href={c.link} target="_blank" rel="nofollow sponsored noopener"
              title={c.titulo}
              className="group flex w-[230px] shrink-0 items-center gap-2.5 rounded-xl border border-line bg-bg-card/70 p-2.5 transition hover:border-zinc-600"
              style={{ boxShadow: `inset 3px 0 0 ${cor}` }}>
              {c.marcaLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.marcaLogo} alt="" loading="lazy" className="h-8 w-8 shrink-0 rounded-full bg-white/95 object-contain p-0.5" />
              ) : (
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: cor }}>
                  {c.marca.charAt(0)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-zinc-100">{c.marca}</div>
                <div className="truncate text-[11px] text-muted">{c.titulo}</div>
              </div>
              {c.codigo ? (
                <span className="shrink-0 rounded-md border border-dashed px-1.5 py-1 label-mono text-[10px] font-bold tracking-wider"
                  style={{ borderColor: `${cor}88`, color: cor }}>
                  {c.codigo}
                </span>
              ) : (
                <span className="shrink-0 rounded-md bg-neon/10 px-1.5 py-1 text-[9px] font-bold text-neon">OFERTA</span>
              )}
            </a>
          );
        })}
      </div>
    </section>
  );
}
