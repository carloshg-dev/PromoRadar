"use client";
import Link from "next/link";
import { Ticket, ArrowRight } from "lucide-react";
import { corLoja } from "@/lib/utils";
import { useCarrossel } from "@/components/use-carrossel";
import type { CupomLomadee } from "@/lib/lomadee-cupons";

/**
 * Carrossel HORIZONTAL de cupons em destaque — topo da home, logo abaixo do
 * carrossel de produtos. Enxuto: tickets compactos (logo + marca + código +
 * "Usar"). Auto-rola E é ARRASTÁVEL (mouse + touch, ver useCarrossel), pausa no
 * hover/arrasto, loop sem emenda (lista duplicada). Respeita reduced-motion.
 */
export function CuponsCarrossel({ cupons }: { cupons: CupomLomadee[] }) {
  const ref = useCarrossel("normal", 0.4);

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
        className="flex select-none gap-2.5 overflow-x-auto overscroll-x-contain pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
