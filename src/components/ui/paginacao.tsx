import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Paginação server-side por query string (?pagina=N) — funciona sem JS,
 * é cacheável por URL e amigável a SEO. Os filtros ativos (categoria, busca)
 * são preservados via `params`.
 */
export function Paginacao({ pagina, total, porPagina, baseHref, params }: {
  pagina: number;
  total: number;
  porPagina: number;
  baseHref: string;
  params?: Record<string, string | undefined>;
}) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  if (paginas <= 1) return null;

  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params ?? {})) if (v) sp.set(k, v);
    if (p > 1) sp.set("pagina", String(p));
    const qs = sp.toString();
    return qs ? `${baseHref}?${qs}` : baseHref;
  };

  const btn = "inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs transition";

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-3" aria-label="Paginação">
      {pagina > 1 ? (
        <Link href={href(pagina - 1)} className={`${btn} text-zinc-200 hover:border-brand/50 hover:bg-bg-soft`}>
          <ChevronLeft className="h-3.5 w-3.5" /> Anterior
        </Link>
      ) : (
        <span className={`${btn} cursor-default text-muted/40`}><ChevronLeft className="h-3.5 w-3.5" /> Anterior</span>
      )}

      <span className="label-mono text-[11px] text-muted">
        Página {pagina} de {paginas} · {total.toLocaleString("pt-BR")} produtos
      </span>

      {pagina < paginas ? (
        <Link href={href(pagina + 1)} className={`${btn} text-zinc-200 hover:border-brand/50 hover:bg-bg-soft`}>
          Próxima <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <span className={`${btn} cursor-default text-muted/40`}>Próxima <ChevronRight className="h-3.5 w-3.5" /></span>
      )}
    </nav>
  );
}
