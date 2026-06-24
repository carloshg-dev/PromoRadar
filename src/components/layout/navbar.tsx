import Link from "next/link";
import Image from "next/image";
import { SearchTrigger } from "@/components/search-trigger";
import { UserMenu } from "@/components/user-menu";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { NavDesktop } from "@/components/layout/nav-desktop";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 glass border-b border-line">
      <div className="mx-auto flex max-w-page items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
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
