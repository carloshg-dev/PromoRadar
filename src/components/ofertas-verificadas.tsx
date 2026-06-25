"use client";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { BadgeCheck, ArrowUpRight, Laptop, Smartphone, Headphones, Watch, Tablet, Speaker, SprayCan, Zap, Gamepad2 } from "lucide-react";
import { ofertasAtivas, type OfertaVerificada } from "@/lib/ofertas-verificadas";
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
    return <span className="inline-flex h-8 w-[88px] items-center justify-center rounded-md border border-line bg-bg-soft px-2 text-[10px] font-semibold text-zinc-300 sm:w-[112px]">{loja}</span>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <span className="inline-flex h-8 w-[88px] items-center justify-center rounded-md border border-white/20 bg-white px-2 shadow-sm sm:w-[112px]">
      <img src={src} alt={`${loja} logo`} onError={() => setErro(true)} className="max-h-5 w-auto max-w-[76px] object-contain sm:max-h-6 sm:max-w-[100px]" />
    </span>
  );
}

function ImagemOferta({ oferta, Icon }: { oferta: OfertaVerificada; Icon: LucideIcon }) {
  const [erro, setErro] = useState(false);

  if (!oferta.imagemUrl || erro) {
    return (
      <div className="mb-3 grid aspect-[4/3] place-items-center rounded-xl border border-line bg-bg-soft/70">
        <Icon className="h-8 w-8 text-brand-2" />
      </div>
    );
  }

  return (
    <div className="mb-3 aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={oferta.imagemUrl}
        alt={oferta.titulo}
        loading="lazy"
        decoding="async"
        onError={() => setErro(true)}
        className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.04]"
      />
    </div>
  );
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
              <div className="mb-3 flex items-center justify-between gap-2">
                <LogoLoja loja={o.loja} />
                <span className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg bg-neon/10 px-2 text-[10px] font-medium text-neon">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">verificada</span>
                </span>
              </div>
              <ImagemOferta oferta={o} Icon={Icon} />
              <h3 className="line-clamp-2 min-h-[2.5rem] text-xs font-medium leading-snug text-zinc-100">{o.titulo}</h3>
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
