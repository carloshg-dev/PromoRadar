import { listarOfertasPaginado } from "@/infrastructure/repositories/produtos.repo";
import { VitrineComFiltroLoja } from "@/components/vitrine/filtro-lojas";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";
import { Paginacao } from "@/components/ui/paginacao";
import { SubcategoriaNav } from "@/components/layout/subcategoria-nav";
import { TrackView } from "@/components/analytics/track-view";
import { nomeCategoria } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const revalidate = 120;
const POR_PAGINA = 60;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  return { title: nomeCategoria(params.slug) };
}

export default async function Categoria({ params, searchParams }: {
  params: { slug: string };
  searchParams: { pagina?: string };
}) {
  const pagina = Math.max(1, Number(searchParams.pagina) || 1);
  let produtos: Awaited<ReturnType<typeof listarOfertasPaginado>>["produtos"] = [];
  let total = 0;
  try {
    ({ produtos, total } = await listarOfertasPaginado({ categoria: params.slug, limit: POR_PAGINA, pagina }));
  } catch { produtos = []; }
  const nome = nomeCategoria(params.slug);

  return (
    <main className="mx-auto max-w-page px-4 py-6 sm:px-6 lg:px-10">
      <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Categorias", href: "/#categorias" }, { label: nome }]} />
      <TrackView tipo="ver_categoria" categoriaSlug={params.slug} origem="categoria" />
      <h1 className="mt-3 text-2xl font-bold">{nome}</h1>
      {total > 0 && (
        <p className="label-mono mt-1 text-[11px] text-muted">{total.toLocaleString("pt-BR")} produtos no radar</p>
      )}
      <SubcategoriaNav slugAtivo={params.slug} />
      {produtos.length ? (
        <>
          <VitrineComFiltroLoja produtos={produtos} />
          <Paginacao pagina={pagina} total={total} porPagina={POR_PAGINA} baseHref={`/categoria/${params.slug}`} />
        </>
      ) : (
        <EmptyState className="mt-8" icon="📦" title="Sem ofertas nesta categoria ainda"
          hint="O coletor ainda não trouxe itens aqui. Veja outras ofertas enquanto isso."
          action={<Link href="/ofertas"><Button variant="outline" size="sm">Ver todas as ofertas</Button></Link>} />
      )}
    </main>
  );
}
