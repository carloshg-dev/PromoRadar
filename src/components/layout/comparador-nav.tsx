import Link from "next/link";
import { VERTICAIS } from "@/lib/navigation";

/**
 * Navegação em 2 níveis do Comparador: abas de VERTICAL (Tech, Mundo Fit,
 * Casa & Eletro), cada uma na sua cor; e, abaixo, os chips das categorias da
 * vertical ativa ("Todas" + cada categoria). Comparar é sempre dentro de uma
 * vertical — hardware não cruza com suplemento nem com eletro.
 */
const ABA_ATIVA: Record<string, string> = {
  tech: "bg-brand/15 border-brand text-brand-2",
  fit: "bg-fit/15 border-fit text-fit",
  eletro: "bg-eletro/15 border-eletro text-eletro",
  ferramentas: "bg-tool/15 border-tool text-tool-2",
  gadgets: "bg-gadget/15 border-gadget text-gadget-2",
  perfumes: "bg-parfum/15 border-parfum text-parfum-2",
};
const CHIP_ATIVO: Record<string, string> = {
  tech: "border-brand bg-brand/15 text-brand-2",
  fit: "border-fit bg-fit/15 text-fit",
  eletro: "border-eletro bg-eletro/15 text-eletro",
  ferramentas: "border-tool bg-tool/15 text-tool-2",
  gadgets: "border-gadget bg-gadget/15 text-gadget-2",
  perfumes: "border-parfum bg-parfum/15 text-parfum-2",
};

export function ComparadorNav({ verticalAtiva, categoriaAtiva }: { verticalAtiva: string; categoriaAtiva: string }) {
  const vertical = VERTICAIS.find((v) => v.slug === verticalAtiva) ?? VERTICAIS[0]!;

  return (
    <div className="mt-5 space-y-3">
      {/* Nível 1 — verticais */}
      <div className="flex flex-wrap gap-2">
        {VERTICAIS.map((v) => {
          const on = v.slug === vertical.slug;
          return (
            <Link key={v.slug} href={`/comparar?vertical=${v.slug}`}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                on ? ABA_ATIVA[v.slug] ?? ABA_ATIVA.tech : "border-line text-muted hover:bg-bg-soft hover:text-white"}`}>
              <span className={`h-2 w-2 rounded-full ${v.accent.dot}`} />{v.label}
            </Link>
          );
        })}
      </div>

      {/* Nível 2 — categorias da vertical ativa */}
      <div className="flex flex-wrap gap-2 border-t border-line pt-3">
        <CategoriaChip vertical={vertical.slug} slug="all" label="Todas" ativo={categoriaAtiva === "all"} />
        {vertical.categorias.map((c) => (
          <CategoriaChip key={c.slug} vertical={vertical.slug} slug={c.slug} label={c.nome} ativo={categoriaAtiva === c.slug} />
        ))}
      </div>
    </div>
  );
}

function CategoriaChip({ vertical, slug, label, ativo }: { vertical: string; slug: string; label: string; ativo: boolean }) {
  const href = slug === "all" ? `/comparar?vertical=${vertical}` : `/comparar?vertical=${vertical}&categoria=${slug}`;
  const classe = ativo ? CHIP_ATIVO[vertical] ?? CHIP_ATIVO.tech : "border-line text-muted hover:bg-bg-soft hover:text-white";
  return (
    <Link href={href} className={`rounded-full border px-3 py-1 text-xs transition ${classe}`}>{label}</Link>
  );
}
