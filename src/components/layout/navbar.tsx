import Link from "next/link";
import Image from "next/image";
import { SearchTrigger } from "@/components/search-trigger";
import { UserMenu } from "@/components/user-menu";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { NavDesktop } from "@/components/layout/nav-desktop";

export function Navbar() {
  return <header className="sticky top-0 z-40 border-b border-line bg-bg-card">
    <div className="relative mx-auto flex min-h-[76px] max-w-page items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
      <Link prefetch={false} href="/" aria-label="PromoDetec — início" className="flex shrink-0 items-center gap-2.5">
        <Image src="/android-chrome-192x192.png" alt="" width={40} height={40} priority unoptimized className="hidden h-9 w-9 rounded-lg object-cover min-[360px]:block sm:h-10 sm:w-10" />
        <span className="font-display text-xl font-bold tracking-tight sm:text-2xl">Promo<span className="text-brand">Detec</span><span className="text-brand">.</span></span>
      </Link>
      <NavDesktop />
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3"><SearchTrigger /><UserMenu /><MobileMenu /></div>
    </div>
  </header>;
}
