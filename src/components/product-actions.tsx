"use client";

import { useState } from "react";
import { Bookmark, Check, Share2 } from "lucide-react";
import { useRadar } from "./use-radar";
import { track } from "./analytics/track";
import { SITE_URL } from "@/lib/site";
import type { RadarItem } from "@/core/radar";

export function ProductActions({ item }: { item: RadarItem }) {
  const { items, ready, toggle } = useRadar();
  const [message, setMessage] = useState("");
  const [sharing, setSharing] = useState(false);
  const saved = items.some((row) => row.id === item.id);
  const save = () => {
    const action = toggle(item);
    setMessage(action === "saved" ? "Salvo neste navegador. Encontre na página inicial, em Seu radar."
      : action === "removed" ? "Oferta removida do seu radar."
      : action === "full" ? "Seu radar tem 30 ofertas. Remova uma antes de salvar outra."
      : "Não foi possível salvar neste navegador. Verifique se o armazenamento está permitido.");
    if (action === "saved" || action === "removed") track(action === "saved" ? "salvar_produto" : "remover_salvo", { produtoId: item.id, origem: "produto" });
  };
  const share = async () => {
    setSharing(true);
    const url = `${SITE_URL}/produto/${item.id}?utm_source=compartilhamento&utm_medium=referral`;
    const nativeShare = typeof navigator.share === "function";
    try {
      if (nativeShare) await navigator.share({ title: item.titulo, text: "Confira o preço e o histórico no PromoDetec.", url });
      else { await navigator.clipboard.writeText(url); setMessage("Link copiado. Compartilhe com quem está procurando essa oferta."); }
      track("compartilhar_produto", { produtoId: item.id, origem: nativeShare ? "nativo" : "copiar_link" });
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) setMessage("Não foi possível compartilhar. Você pode copiar o endereço da página.");
    } finally { setSharing(false); }
  };
  return <div className="mt-4">
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={!ready} aria-pressed={saved} onClick={save}
        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line px-3 py-2 text-sm text-zinc-200 hover:bg-bg-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50">
        {saved ? <Check className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}{saved ? "Salvo no radar" : "Salvar oferta"}
      </button>
      <button type="button" disabled={sharing} onClick={() => void share()}
        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line px-3 py-2 text-sm text-zinc-200 hover:bg-bg-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50">
        <Share2 className="h-4 w-4" />{sharing ? "Compartilhando…" : "Compartilhar"}
      </button>
    </div>
    <p role="status" aria-live="polite" className="mt-2 text-xs leading-relaxed text-muted">{message || "Salve para consultar depois. Não envia avisos de preço."}</p>
  </div>;
}
