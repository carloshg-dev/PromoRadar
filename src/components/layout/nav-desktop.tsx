import Link from "next/link";
import { ChevronDown, ArrowUpRight } from "lucide-react";
import { VERTICAIS } from "@/lib/navigation";

const link = "route-link inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium";
export function NavDesktop() {
  return <nav aria-label="Navegação principal" className="hidden items-center gap-1 lg:flex">
    <Link prefetch={false} href="/ofertas" className={link}>Ofertas</Link>
    <Link prefetch={false} href="/comparar" className={link}>Comparar preços</Link>
    <Link prefetch={false} href="/cupons" className={link}>Cupons</Link>
    <div className="group/categories relative">
      <button type="button" className={link}>Categorias <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" /></button>
      <div className="invisible absolute left-1/2 top-full z-50 w-[min(720px,90vw)] -translate-x-1/2 pt-3 opacity-0 transition-opacity group-hover/categories:visible group-hover/categories:opacity-100 group-focus-within/categories:visible group-focus-within/categories:opacity-100">
        <div className="grid max-h-[75vh] grid-cols-3 gap-x-5 gap-y-6 overflow-y-auto rounded-xl border border-line bg-bg-card p-6">
          {VERTICAIS.map(vertical => <div key={vertical.slug}>
            <Link prefetch={false} href={vertical.href} className="mb-2 flex min-h-11 items-center gap-2 text-sm font-semibold"><span aria-hidden="true" className={`h-2 w-2 rounded-full ${vertical.accent.dot}`} />{vertical.label}<ArrowUpRight className="ml-auto h-3.5 w-3.5 text-muted" /></Link>
            <ul>{vertical.categorias.map(category => <li key={category.slug}><Link prefetch={false} href={`/categoria/${category.slug}`} className="route-link flex min-h-10 items-center gap-2 rounded-md px-2 text-xs text-muted"><category.Icon className="h-3.5 w-3.5" aria-hidden="true" />{category.nome}</Link></li>)}</ul>
          </div>)}
        </div>
      </div>
    </div>
  </nav>;
}
