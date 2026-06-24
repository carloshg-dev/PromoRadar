"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Radio } from "lucide-react";
import { decodeHtmlEntities, timeAgo } from "@/lib/utils";

export interface NewsSlide {
  id: string;
  fonte: string;
  titulo: string;
  resumo: string | null;
  url: string;
  imagem_url: string | null;
  publicado_em: string | null;
  tags: string[];
}

/**
 * Carrossel de notícias no topo da home (estilo "banner" da Kabum), na paleta
 * Radical Precision Dark. Auto-rotaciona, pausa no hover, com setas e indicadores.
 * Cada slide leva à matéria na fonte. Imagem com fallback p/ gradiente mauve→ciano.
 */
export function NewsCarousel({ items }: { items: NewsSlide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [erro, setErro] = useState<Record<string, boolean>>({});
  const n = items.length;

  const go = useCallback((d: number) => setI((p) => (p + d + n) % n), [n]);

  useEffect(() => {
    if (paused || n <= 1) return;
    const t = setInterval(() => setI((p) => (p + 1) % n), 6000);
    return () => clearInterval(t);
  }, [paused, n]);

  if (!n) return null;

  return (
    <section
      className="relative h-[260px] overflow-hidden rounded-3xl border border-line sm:h-[330px] lg:h-[400px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Últimas notícias"
    >
      {items.map((s, idx) => {
        const ativo = idx === i;
        const temImg = s.imagem_url && !erro[s.id];
        return (
          <a
            key={s.id}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`group absolute inset-0 transition-opacity duration-700 ${ativo ? "opacity-100" : "pointer-events-none opacity-0"}`}
            aria-hidden={!ativo}
            tabIndex={ativo ? 0 : -1}
          >
            {/* fundo: gradiente sempre + imagem por cima (com fallback) */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand/30 via-bg-card to-cyan/20" />
            <div className="pointer-events-none absolute inset-0 mesh-line opacity-30" />
            {temImg && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s.imagem_url as string}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                onError={() => setErro((e) => ({ ...e, [s.id]: true }))}
              />
            )}
            {/* overlay p/ legibilidade */}
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-bg/80 via-transparent to-transparent" />

            {/* conteúdo */}
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 lg:p-9">
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-bg/60 px-2.5 py-1 label-mono text-[10px] text-brand-2 backdrop-blur">
                  <Radio className="h-3 w-3" /> {s.fonte}
                </span>
                <span className="label-mono text-[10px] text-zinc-300">{timeAgo(s.publicado_em)}</span>
              </div>
              <h3 className="max-w-3xl font-display text-xl font-bold leading-tight tracking-tightest text-white drop-shadow sm:text-2xl lg:text-3xl">
                {decodeHtmlEntities(s.titulo)}
              </h3>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(124,93,255,.4)] transition group-hover:bg-brand-2">
                Ler matéria <ExternalLink className="h-3.5 w-3.5" />
              </span>
            </div>
          </a>
        );
      })}

      {/* selo */}
      <div className="absolute left-5 top-5 z-10 inline-flex items-center gap-1.5 rounded-full bg-bg/70 px-3 py-1 label-mono text-[10px] text-cyan-2 backdrop-blur sm:left-7 sm:top-7">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan" /> Radar de notícias
      </div>

      {/* setas */}
      {n > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="Anterior"
            className="absolute left-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-bg/60 text-white backdrop-blur transition hover:bg-bg/90">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={() => go(1)} aria-label="Próxima"
            className="absolute right-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-line bg-bg/60 text-white backdrop-blur transition hover:bg-bg/90">
            <ChevronRight className="h-5 w-5" />
          </button>
          {/* indicadores */}
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {items.map((s, idx) => (
              <button key={s.id} onClick={() => setI(idx)} aria-label={`Slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-brand" : "w-1.5 bg-white/30 hover:bg-white/50"}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
