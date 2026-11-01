import Link from "next/link";
import Image from "next/image";
import { SearchTrigger } from "@/components/search-trigger";
import { UserMenu } from "@/components/user-menu";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { NavDesktop } from "@/components/layout/nav-desktop";
import { CampaignRibbon } from "./campaign-ribbon";
import { Search } from "lucide-react";

export function Navbar() {
  return <header className="sticky top-0 z-40 border-b border-line bg-bg-card">
    <CampaignRibbon />
    <div className="relative mx-auto flex min-h-[68px] max-w-page items-center justify-between gap-3 px-4 sm:min-h-[76px] sm:px-6 lg:px-10">
      <Link prefetch={false} href="/" aria-label="PromoDetec — início" className="flex shrink-0 items-center gap-2.5">
        <Image src="/android-chrome-192x192.png" alt="" width={40} height={40} priority unoptimized className="hidden h-9 w-9 rounded-lg object-cover min-[360px]:block sm:h-10 sm:w-10" />
        <span className="font-display text-xl font-bold tracking-tight sm:text-2xl">Promo<span className="text-brand">Detec</span><span className="text-brand">.</span></span>
      </Link>
      <form action="/ofertas" className="hidden max-w-xl flex-1 items-center gap-2 rounded-lg border border-line bg-bg-soft p-1 md:flex">
        <label htmlFor="shop-search" className="sr-only">Buscar no PromoDetec</label>
        <input id="shop-search" name="busca" type="search" maxLength={80} required placeholder="O que você quer encontrar hoje?" className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" />
        <button aria-label="Pesquisar ofertas" className="shop-action grid h-10 w-12 place-items-center rounded-md"><Search className="h-5 w-5" /></button>
      </form>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3"><span className="md:hidden"><SearchTrigger /></span><UserMenu /><MobileMenu /></div>
    </div>
    <div className="mx-auto hidden max-w-page items-center justify-between border-t border-line px-6 lg:flex lg:px-10"><NavDesktop /><Link prefetch={false} href="/ofertas?ate=50" className="inline-flex min-h-11 items-center text-xs font-semibold text-brand">Pequenos preços. Grandes achados.</Link></div>
  </header>;
}
