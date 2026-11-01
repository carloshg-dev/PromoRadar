"use client";

import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { useCampaign } from "./campaign-provider";
import { formatBRL } from "@/core/formatting";
import { useEffect, useRef, useState } from "react";

type HeroProduct = { id: string; titulo: string; imagemUrl: string | null; precoAtual: number | null };
export function DiscoverySearch({ products = [] }: { products?: HeroProduct[] }) {
  const theme = useCampaign();
  const warmup = theme?.id === "esquenta-black" || theme?.id === "esquenta-natal";
  const productArea = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const visibleProducts = products.filter(p => p.imagemUrl && !failed.has(p.id)).slice(0, 3);
  useEffect(() => {
    const broken = Array.from(productArea.current?.querySelectorAll<HTMLImageElement>("img[data-product]") ?? [])
      .filter(image => image.complete && !image.naturalWidth).map(image => image.dataset.product!);
    if (broken.length) setFailed(previous => new Set([...previous, ...broken]));
  }, [products, failed]);
  return <section aria-labelledby="discovery-title" className="pt-2 sm:pt-4">
    <div className="shop-hero">
      <div>
        <h1 id="campaign-title">{theme ? <>{warmup && "Esquenta "}<span>{theme.id === "esquenta-black" ? "Black Friday" : theme.id === "esquenta-natal" ? "Natal" : theme.selo}.</span></> : <>Seu próximo <span>achado.</span></>}</h1>
        <h2 id="discovery-title" className="campaign-mission-title">Encontre seu próximo bom negócio.</h2>
        <p className="campaign-mission-copy">Compare preços, consulte o histórico e guarde seus achados. A decisão é sua. Nossa missão é apresentar as ofertas e te direcionar as lojas responsáveis pela venda.</p>
      </div>
      <div ref={productArea} className="shop-hero-products" aria-label="Uma amostra dos achados">
        {visibleProducts.map(product => <Link prefetch={false} href={`/produto/${product.id}`} key={product.id} className="shop-hero-product" aria-label={`${product.titulo}, ${formatBRL(product.precoAtual)}`}>
          {product.imagemUrl && <img src={product.imagemUrl} data-product={product.id} alt="" width={140} height={104} loading="eager" decoding="async" onError={() => setFailed(previous => new Set([...previous, product.id]))} />}
          <strong>{formatBRL(product.precoAtual)}</strong><span className="mt-1 line-clamp-1 text-[11px]">{product.titulo}</span>
        </Link>)}
      </div>
    </div>
    <form action="/ofertas" role="search" className="home-search mt-3 flex items-center gap-2 rounded-xl border border-line bg-bg-card p-1.5 md:hidden">
      <label htmlFor="home-search" className="sr-only">Qual produto você está procurando?</label>
      <Search className="ml-2 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
      <input id="home-search" name="busca" maxLength={80} type="search" required placeholder="Encontre seu próximo achado" className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none" />
      <Button type="submit" className="shrink-0 px-3" aria-label="Buscar"><ArrowRight className="h-5 w-5" /></Button>
    </form>
  </section>;
}
