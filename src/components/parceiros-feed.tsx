"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import type { Produto } from "@/core/domain/types";
import { ProdutoCard } from "@/components/produto-card";
import { Sparkles, ArrowRight } from "lucide-react";

/**
 * Feed "Achados dos parceiros" — topo da home. Só produtos de afiliado (Amazon +
 * Lomadee). É um carrossel que ROLA SOZINHO (rAF mexendo no scrollLeft) MAS é um
 * container de scroll de verdade → o usuário pode ARRASTAR com o dedo/mouse. O
 * auto-scroll pausa ao tocar/passar o mouse e volta ao soltar. Lista duplicada
 * p/ loop sem emenda. Respeita "prefers-reduced-motion".
 */
export function ParceirosFeed({ produtos }: { produtos: Produto[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const pausado = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const passo = () => {
      if (!pausado.current) {
        el.scrollLeft += 0.5; // velocidade calma (~30px/s)
        const meta = el.scrollWidth / 2; // metade = 1 cópia → loop sem emenda
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

  if (!produtos.length) return null;
  const trilho = [...produtos, ...produtos]; // duplica p/ o loop contínuo

  return (
    <section className="pt-5">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand to-cyan text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            Achados dos parceiros
          </h2>
          <p className="mt-0.5 text-xs text-muted">Ofertas com link direto à loja — arraste pra ver mais. Atualiza a cada coleta.</p>
        </div>
        <Link href="/ofertas" className="hidden shrink-0 items-center gap-1 text-xs text-brand-2 hover:underline sm:flex">
          ver tudo <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div ref={ref}
        className="flex gap-4 overflow-x-auto overscroll-x-contain pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {trilho.map((p, i) => (
          <div key={`${p.id}-${i}`} className="w-[230px] shrink-0 sm:w-[260px]">
            <ProdutoCard p={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
