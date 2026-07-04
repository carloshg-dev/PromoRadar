"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import type { Produto } from "@/core/domain/types";
import { ProdutoCard } from "@/components/produto-card";
import { Sparkles, SprayCan, ArrowRight } from "lucide-react";

const ICONES = { parceiros: Sparkles, beleza: SprayCan } as const;

/**
 * Esteira de produtos de afiliado — rola SOZINHA (rAF no scrollLeft) mas é um
 * container de scroll de verdade (o usuário arrasta). Pausa no toque/hover.
 * Lista duplicada → loop sem emenda. Respeita prefers-reduced-motion.
 *
 * Reutilizável: `direcao="reverso"` rola no sentido OPOSTO (usado no 2º carrossel
 * de Beleza/Perfumes, logo abaixo do principal, pra dar movimento cruzado).
 */
export function ParceirosFeed({
  produtos,
  titulo = "Achados dos parceiros",
  subtitulo = "Ofertas com link direto à loja — arraste pra ver mais. Atualiza a cada coleta.",
  verTudoHref = "/ofertas",
  direcao = "normal",
  variante = "parceiros",
}: {
  produtos: Produto[];
  titulo?: string;
  subtitulo?: string;
  verTudoHref?: string;
  direcao?: "normal" | "reverso";
  /** string (não a função do ícone): componente-função não cruza a fronteira server→client */
  variante?: "parceiros" | "beleza";
}) {
  const Icon = ICONES[variante];
  const ref = useRef<HTMLDivElement>(null);
  const pausado = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const reverso = direcao === "reverso";

    // Acumulador FLOAT próprio (não lê scrollLeft de volta, que arredonda e trava
    // o passo de 0.5px). Reverso começa no MEIO e diminui → conteúdo anda pra
    // DIREITA (itens entram pela esquerda), oposto ao de cima. Wrap sem emenda.
    let raf = 0;
    let pos = 0;
    let iniciado = false;
    const passo = () => {
      const meta = el.scrollWidth / 2; // metade = 1 cópia
      if (meta > 0) {
        if (!iniciado) { pos = reverso ? meta : 0; iniciado = true; }
        if (!pausado.current) {
          pos += reverso ? -0.5 : 0.5;
          if (pos >= meta) pos -= meta;
          else if (pos < 0) pos += meta;
          el.scrollLeft = pos;
        }
      }
      raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);

    const pause = () => { pausado.current = true; };
    // ao soltar o arraste, retoma de onde o usuário deixou (sincroniza o acumulador)
    const resume = () => { pausado.current = false; pos = el.scrollLeft; };
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
  }, [direcao]);

  if (!produtos.length) return null;
  const trilho = [...produtos, ...produtos]; // duplica p/ o loop contínuo

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
