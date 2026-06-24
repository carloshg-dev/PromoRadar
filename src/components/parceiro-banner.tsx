import { Store, ArrowRight } from "lucide-react";

/**
 * Banner de PARCEIRO em destaque na home (ex: Allever). Link de afiliado externo
 * (Lomadee/lmdee.link) — abre em nova aba com rel="sponsored" (boa prática SEO p/
 * link patrocinado). Usado quando a loja parceira não tem catálogo raspável, mas
 * vale destacar a marca + mandar tráfego monetizado.
 */
export function ParceiroBanner({ nome, descricao, href, badge }: {
  nome: string;
  descricao: string;
  href: string;
  badge?: string;
}) {
  return (
    <section className="pt-3">
      <a href={href} target="_blank" rel="sponsored noopener noreferrer"
        className="group hover-raise relative flex items-center gap-4 overflow-hidden rounded-2xl border border-brand/30 bg-gradient-to-r from-brand/20 via-bg-soft/40 to-cyan/10 p-4 sm:p-5">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-cyan text-white shadow-[0_8px_24px_-8px_rgba(124,93,255,.6)]">
          <Store className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="label-mono text-[11px] uppercase tracking-wide text-brand-2">Parceiro em destaque</span>
            {badge && <span className="rounded bg-neon/15 px-1.5 py-0.5 text-[10px] font-bold text-neon">{badge}</span>}
          </div>
          <h3 className="mt-0.5 truncate text-lg font-bold tracking-tight text-white">{nome}</h3>
          <p className="line-clamp-2 text-xs text-muted sm:text-sm">{descricao}</p>
        </div>
        <span className="hidden shrink-0 items-center gap-1 rounded-xl border border-brand/40 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand-2 transition-colors group-hover:bg-brand/20 group-hover:text-white sm:flex">
          Conferir <ArrowRight className="h-4 w-4" />
        </span>
      </a>
    </section>
  );
}
