import Link from "next/link";
import { Search, ArrowRight, ArrowUpRight, Bookmark, ChartNoAxesCombined } from "lucide-react";
import { Button } from "./ui/button";

export function DiscoverySearch({ children }: { children?: React.ReactNode }) {
  return <section aria-labelledby="discovery-title" className="grid items-center gap-9 py-10 sm:py-14 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:py-16">
    <div className="min-w-0">
      <h1 id="discovery-title" className="max-w-[11ch] font-display text-[clamp(2.65rem,4.9vw,4.8rem)] font-semibold leading-[1.02] tracking-[-.035em]">Encontre seu próximo <span className="text-brand">bom negócio.</span></h1>
      <p className="mt-6 max-w-[48ch] text-base leading-7 text-muted">Compare preços, consulte o histórico e guarde seus achados. A decisão é sua. A compra é direto na loja.</p>
      <form action="/ofertas" role="search" className="home-search mt-7 flex items-center gap-2 rounded-xl border border-line bg-white p-1.5">
        <label htmlFor="home-search" className="sr-only">Qual produto você está procurando?</label>
        <Search className="ml-2.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
        <input id="home-search" name="busca" maxLength={80} type="search" required placeholder="O que você quer encontrar?" className="h-11 min-w-0 flex-1 bg-transparent px-1 text-sm text-ink outline-none focus-visible:outline-none sm:text-base" />
        <Button type="submit" className="shrink-0 px-3 sm:px-5"><span className="hidden sm:inline">Buscar</span><ArrowRight className="h-5 w-5" aria-hidden="true" /><span className="sr-only sm:hidden">Buscar ofertas</span></Button>
      </form>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 text-xs text-muted"><span>Explore também</span>{["Creatina", "Perfume", "Fone", "Smartwatch"].map(term => <Link key={term} href={`/ofertas?busca=${encodeURIComponent(term.toLowerCase())}`} prefetch={false} className="inline-flex min-h-11 items-center gap-1 underline decoration-line hover:text-brand">{term}<ArrowUpRight className="h-3 w-3" aria-hidden="true" /></Link>)}</div>
      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-5 text-sm">
        <Link prefetch={false} href="/comparar" className="inline-flex min-h-11 items-center gap-2 font-medium hover:text-brand"><ChartNoAxesCombined className="h-4 w-4 text-brand" />Comparar entre lojas<ArrowUpRight className="h-3.5 w-3.5" /></Link>
        <Link prefetch={false} href="#meu-radar" className="inline-flex min-h-11 items-center gap-2 text-muted hover:text-brand"><Bookmark className="h-4 w-4" />Meu radar</Link>
      </div>
    </div>
    {children}
  </section>;
}
