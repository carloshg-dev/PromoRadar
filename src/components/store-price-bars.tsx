"use client";
import { useState } from "react";
import Link from "next/link";
import type { Produto } from "@/core/domain/types";
import { formatBRL, corLoja } from "@/lib/utils";

/**
 * Gráfico de barras de preço por loja (destaque da home + cards do comparador).
 * Cada loja SEMPRE na sua cor (consistente entre cards); a mais barata é
 * destacada por selo "MENOR" + preço verde + brilho (sem trocar a cor da barra).
 * Rodapé: LEDs minimalistas na cor de cada barra — acendem ao passar o mouse na
 * barra correspondente. Barra ∝ preço; cada linha leva à página do produto.
 */
export function StorePriceBars({ ofertas, menorPreco, maiorPreco, limit = 5 }:
  { ofertas: Produto[]; menorPreco: number; maiorPreco: number; limit?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const itens = ofertas.slice(0, limit);

  return (
    <div>
      <div className="space-y-2">
        {itens.map((o, i) => {
          const menor = i === 0;
          const cor = corLoja(o.lojaSlug ?? o.lojaNome);
          const aceso = menor || hover === i;
          const w = maiorPreco > 0 ? Math.max(10, Math.round(((o.precoAtual as number) / maiorPreco) * 100)) : 100;
          return (
            <Link key={o.id} href={`/produto/${o.id}`} className="group block"
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <div className="mb-0.5 flex items-center justify-between text-[11px]">
                <span className="inline-flex min-w-0 items-center gap-1 label-mono" style={{ color: cor }}>
                  <span className="truncate">{o.lojaNome}</span>
                  {menor && <span className="shrink-0 rounded bg-neon/15 px-1 text-[8px] font-bold text-neon">MENOR</span>}
                </span>
                <span className={`shrink-0 font-semibold ${menor ? "text-neon" : "text-zinc-300"}`}>
                  {formatBRL(o.precoAtual)}
                  {!menor && <span className="ml-1 text-[9px] text-muted">+{formatBRL((o.precoAtual as number) - menorPreco)}</span>}
                </span>
              </div>
              {/* título REAL de cada loja: transparência — o usuário vê SE são o mesmo produto */}
              <div className="mb-1 line-clamp-1 text-[10px] leading-tight text-muted/70 transition-colors group-hover:text-muted" title={o.titulo}>{o.titulo}</div>
              <div className="h-2.5 overflow-hidden rounded-full bg-bg-soft">
                <div className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${w}%`,
                    background: cor,
                    filter: hover === i ? "brightness(1.15)" : undefined,
                    boxShadow: aceso ? `0 0 12px ${cor}80` : undefined,
                  }} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* LEDs minimalistas — cor de cada barra; acendem no hover da barra */}
      {itens.length > 1 && (
        <div className="mt-3 flex items-center gap-2 border-t border-line pt-2.5">
          {itens.map((o, i) => {
            const cor = corLoja(o.lojaSlug ?? o.lojaNome);
            const on = hover === i;
            return (
              <span key={o.id} title={o.lojaNome}
                className="h-2 w-2 rounded-full transition-all duration-300"
                style={{
                  background: cor,
                  opacity: on ? 1 : 0.3,
                  transform: on ? "scale(1.3)" : "scale(1)",
                  boxShadow: on ? `0 0 8px ${cor}, 0 0 3px ${cor}` : "none",
                }} />
            );
          })}
        </div>
      )}
    </div>
  );
}
