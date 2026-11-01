"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Store } from "lucide-react";
import type { PartnerStore } from "@/core/partner-stores";

function StoreLogo({ store }: { store: PartnerStore }) {
  const [failed, setFailed] = useState(false);
  return <span className="shop-partner-logo">
    {store.logoUrl && !failed
      // eslint-disable-next-line @next/next/no-img-element
      ? <img src={store.logoUrl} alt="" loading="lazy" decoding="async" draggable={false} onError={() => setFailed(true)} />
      : <span>{store.nome}</span>}
  </span>;
}

/** Rolagem nativa: sem autoplay, clones, polling ou busca por logo no Worker. */
export function PartnerStoreCarousel({ stores }: { stores: PartnerStore[] }) {
  const track = useRef<HTMLUListElement>(null);
  const trackId = useId();
  function move(direction: number) {
    const list = track.current;
    if (!list) return;
    const max = list.scrollWidth - list.clientWidth;
    let left = list.scrollLeft + direction * Math.max(160, list.clientWidth * 0.75);
    if (direction > 0 && list.scrollLeft >= max - 2) left = 0;
    if (direction < 0 && list.scrollLeft <= 2) left = max;
    list.scrollTo({ left, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
  if (!stores.length) return null;
  return <section aria-label="Lojas parceiras" className="shop-partners">
    <div className="shop-partners-label"><Store aria-hidden="true" className="h-5 w-5 text-brand" /><h2 className="text-xs font-semibold leading-4">Lojas<br className="hidden sm:block" /> parceiras</h2></div>
    <ul ref={track} id={trackId} className="shop-partner-track">
      {stores.map(store => <li key={store.slug}>
        <Link prefetch={false} href={`/ofertas?${new URLSearchParams({ loja: store.slug })}`} className="shop-partner-link" aria-label={`Ver ofertas de ${store.nome}`}>
          <StoreLogo store={store} /><span className="shop-partner-name">{store.nome}</span>
        </Link>
      </li>)}
    </ul>
    {stores.length > 1 && <div className="shop-partner-controls">
      <button type="button" onClick={() => move(-1)} aria-label="Lojas anteriores" aria-controls={trackId}><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
      <button type="button" onClick={() => move(1)} aria-label="Próximas lojas" aria-controls={trackId}><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
    </div>}
  </section>;
}
