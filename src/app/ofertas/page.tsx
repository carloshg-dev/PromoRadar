import { paginaOfertasPublica as listarOfertasPaginado } from "@/services/public-catalog-cache";
import { GridProdutos } from "@/components/vitrine/grid-produtos";
import { BarraLojas } from "@/components/vitrine/barra-lojas";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";
import { Paginacao } from "@/components/ui/paginacao";
import { CategoriaFiltro } from "@/components/layout/categoria-filtro";
import { TrackView } from "@/components/analytics/track-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { pageNumber, searchTerm } from "@/core/search";
import { MAX_PRICE_AGE_DAYS } from "@/core/offer-freshness";

const POR_PAGINA = 60;

export const metadata = { title: "Melhores ofertas", alternates: { canonical: "/ofertas" }, description: "Encontre ofertas por produto, categoria e loja. Consulte o histórico disponível antes de comprar." };
export const revalidate = 3600;

export default async function Ofertas({ searchParams }: { searchParams: { categoria?: string; busca?: string; pagina?: string; loja?: string } }) {
  const categoria = searchParams.categoria ?? "all";
  const busca = searchTerm(searchParams.busca);
  const loja = searchParams.loja ?? "";
  const pagina = pageNumber(searchParams.pagina);
  let produtos: Awaited<ReturnType<typeof listarOfertasPaginado>>["produtos"] = [];
  let total = 0;
  let available = true;
  try {
    ({ produtos, total } = await listarOfertasPaginado({ categoria, busca, loja: loja || undefined, limit: POR_PAGINA, pagina }));
  } catch { available = false; }

  return (
    <main className="mx-auto max-w-page px-4 py-6 sm:px-6 lg:px-10">
      {busca && <TrackView tipo="busca" termo={busca} origem="ofertas" />}
      {available && busca && produtos.length === 0 && <TrackView tipo="busca_sem_resultado" termo={busca} origem="ofertas" />}
      <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Ofertas" }]} />
      <h1 className="mt-3 text-2xl font-bold">Melhores ofertas</h1>
      <p className="mt-1 text-sm text-muted">
        Preços coletados nos últimos {MAX_PRICE_AGE_DAYS} dias. Confira o valor final e a disponibilidade na loja.
        {total > 0 && <span className="label-mono ml-2 text-[11px]">{total.toLocaleString("pt-BR")} produtos no radar</span>}
      </p>

      <form className="mt-5 flex flex-wrap gap-2" action="/ofertas">
        <label htmlFor="offers-search" className="sr-only">Buscar produto</label>
        <Input id="offers-search" name="busca" type="search" maxLength={80} defaultValue={busca} placeholder="Buscar produto…" className="min-w-0 flex-1" />
        <input type="hidden" name="categoria" value={categoria} />
        {loja && <input type="hidden" name="loja" value={loja} />}
        <Button>Buscar</Button>
      </form>

      <CategoriaFiltro baseHref="/ofertas" ativo={categoria} />
      <BarraLojas baseHref="/ofertas" ativa={loja}
        params={{ categoria: categoria !== "all" ? categoria : undefined, busca: busca || undefined }} />

      {produtos.length ? (
        <>
          <GridProdutos produtos={produtos} />
          <Paginacao pagina={pagina} total={total} porPagina={POR_PAGINA} baseHref="/ofertas"
            params={{ categoria: categoria !== "all" ? categoria : undefined, busca: busca || undefined, loja: loja || undefined }} />
        </>
      ) : (
        <EmptyState className="mt-8" icon="🔍" title={available ? "Nenhuma oferta neste filtro" : "Não foi possível carregar as ofertas"}
          hint={available ? "Tente outra categoria, limpe a busca, ou aguarde a próxima coleta automática." : "A consulta está temporariamente indisponível. Tente novamente em alguns instantes."}
          action={<Link href="/ofertas"><Button variant="outline" size="sm">Limpar filtros</Button></Link>} />
      )}
    </main>
  );
}
