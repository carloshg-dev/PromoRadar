"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Ticket } from "lucide-react";
import { corLoja } from "@/lib/utils";
import type { CupomLomadee } from "@/lib/lomadee-cupons";

/** Card de cupom: código copiável + CTA afiliado. Logo com fallback de monograma. */
export function CupomCard({ cupom }: { cupom: CupomLomadee }) {
  const [copiado, setCopiado] = useState(false);
  const cor = corLoja(cupom.marca);

  async function copiar() {
    if (!cupom.codigo) return;
    try {
      await navigator.clipboard.writeText(cupom.codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch { /* clipboard bloqueado → usuário copia na mão */ }
  }

  const validade = cupom.terminaEm
    ? new Date(cupom.terminaEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    : null;

  return (
    <div className="flex h-full flex-col rounded-xl border border-line bg-bg-card/70 p-4 transition hover:border-zinc-600"
      style={cupom.destaque ? { borderColor: `${cor}66`, boxShadow: `0 0 18px ${cor}22` } : undefined}>
      <div className="flex items-center gap-2.5">
        {cupom.marcaLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cupom.marcaLogo} alt="" loading="lazy"
            className="h-8 w-8 shrink-0 rounded-full bg-white/95 object-contain p-0.5" />
        ) : (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: cor }}>
            {cupom.marca.charAt(0)}
          </span>
        )}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-zinc-100">{cupom.marca}</div>
          {validade && <div className="label-mono text-[10px] text-muted">válido até {validade}</div>}
        </div>
        {cupom.destaque && (
          <span className="label-mono ml-auto rounded-full px-2 py-0.5 text-[9px]"
            style={{ backgroundColor: `${cor}26`, color: cor }}>
            destaque
          </span>
        )}
      </div>

      <p className="mt-3 line-clamp-2 flex-1 text-sm text-zinc-300">{cupom.titulo}</p>

      <div className="mt-4 flex items-center gap-2">
        {cupom.codigo ? (
          <button onClick={copiar}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-xs font-bold tracking-wider transition hover:bg-bg-soft"
            style={{ borderColor: `${cor}88`, color: cor }}
            title="Copiar código">
            {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copiado ? "COPIADO!" : cupom.codigo}
          </button>
        ) : (
          <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs text-muted">
            <Ticket className="h-3.5 w-3.5" /> sem código — desconto direto
          </span>
        )}
        <a href={cupom.link} target="_blank" rel="nofollow sponsored noopener"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90">
          Usar <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
