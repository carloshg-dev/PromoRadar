import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";

export function DiscoverySearch() {
  return <section aria-labelledby="discovery-title" className="py-6 sm:py-8">
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div className="max-w-xl">
        <h1 id="discovery-title" className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Uma boa compra começa pelo preço.</h1>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">Encontre ofertas, consulte o histórico disponível e salve o que vale acompanhar. Você decide e compra direto na loja.</p>
      </div>
      <Link href="/comparar" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-2 hover:text-white">Comparar entre lojas <ArrowRight className="h-4 w-4" /></Link>
    </div>
    <form action="/ofertas" role="search" className="mt-5 flex flex-col gap-2 sm:flex-row">
      <label htmlFor="home-search" className="sr-only">Qual produto você está procurando?</label>
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-muted" />
        <input id="home-search" name="busca" maxLength={80} type="search" required placeholder="Ex.: creatina, perfume ou fone Bluetooth"
          className="min-h-[52px] w-full rounded-xl border border-line bg-bg-card pl-12 pr-4 text-base text-zinc-100 placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand" />
      </div>
      <Button type="submit" size="lg" className="min-h-[52px]">Encontrar ofertas <ArrowRight className="h-4 w-4" /></Button>
    </form>
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
      <span>Comece por</span>
      {["Creatina", "Perfume", "Fone", "Smartwatch"].map((term) => <Link key={term} href={`/ofertas?busca=${encodeURIComponent(term.toLowerCase())}`} prefetch={false} className="inline-flex min-h-11 items-center underline decoration-line underline-offset-4 hover:text-brand-2">{term}</Link>)}
    </div>
  </section>;
}
