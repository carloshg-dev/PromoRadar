"use client";

import Link from "next/link";
import { Bookmark, ArrowRight, X } from "lucide-react";
import { useRadar } from "./use-radar";
import { track } from "./analytics/track";

export function SavedRadar() {
  const { items, toggle } = useRadar();
  return <section id="meu-radar" aria-labelledby="radar-title" className="my-6 scroll-mt-24 border-y border-line py-5">
    <div className="flex items-center gap-2">
      <Bookmark className="h-4 w-4 text-brand-2" />
      <h2 id="radar-title" className="text-base font-semibold">Seu radar</h2>
      {items.length > 0 && <span className="text-xs tabular-nums text-muted">{items.length} de 30</span>}
    </div>
    {items.length ? <>
      <p className="mt-1 text-xs text-muted">Salvas neste navegador. Abra uma oferta para consultar o preço atual.</p>
      <ul className="mt-3 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => <li key={item.id} className="flex min-w-0 items-center border-t border-line">
          <Link href={`/produto/${item.id}`} prefetch={false} className="flex min-h-11 min-w-0 flex-1 items-center gap-2 py-2 text-sm text-ink hover:text-brand-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
            <span className="line-clamp-2">{item.titulo}</span><ArrowRight className="h-3.5 w-3.5 shrink-0" />
          </Link>
          <button type="button" aria-label={`Remover ${item.titulo} do radar`} onClick={() => {
            if (toggle(item) === "removed") track("remover_salvo", { produtoId: item.id, origem: "radar" });
          }} className="grid h-11 w-11 shrink-0 place-items-center text-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"><X className="h-4 w-4" /></button>
        </li>)}
      </ul>
    </> : <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">Gostou de uma oferta? Abra o produto e toque em “Salvar oferta” para voltar a ele aqui. Sem cadastro.</p>}
  </section>;
}
