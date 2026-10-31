import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Produto } from "@/core/domain/types";
import { ProdutoCard } from "./produto-card";

export function ProductShelf({ title, description, href, products, limit = 4, featured = false }: { title: string; description: string; href: string; products: Produto[]; limit?: number; featured?: boolean }) {
  if (!products.length) return null;
  return <section id={featured ? "achados" : undefined} className={featured ? "home-shelf-featured" : "home-shelf"}>
    <div className="mb-4 flex items-end justify-between gap-4"><div><h2 className="font-display text-[1.35rem] font-semibold leading-tight tracking-tight sm:text-2xl">{title}</h2>{!featured && <p className="mt-2 max-w-prose text-sm leading-6 text-muted">{description}</p>}</div><Link prefetch={false} href={href} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-medium text-brand hover:underline"><span className="hidden sm:inline">Ver todas</span><ArrowUpRight className="h-5 w-5" aria-hidden="true" /><span className="sr-only sm:hidden">Ver todas: {title}</span></Link></div>
    <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 lg:grid-cols-4">{products.slice(0, Math.min(8, Math.max(1, limit))).map(product => <ProdutoCard key={product.id} p={product} />)}</div>
  </section>;
}
