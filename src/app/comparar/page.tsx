import { listarComparacoes } from "@/infrastructure/repositories/produtos.repo";
import { ComparacaoCard } from "@/components/comparacao-card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";
import { ComparadorNav } from "@/components/layout/comparador-nav";
import { TrackView } from "@/components/analytics/track-view";
import { VERTICAIS } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Scale } from "lucide-react";

export const metadata = { title: "Comparador", alternates: { canonical: "/comparar" } };
export const revalidate = 7200;

export default async function Comparar({ searchParams }: { searchParams: { vertical?: string; categoria?: string } }) {
  // Comparador em 2 níveis: vertical (Tech/Mundo Fit/Casa & Eletro) → categoria.
  const vertical = VERTICAIS.find((v) => v.slug === searchParams.vertical) ?? VERTICAIS[0]!;
  const categoria = searchParams.categoria ?? "all";
  const dentroDaVertical = vertical.categorias.some((c) => c.slug === categoria);

  let comparacoes: Awaited<ReturnType<typeof listarComparacoes>> = [];
  let available = true;
  try {
    comparacoes = await listarComparacoes(
      dentroDaVertical
        ? { categoria, limit: 60 }
        : { categorias: vertical.categorias.map((c) => c.slug), limit: 60 },
    );
  } catch { available = false; }

  return (
    <main className="mx-auto max-w-page px-4 py-6 sm:px-6 lg:px-10">
      <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Comparador" }]} />
      <h1 className="mt-4 flex items-center gap-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        <Scale className="h-7 w-7 text-brand" /> Compare antes de escolher.
      </h1>
      <p className="mt-1 text-sm text-muted">
        Ofertas da mesma classe de produto, lado a lado. Os grupos podem incluir marcas e variações diferentes: confira modelo, capacidade e condições antes de escolher.
      </p>

      <TrackView tipo="abrir_comparacao" categoriaSlug={dentroDaVertical ? categoria : vertical.slug} origem="comparar" />
      <ComparadorNav verticalAtiva={vertical.slug} categoriaAtiva={dentroDaVertical ? categoria : "all"} />

      {comparacoes.length ? (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {comparacoes.map((c) => <ComparacaoCard key={c.chave} c={c} />)}
        </div>
      ) : (
        <EmptyState className="mt-8" icon={<Scale className="h-6 w-6 text-brand" />} title={available ? `Sem comparações em ${vertical.label} ainda` : "Comparações temporariamente indisponíveis"}
          hint={available ? "Comparações aparecem quando o mesmo modelo é encontrado em 2+ lojas." : "Não foi possível carregar as comparações atualizadas. Você pode continuar consultando as ofertas."}
          action={<Link prefetch={false} href="/ofertas"><Button variant="outline" size="sm">Ver ofertas</Button></Link>} />
      )}
    </main>
  );
}
