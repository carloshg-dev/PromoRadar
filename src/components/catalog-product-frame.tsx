"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Foto que falha no CDN retira o card; preço e imagem nunca são substituídos por ficção. */
export function CatalogProductFrame({ children }: { children: ReactNode }) {
  const element = useRef<HTMLElement>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const image = element.current?.querySelector<HTMLImageElement>("img.product-picture");
    if (image?.complete && !image.naturalWidth) setUnavailable(true);
  }, []);
  if (unavailable) return null;
  return <article ref={element} className="catalog-card group relative isolate flex min-w-0 flex-col overflow-hidden"
    onErrorCapture={event => { if (event.target instanceof HTMLImageElement && event.target.classList.contains("product-picture")) setUnavailable(true); }}>
    {children}
  </article>;
}
