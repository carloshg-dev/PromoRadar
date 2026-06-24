import Link from "next/link";
import { verticalDaCategoria } from "@/lib/navigation";

/**
 * Sub-navegação contextual: dentro de uma categoria, mostra as categorias IRMÃS
 * da mesma vertical (ex: em Creatina → Whey · Creatina · Pré-treino), destacando
 * a ativa na cor da vertical. Aparece no topo das páginas de categoria. Some se
 * a categoria não pertence a uma vertical mapeada (não há irmãs para listar).
 */
export function SubcategoriaNav({ slugAtivo }: { slugAtivo: string }) {
  const vertical = verticalDaCategoria(slugAtivo);
  if (!vertical || vertical.categorias.length < 2) return null;
  const { accent } = vertical;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className={`inline-flex items-center gap-1.5 label-mono text-[10px] uppercase tracking-wide ${accent.text}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${accent.dot}`} />{vertical.label}
      </span>
      <span className="text-line">·</span>
      {vertical.categorias.map(({ slug, nome, Icon }) => {
        const ativo = slug === slugAtivo;
        return (
          <Link
            key={slug}
            href={`/categoria/${slug}`}
            aria-current={ativo ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
              ativo
                ? `bg-gradient-to-br text-white ${accent.grad} border-transparent ${accent.glow}`
                : `border-line text-muted hover:bg-bg-soft hover:text-white ${accent.border}`
            }`}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />{nome}
          </Link>
        );
      })}
    </div>
  );
}
