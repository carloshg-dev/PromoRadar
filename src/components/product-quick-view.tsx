"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Eye, X, ArrowUpRight, ChartNoAxesCombined } from "lucide-react";
import type { Produto } from "@/core/domain/types";
import { formatBRL, formatShortDate } from "@/core/formatting";
import { track } from "./analytics/track";

export type QuickProduct = Pick<Produto, "id" | "titulo" | "imagemUrl" | "precoAtual" | "lojaNome" | "lojaSlug" | "atualizadoEm" | "precoMinHist"> & { monetizado: boolean };
const QuickViewContext = createContext<(product: QuickProduct) => void>(() => {});

export function ProductQuickViewProvider({ children }: { children: React.ReactNode }) {
  const [product, setProduct] = useState<QuickProduct | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (product && dialog.current && !dialog.current.open) dialog.current.showModal(); }, [product]);
  return <QuickViewContext.Provider value={p => { setProduct(p); track("ver_produto", { produtoId: p.id, lojaSlug: p.lojaSlug, origem: "card" }); }}>
    {children}
    <dialog ref={dialog} className="shop-dialog" aria-labelledby="quick-product-title" onClose={() => setProduct(null)} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      {product && <div className="shop-reveal relative p-5 sm:p-7">
        <button type="button" autoFocus aria-label="Fechar produto" onClick={() => dialog.current?.close()} className="absolute right-2 top-2 z-10 grid h-11 w-11 place-items-center rounded-full bg-bg-soft text-ink"><X className="h-5 w-5" /></button>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-xl bg-white p-5">{product.imagemUrl && <img src={product.imagemUrl} alt={product.titulo} width={300} height={300} className="aspect-square w-full object-contain" />}</div>
          <div className="flex flex-col justify-center">
            <p className="text-xs text-muted">{product.lojaNome}</p>
            <h2 id="quick-product-title" className="mt-2 pr-4 text-xl font-semibold leading-snug">{product.titulo}</h2>
            <p className="mt-5 text-xs text-muted">Preço coletado em <time dateTime={product.atualizadoEm}>{formatShortDate(product.atualizadoEm)}</time></p>
            <p className="price mt-1 text-3xl font-bold text-brand">{formatBRL(product.precoAtual)}</p>
            {product.precoMinHist !== null && <p className="mt-3 text-xs text-muted">Mínimo registrado: {formatBRL(product.precoMinHist)}</p>}
            <p className="mt-3 text-xs leading-5 text-muted">Confirme preço, frete e disponibilidade na loja. O PromoDetec compara e direciona; a compra é feita com a loja.</p>
            <Link prefetch={false} href={`/produto/${product.id}`} onClick={() => dialog.current?.close()} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand"><ChartNoAxesCombined className="h-4 w-4" />Ver histórico e detalhes</Link>
            {product.monetizado && <a href={`/r/${product.id}?o=card`} rel="nofollow sponsored" className="shop-action mt-2 inline-flex min-h-11 items-center justify-between rounded-lg px-4 text-sm font-semibold">Ir para {product.lojaNome}<ArrowUpRight className="h-4 w-4" /></a>}
          </div>
        </div>
      </div>}
    </dialog>
  </QuickViewContext.Provider>;
}

export function QuickViewButton({ product }: { product: QuickProduct }) {
  const open = useContext(QuickViewContext);
  return <button type="button" onClick={() => open(product)} aria-label={`Espiar ${product.titulo}`} className="absolute bottom-2 right-2 z-20 inline-flex min-h-9 items-center gap-1 rounded-md bg-[#191a1e] px-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#373940]"><Eye className="h-3.5 w-3.5" />Espiar</button>;
}

/** Uma sugestão da própria vitrine, sem rede, rotação, contagem fictícia ou bloqueio da navegação. */
export function ProductSuggestion({ product }: { product?: QuickProduct }) {
  const [show, setShow] = useState(false);
  const open = useContext(QuickViewContext);
  useEffect(() => {
    if (!product) return;
    let used = false;
    try { used = sessionStorage.getItem("pd-shop-suggestion") === "seen"; } catch { return; }
    if (used) return;
    const onScroll = () => {
      if (scrollY < 900 || document.visibilityState !== "visible" || document.querySelector("dialog[open]")) return;
      try { if (!localStorage.getItem("pd-consent")) return; sessionStorage.setItem("pd-shop-suggestion", "seen"); } catch { return; }
      setShow(true); window.removeEventListener("scroll", onScroll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [product]);
  if (!show || !product) return null;
  return <aside aria-label="Sugestão de achado" className="shop-reveal fixed bottom-4 right-4 z-30 w-[min(340px,calc(100vw-2rem))] rounded-xl bg-bg-card p-4 shadow-[0_12px_40px_#0006]">
    <button type="button" aria-label="Dispensar sugestão" onClick={() => setShow(false)} className="absolute right-1 top-1 grid h-10 w-10 place-items-center text-muted"><X className="h-4 w-4" /></button>
    <p className="pr-8 text-sm font-semibold">Mais um achado para explorar</p>
    <div className="mt-3 flex items-center gap-3">{product.imagemUrl && <img src={product.imagemUrl} alt="" loading="lazy" width={64} height={64} className="h-16 w-16 rounded-lg bg-white object-contain p-1" />}<div className="min-w-0"><p className="line-clamp-2 text-xs text-muted">{product.titulo}</p><p className="price mt-1 text-lg font-bold">{formatBRL(product.precoAtual)}</p></div></div>
    <button type="button" onClick={() => { setShow(false); open(product); }} className="shop-action mt-3 min-h-11 w-full rounded-lg text-sm font-semibold">Espiar oferta</button>
  </aside>;
}
