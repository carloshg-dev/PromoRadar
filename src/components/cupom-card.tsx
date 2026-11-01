"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Ticket } from "lucide-react";
import { corLoja } from "@/lib/utils";
import { formatShortDate } from "@/core/formatting";
import type { CupomLomadee } from "@/lib/lomadee-cupons";
import { track } from "./analytics/track";

/** Card de cupom: código copiável + CTA afiliado. Logo com fallback de monograma. */
export function CupomCard({ cupom }: { cupom: CupomLomadee }) {
  const [copiado, setCopiado] = useState(false);
  const cor = corLoja(cupom.marca);
  const lojaSlug = cupom.marca.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60);

  async function copiar() {
    if (!cupom.codigo) return;
    try {
      await navigator.clipboard.writeText(cupom.codigo);
      setCopiado(true);
      track("copiar_cupom", { origem: "cupons", lojaSlug });
      setTimeout(() => setCopiado(false), 2200);
    } catch { /* clipboard bloqueado → usuário copia na mão */ }
  }

  const validade = cupom.terminaEm
    ? formatShortDate(cupom.terminaEm)
    : null;

  return (
    <article className="flex h-full flex-col rounded-xl border border-line bg-bg-card p-5 transition-colors hover:border-brand/40">
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
          <div className="truncate text-sm font-semibold text-ink">{cupom.marca}</div>
          <div className="mt-0.5 text-[11px] text-muted">{cupom.source === "awin" ? "Awin" : cupom.source === "lomadee" ? "Lomadee" : "Parceiro"}{validade ? ` · até ${validade}` : " · sem prazo informado"}</div>
        </div>
        {cupom.destaque && (
          <span className="ml-auto rounded-md bg-bg-soft px-2 py-1 text-[11px] text-brand">
            destaque
          </span>
        )}
      </div>

      <p className="mt-3 line-clamp-2 flex-1 text-sm text-ink">{cupom.titulo}</p>
      {cupom.terms && <details className="mt-2 text-xs leading-5 text-muted"><summary className="inline-flex min-h-9 cursor-pointer items-center text-brand">Ver condições</summary><p className="mt-2 whitespace-pre-line">{cupom.terms}</p></details>}

      <div className="mt-4 flex items-center gap-2">
        {cupom.codigo ? (
          <button onClick={copiar}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-dashed border-brand/40 px-3 py-2 text-xs font-semibold tracking-wide text-brand transition-colors hover:bg-bg-soft"
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
          onClick={() => track("saida_loja", { origem: "cupons", lojaSlug })}
          className="shop-action inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold">
          Usar <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </article>
  );
}
