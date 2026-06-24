"use client";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { BadgeCheck, ArrowUpRight, Laptop, Smartphone, Headphones, Watch, Tablet, Speaker, SprayCan, Zap, Gamepad2 } from "lucide-react";
import { ofertasAtivas } from "@/lib/ofertas-verificadas";
import { linkAfiliado } from "@/lib/afiliados";

/**
 * Vitrine "Ofertas verificadas" — promoções REAIS dos parceiros (Awin),
 * conferidas e ainda ativas. Mostra a LOGO da loja (credibilidade) + selo
 * "verificada" + "válida até DD/MM". Paginada (são muitas). Link de saída
 * monetizado por linkAfiliado(). Expiradas somem sozinhas.
 */
const ICON: Record<string, LucideIcon> = {
  notebook: Laptop, celular: Smartphone, audio: Headphones, smartwatch: Watch,
  tablet: Tablet, gadget: Speaker, perfume: SprayCan, eletro: Zap, games: Gamepad2,
};
// Logos OFICIAIS da Awin (CDN deles, por merchant id) — confiável, ≠ Clearbit.
const LOGO: Record<string, string> = {
  Carrefour: "https://ui.awin.com/images/upload/merchant/profile/17665.png",
  AliExpress: "https://ui.awin.com/images/upload/merchant/profile/18879.png",
  "Doce Beleza": "https://ui.awin.com/images/upload/merchant/profile/76888.png",
  Sanavita: "https://ui.awin.com/images/upload/merchant/profile/117737.png",
};
const ddmm = (iso: string) => { const [, m, d] = iso.split("-"); return `${d}/${m}`; };
const POR_PAGINA = 8;

/** Logo da loja com fallback: se a imagem externa falhar, mostra o nome (nunca quebra). */
function LogoLoja({ loja }: { loja: string }) {
  const [erro, setErro] = useState(false);
  const src = LOGO[loja];
  if (!src || erro) {
    return <span className="rounded-md bg-bg-soft px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300">{loja}</span>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={loja} onError={() => setErro(true)} className="h-4 w-auto max-w-[84px] rounded bg-white object-contain px-1" />;
}

export function OfertasVerificadas() {
  const ofertas = ofertasAtivas();
  const [pagina, setPagina] = useState(1);
  if (!ofertas.length) return null;

  const totalPaginas = Math.ceil(ofertas.length / POR_PAGINA);
  const inicio = (pagina - 1) * POR_PAGINA;
  const visiveis = ofertas.slice(inicio, inicio + POR_PAGINA);

  return (
    <section className="pb-14">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-neon to-emerald-500 text-emerald-950">
          <BadgeCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold tracking-tight text-white">Ofertas verificadas</h2>
          <p className="text-xs text-muted">Promoções reais dos parceiros — conferidas por nós e ainda ativas.</p>
        </div>
        <span className="hidden shrink-0 text-[11px] text-muted sm:block">{ofertas.length} ofertas</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visiveis.map((o, i) => {
          const Icon = ICON[o.cat] ?? Zap;
          return (
            <a key={inicio + i} href={linkAfiliado(o.url)} target="_blank" rel="sponsored noopener noreferrer"
              className="glass hover-raise group flex flex-col rounded-2xl border border-line p-3 transition-colors hover:border-neon/40">
              <div className="mb-2 flex items-center justify-between">
                <LogoLoja loja={o.loja} />
                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-neon"><BadgeCheck className="h-3 w-3" /> verificada</span>
              </div>
              <Icon className="h-5 w-5 text-brand-2" />
              <h3 className="mt-2 line-clamp-2 min-h-[2.5rem] text-xs font-medium leading-snug text-zinc-100">{o.titulo}</h3>
              <div className="mt-2 flex items-center justify-between gap-1">
                <span className="rounded-md bg-neon/15 px-1.5 py-0.5 text-[11px] font-bold text-neon">{o.selo}</span>
                <span className="shrink-0 text-[10px] text-muted">até {ddmm(o.ateISO)}</span>
              </div>
              <span className="mt-3 inline-flex items-center justify-center gap-1 rounded-lg border border-brand/30 bg-brand/10 py-1.5 text-xs font-semibold text-brand-2 transition-colors group-hover:bg-brand/20 group-hover:text-white">
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
                className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors ${ativa ? "bg-brand text-white" : "border border-line text-muted hover:bg-bg-soft hover:text-zinc-200"}`}>
                {n}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
