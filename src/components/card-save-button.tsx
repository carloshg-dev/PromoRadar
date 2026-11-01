"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import type { RadarItem } from "@/core/radar";
import { useRadar } from "./use-radar";
import { track } from "./analytics/track";

export function CardSaveButton({ item }: { item: RadarItem }) {
  const { items, ready, toggle } = useRadar();
  const [message, setMessage] = useState("");
  const saved = items.some(row => row.id === item.id);
  return <>
    <button type="button" disabled={!ready} aria-label={`${saved ? "Remover" : "Salvar"} ${item.titulo} ${saved ? "do" : "no"} radar`} aria-pressed={saved}
      onClick={() => {
        const action = toggle(item);
        setMessage(action === "saved" ? "Oferta salva neste navegador, em Seu radar."
          : action === "removed" ? "Oferta removida do radar."
          : action === "full" ? "Seu radar tem 30 ofertas. Remova uma antes de salvar outra."
          : "Não foi possível salvar. Confira a permissão de armazenamento do navegador.");
        if (action === "saved" || action === "removed") track(action === "saved" ? "salvar_produto" : "remover_salvo", { produtoId: item.id, origem: "card" });
      }}
      className={`absolute right-2 top-2 z-20 grid h-11 w-11 place-items-center rounded-full border bg-white text-[#24272c] transition-colors hover:bg-lime disabled:opacity-50 ${saved ? "border-brand" : "border-[#d8dade]"}`}>
      <Heart className={`h-[18px] w-[18px] ${saved ? "fill-current" : ""}`} aria-hidden="true" />
    </button>
    <span className="sr-only" role="status" aria-live="polite">{message}</span>
  </>;
}
