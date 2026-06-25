import Link from "next/link";
import Image from "next/image";
import { SearchTrigger } from "@/components/search-trigger";
import { UserMenu } from "@/components/user-menu";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { NavDesktop } from "@/components/layout/nav-desktop";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 overflow-hidden border-b border-emerald-400/30 bg-[#09130b]/95 shadow-[0_12px_34px_-26px_rgba(34,224,107,.75)] backdrop-blur-xl">
      <picture aria-hidden className="pointer-events-none absolute inset-0 opacity-35 mix-blend-screen">
        <source media="(max-width: 639px)" srcSet="/topbar_mobile_clean.png.png" />
        <img src="/topbar_desktop_clean.png.png" alt="" className="h-full w-full object-cover object-[center_58%]" />
      </picture>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#071407]/90 via-[#0d2d12]/72 to-[#06120a]/86" />
      <div className="relative mx-auto flex max-w-page items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <Image src="/logo.png" alt="PromoDetec" width={44} height={44} priority
              className="h-10 w-auto" />
            <span className="hidden font-display text-lg tracking-tightest sm:inline">Promo<span className="text-neon">Detec</span></span>
          </Link>
          <NavDesktop />
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <SearchTrigger />
          <UserMenu />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
