import { paginaOfertasPublica as listarOfertasPaginado } from "@/services/public-catalog-cache";
import { GridProdutos } from "@/components/vitrine/grid-produtos";
import { BarraLojas } from "@/components/vitrine/barra-lojas";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";
import { Paginacao } from "@/components/ui/paginacao";
import { SubcategoriaNav } from "@/components/layout/subcategoria-nav";
import { TrackView } from "@/components/analytics/track-view";
import { nomeCategoria } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { pageNumber } from "@/core/search";
import { MAX_PRICE_AGE_DAYS } from "@/core/offer-freshness";

export const revalidate = 3600;
const POR_PAGINA = 60;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const name = nomeCategoria(params.slug);
  return { title: name, alternates: { canonical: `/categoria/${encodeURIComponent(params.slug)}` }, description: `Ofertas de ${name} no PromoDetec. Compare preços coletados, explore lojas e consulte o histórico disponível.` };
}

export default async function Categoria({ params, searchParams }: {
  params: { slug: string };
  searchParams: { pagina?: string; loja?: string };
}) {
  const pagina = pageNumber(searchParams.pagina);
  const loja = searchParams.loja ?? "";
  let produtos: Awaited<ReturnType<typeof listarOfertasPaginado>>["produtos"] = [];
  let total = 0;
  let available = true;
  try {
    ({ produtos, total } = await listarOfertasPaginado({ categoria: params.slug, loja: loja || undefined, limit: POR_PAGINA, pagina }));
  } catch { available = false; }
  const nome = nomeCategoria(params.slug);

  return (
    <main className="mx-auto max-w-page px-4 py-6 sm:px-6 lg:px-10">
      <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Categorias", href: "/ofertas" }, { label: nome }]} />
      <TrackView tipo="ver_categoria" categoriaSlug={params.slug} origem="categoria" />
      <h1 className="mt-3 text-2xl font-bold">{nome}</h1>
      <p className="mt-1 text-sm text-muted">Preços coletados nos últimos {MAX_PRICE_AGE_DAYS} dias. Confira as condições atuais na loja.</p>
      {total > 0 && (
        <p className="label-mono mt-1 text-[11px] text-muted">{total.toLocaleString("pt-BR")} produtos no radar</p>
      )}
      <SubcategoriaNav slugAtivo={params.slug} />
      <BarraLojas baseHref={`/categoria/${params.slug}`} ativa={loja} />
      {produtos.length ? (
        <>
          <GridProdutos produtos={produtos} />
          <Paginacao pagina={pagina} total={total} porPagina={POR_PAGINA} baseHref={`/categoria/${params.slug}`}
            params={{ loja: loja || undefined }} />
        </>
      ) : (
        <EmptyState className="mt-8" icon="📦" title={available ? "Sem ofertas recentes nesta categoria" : "Não foi possível carregar esta categoria"}
          hint={available ? "Tente outra loja ou aguarde a próxima coleta. O histórico dos produtos continua disponível." : "A consulta está temporariamente indisponível. Tente novamente em alguns instantes."}
          action={<Link href="/ofertas"><Button variant="outline" size="sm">Ver todas as ofertas</Button></Link>} />
      )}
    </main>
  );
}
