"use client";

import Link from "next/link";
import { Search, ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "./ui/button";
import { useCampaign } from "./campaign-provider";

export function DiscoverySearch() {
  const theme = useCampaign();
  const warmup = theme?.id === "esquenta-black" || theme?.id === "esquenta-natal";
  const title = warmup ? theme.id === "esquenta-black" ? "Black Friday" : "Natal" : theme?.selo;
  const MissionTitle = theme ? "h2" : "h1";
  return <section aria-labelledby="discovery-title" className="pt-5 sm:pt-6">
    <div className={`campaign-hero ${theme ? "" : "campaign-hero-neutral"}`}>
      {theme && <div className="min-w-0">
        <h1 id="campaign-title" className="campaign-heading">{warmup && <>Esquenta<br className="hidden sm:block" /> </>}<span>{title}.</span></h1>
        <p className="mt-4 hidden max-w-[44ch] text-sm leading-6 text-white/80 sm:block">{theme.frase}</p>
      </div>}
      <div className="min-w-0">
        <MissionTitle id="discovery-title" className="campaign-mission-title">Encontre seu próximo bom negócio.</MissionTitle>
        <p className="campaign-mission-copy">Compare preços, consulte o histórico e guarde seus achados. A decisão é sua. Nossa missão é apresentar as ofertas e te direcionar as lojas responsáveis pela venda.</p>
        {theme && <Link prefetch={false} href="#achados" className="campaign-action mt-4 hidden min-h-11 items-center gap-5 rounded-lg px-4 py-2.5 text-sm font-semibold sm:inline-flex">{theme.cta.label}<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>}
      </div>
    </div>
    <form action="/ofertas" role="search" className="home-search mt-4 flex items-center gap-2 rounded-xl border border-line bg-white p-1.5">
        <label htmlFor="home-search" className="sr-only">Qual produto você está procurando?</label>
        <Search className="ml-2.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
        <input id="home-search" name="busca" maxLength={80} type="search" required placeholder="Qual produto vai entrar na sua lista?" className="h-11 min-w-0 flex-1 bg-transparent px-1 text-sm text-ink outline-none focus-visible:outline-none sm:text-base" />
        <Button type="submit" className="shrink-0 px-3 sm:px-5"><span className="hidden sm:inline">Buscar</span><ArrowRight className="h-5 w-5" aria-hidden="true" /><span className="sr-only sm:hidden">Buscar ofertas</span></Button>
      </form>
  </section>;
}
