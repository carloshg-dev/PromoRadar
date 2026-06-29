"use client";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ShoppingBag, ArrowUpRight, Laptop, Smartphone, Headphones, Watch, Tablet, Speaker, SprayCan, Zap, Gamepad2, Dumbbell, Home, Wrench, Package } from "lucide-react";
import { ofertasMLAtivas, type OfertaML } from "@/lib/ofertas-mercadolivre";
import { linkAfiliado } from "@/lib/afiliados";
import { formatBRL } from "@/lib/utils";

/**
 * Vitrine "Ofertas Mercado Livre" — links de afiliado CURADOS (meli.la), colados à
 * mão pelo dono em src/lib/ofertas-mercadolivre.ts (espelha o padrão Carrefour em
 * ofertas-verificadas.tsx). Cada item é monetizado: o botão sai direto pro meli.la,
 * que já carrega o nosso ID de afiliado. Paginada. Some sozinha se a lista vazia.
 */
const ICON: Record<string, LucideIcon> = {
  notebook: Laptop, celular: Smartphone, audio: Headphones, smartwatch: Watch,
  tablet: Tablet, gadget: Speaker, perfume: SprayCan, eletro: Zap, games: Gamepad2,
  fit: Dumbbell, casa: Home, ferramenta: Wrench,
};
const POR_PAGINA = 8;

function ImagemOferta({ oferta, Icon }: { oferta: OfertaML; Icon: LucideIcon }) {
  const [erro, setErro] = useState(false);
  if (!oferta.imagemUrl || erro) {
    return (
      <div className="mb-3 grid aspect-[4/3] place-items-center rounded-xl border border-line bg-bg-soft/70">
        <Icon className="h-8 w-8 text-[#FFE600]" />
      </div>
    );
  }
  return (
    <div className="mb-3 aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={oferta.imagemUrl} alt={oferta.titulo} loading="lazy" decoding="async"
        onError={() => setErro(true)}
        className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.04]" />
    </div>
  );
}

export function OfertasMercadoLivre() {
  const ofertas = ofertasMLAtivas();
  const [pagina, setPagina] = useState(1);
  if (!ofertas.length) return null;

  const totalPaginas = Math.ceil(ofertas.length / POR_PAGINA);
  const inicio = (pagina - 1) * POR_PAGINA;
  const visiveis = ofertas.slice(inicio, inicio + POR_PAGINA);

  return (
    <section className="pb-14">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#FFE600] text-[#2D3277]">
          <ShoppingBag className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold tracking-tight text-white">Ofertas Mercado Livre</h2>
          <p className="text-xs text-muted">Seleção do nosso time — link direto pro Mercado Livre.</p>
        </div>
        <span className="hidden shrink-0 text-[11px] text-muted sm:block">{ofertas.length} ofertas</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visiveis.map((o, i) => {
          const Icon = ICON[o.cat ?? ""] ?? Package;
          const desconto = o.preco && o.precoDe && o.precoDe > o.preco
            ? Math.round((1 - o.preco / o.precoDe) * 100) : null;
          return (
            <a key={inicio + i} href={linkAfiliado(o.url)} target="_blank" rel="sponsored noopener noreferrer"
              className="glass hover-raise group flex flex-col rounded-2xl border border-line p-3 transition-colors hover:border-[#FFE600]/40">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="inline-flex h-7 items-center rounded-md bg-[#FFE600] px-2 text-[10px] font-bold text-[#2D3277]">Mercado Livre</span>
                {o.selo && <span className="inline-flex h-7 shrink-0 items-center rounded-lg bg-[#FFE600]/15 px-2 text-[10px] font-semibold text-[#FFE600]">{o.selo}</span>}
              </div>
              <ImagemOferta oferta={o} Icon={Icon} />
              <h3 className="line-clamp-2 min-h-[2.5rem] text-xs font-medium leading-snug text-zinc-100">{o.titulo}</h3>
              <div className="mt-2 flex items-baseline gap-2">
                {o.preco != null ? (
                  <>
                    <span className="font-display text-lg font-extrabold tracking-tight text-white">{formatBRL(o.preco)}</span>
                    {o.precoDe != null && o.precoDe > o.preco && (
                      <span className="text-[10px] text-muted line-through">{formatBRL(o.precoDe)}</span>
                    )}
                    {desconto != null && (
                      <span className="rounded bg-emerald-500/15 px-1 text-[10px] font-bold text-emerald-300">−{desconto}%</span>
                    )}
                  </>
                ) : (
                  <span className="text-[11px] text-muted">Preço no anúncio</span>
                )}
              </div>
              <span className="mt-3 inline-flex items-center justify-center gap-1 rounded-lg border border-[#FFE600]/30 bg-[#FFE600]/10 py-1.5 text-xs font-semibold text-[#FFE600] transition-colors group-hover:bg-[#FFE600]/20 group-hover:text-white">
                Ver oferta <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </a>
          );
        })}
      </div>

      {totalPaginas > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2">
          {Array.from({ length: totalPaginas }).map((_, i) => {
            const n = i + 1;
            const ativa = n === pagina;
            return (
              <button key={n} onClick={() => setPagina(n)} aria-label={`Página ${n}`} aria-current={ativa}
                className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors ${ativa ? "bg-[#FFE600] text-[#2D3277]" : "border border-line text-muted hover:bg-bg-soft hover:text-zinc-200"}`}>
                {n}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
