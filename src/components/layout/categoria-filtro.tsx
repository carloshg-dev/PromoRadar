import Link from "next/link";
import { TODAS_CATEGORIAS } from "@/lib/navigation";

/**
 * Chips de filtro por categoria, alimentados pela fonte única de navegação —
 * inclui todas as verticais (Tech, Mundo Fit, e o que vier) sem manutenção
 * manual. O chip ativo herda a cor da vertical (mauve / coral / âmbar).
 * Usado em /ofertas e /comparar.
 */
const CHIP_ATIVO: Record<string, string> = {
  tech: "border-brand bg-brand/15 text-brand-2",
  fit: "border-fit bg-fit/15 text-fit",
  eletro: "border-eletro bg-eletro/15 text-eletro",
  ferramentas: "border-tool bg-tool/15 text-tool-2",
  gadgets: "border-gadget bg-gadget/15 text-gadget-2",
  perfumes: "border-parfum bg-parfum/15 text-parfum-2",
};

export function CategoriaFiltro({ baseHref, ativo }: { baseHref: string; ativo: string }) {
  const chip = (slug: string, label: string, vertical: string) => {
    const on = ativo === slug;
    const classe = on
      ? CHIP_ATIVO[vertical] ?? CHIP_ATIVO.tech!
      : "border-line text-muted hover:bg-bg-soft hover:text-white";
    return (
      <Link key={slug} href={`${baseHref}?categoria=${slug}`}
        className={`rounded-full border px-3 py-1 text-xs transition ${classe}`}>
        {label}
      </Link>
    );
  };

  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {chip("all", "Todas", "tech")}
      {TODAS_CATEGORIAS.map((c) => chip(c.slug, c.nome, c.vertical))}
    </div>
  );
}
