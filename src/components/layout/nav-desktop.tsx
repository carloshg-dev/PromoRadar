import Link from "next/link";
import { ChevronDown, Scale } from "lucide-react";
import { VERTICAIS } from "@/lib/navigation";

/**
 * Navegação desktop com mega-menu em cascata por vertical (Tech, Mundo Fit, …).
 * CSS-only (group-hover + focus-within) — sem JS, então a navbar segue server
 * component. Cada vertical usa um "named group" para abrir só o seu painel.
 * O hover não pisca: o painel encosta no trigger (pt-2 cria a ponte invisível).
 */
const linkBase = "rounded-lg px-3 py-1.5 text-muted transition hover:bg-bg-soft hover:text-white";

export function NavDesktop() {
  return (
    <nav className="hidden items-center gap-1 text-sm md:flex">
      <Link href="/ofertas" className={linkBase}>Ofertas</Link>

      {/* Comparador — destaque (cereja do bolo): pílula com accent da marca */}
      <div className="group/c relative">
        <Link href="/comparar" className="inline-flex items-center gap-1.5 rounded-lg border border-brand/40 bg-brand/10 px-3 py-1.5 font-semibold text-white transition hover:border-brand/60 hover:bg-brand/20">
          <Scale className="h-3.5 w-3.5 text-brand-2" />
          Comparador
          <ChevronDown className="h-3.5 w-3.5 text-brand-2 transition-transform duration-200 group-hover/c:rotate-180" />
        </Link>
        <div className="invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition-all duration-200 group-hover/c:visible group-hover/c:opacity-100 group-focus-within/c:visible group-focus-within/c:opacity-100">
          <div className="w-[min(92vw,260px)] rounded-2xl border border-line bg-bg-card/95 p-3 shadow-2xl backdrop-blur-xl">
            <div className="mb-2 px-2 label-mono text-[10px] uppercase tracking-wide text-muted">Comparar por seção</div>
            <div className="grid gap-1">
              {VERTICAIS.map((v) => (
                <Link
                  key={v.slug}
                  href={`/comparar?vertical=${v.slug}`}
                  className={`flex items-center gap-2.5 rounded-xl border border-transparent p-2 transition hover:bg-bg-soft/70 ${v.accent.border}`}
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${v.accent.dot}`} />
                  <span className="text-xs font-medium text-zinc-200">{v.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {VERTICAIS.map((v) => (
        <div key={v.slug} className="group/v relative">
          <Link
            href={v.href}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${v.accent.text} hover:bg-bg-soft ${v.accent.textHover}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${v.accent.dot}`} />
            {v.label}
            <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover/v:rotate-180" />
          </Link>

          {/* painel — invisível até hover/foco no grupo */}
          <div className="invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition-all duration-200 group-hover/v:visible group-hover/v:opacity-100 group-focus-within/v:visible group-focus-within/v:opacity-100">
            <div className="w-[min(92vw,420px)] rounded-2xl border border-line bg-bg-card/95 p-3 shadow-2xl backdrop-blur-xl">
              <div className="mb-2 flex items-center justify-between px-2">
                <span className={`label-mono text-[10px] uppercase tracking-wide ${v.accent.text}`}>{v.label}</span>
                <Link href={v.href} className="label-mono text-[10px] text-muted hover:text-white">ver tudo →</Link>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {v.categorias.map(({ slug, nome, Icon }) => (
                  <Link
                    key={slug}
                    href={`/categoria/${slug}`}
                    className={`group flex items-center gap-2.5 rounded-xl border border-transparent p-2 transition hover:bg-bg-soft/70 ${v.accent.border}`}
                  >
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-white ${v.accent.grad} ${v.accent.glow}`}>
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <span className="text-xs font-medium text-zinc-200 group-hover:text-white">{nome}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}

      <Link href="/cupons" className={linkBase}>Cupons</Link>
      <Link href="/noticias" className={linkBase}>Notícias</Link>
    </nav>
  );
}
