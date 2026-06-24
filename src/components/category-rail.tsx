import Link from "next/link";
import { TODAS_CATEGORIAS } from "@/lib/navigation";

/**
 * Atalhos de categoria em destaque (estilo "ícones grandes" da Kabum).
 * Consome a fonte única de navegação — cada categoria herda a cor da sua
 * vertical (tech = mauve→ciano, fit = coral→âmbar).
 */
export function CategoryRail() {
  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-4 md:grid-cols-8">
      {TODAS_CATEGORIAS.map(({ slug, nome, Icon, accent }) => (
        <Link key={slug} href={`/categoria/${slug}`}
          className={`group flex flex-col items-center gap-2.5 rounded-2xl border border-line bg-bg-card/40 p-3 text-center transition hover:bg-bg-soft/60 sm:p-4 ${accent.border}`}>
          <span className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br text-white transition-transform duration-300 group-hover:scale-110 ${accent.grad} ${accent.glow}`}>
            <Icon className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <span className="text-[11px] font-medium leading-tight text-zinc-300 group-hover:text-white sm:text-xs">{nome}</span>
        </Link>
      ))}
    </div>
  );
}
