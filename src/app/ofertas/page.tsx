import { paginaOfertasPublica as listarOfertasPaginado, alternativasDaLojaPublica } from "@/services/public-catalog-cache";
import { GridProdutos } from "@/components/vitrine/grid-produtos";
import { BarraLojas } from "@/components/vitrine/barra-lojas";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";
import { Paginacao } from "@/components/ui/paginacao";
import { CategoriaFiltro } from "@/components/layout/categoria-filtro";
import { CatalogFilters } from "@/components/catalog-filters";
import { TrackView } from "@/components/analytics/track-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { pageNumber, searchTerm } from "@/core/search";
import { MAX_PRICE_AGE_DAYS } from "@/core/offer-freshness";
import { Search } from "lucide-react";
import { TODAS_CATEGORIAS } from "@/lib/navigation";
import { catalogPriceLimit } from "@/core/catalog-policy";
import { CatalogPriceFilter } from "@/components/catalog-price-filter";
import { shopCollection } from "@/core/shop-collections";
import { listarLojasVitrine } from "@/infrastructure/repositories/lojas.repo";
import { StoreCatalogRecovery } from "@/components/store-catalog-recovery";

const POR_PAGINA = 60;

export const metadata = { title: "Melhores ofertas", alternates: { canonical: "/ofertas" }, description: "Encontre ofertas por produto, categoria e loja. Consulte o histórico disponível antes de comprar." };
export const revalidate = 3600;

export default async function Ofertas({ searchParams }: { searchParams: { categoria?: string; busca?: string; pagina?: string; loja?: string; ate?: string; colecao?: string } }) {
  const categoria = searchParams.categoria ?? "all";
  const busca = searchTerm(searchParams.busca);
  const loja = searchParams.loja ?? "";
  const pagina = pageNumber(searchParams.pagina);
  const maxPreco = catalogPriceLimit(searchParams.ate);
  const ate = maxPreco === null ? "todos" : String(maxPreco);
  const colecao = shopCollection(searchParams.colecao);
  const selection = `${TODAS_CATEGORIAS.find(item => item.slug === categoria)?.nome ?? "Todas as categorias"} · ${loja ? loja.replace(/-/g, " ").slice(0, 60) : "Todas as lojas"}`;
  let produtos: Awaited<ReturnType<typeof listarOfertasPaginado>>["produtos"] = [];
  let total: number | null = 0;
  let hasMore = false;
  let available = true;
  const [catalog, storeList] = await Promise.allSettled([
    listarOfertasPaginado({ categoria, busca, loja: loja || undefined, limit: POR_PAGINA, pagina, maxPreco, colecao: colecao?.id }),
    listarLojasVitrine(),
  ]);
  if (catalog.status === "fulfilled") ({ produtos, total, hasMore = false } = catalog.value);
  else available = false;
  const lojas = storeList.status === "fulfilled" ? storeList.value : [];
  const lojaSelecionada = lojas.find(item => item.slug === loja);
  let alternativas: Awaited<ReturnType<typeof alternativasDaLojaPublica>> | null = null;
  if (!produtos.length && lojaSelecionada && pagina === 1) {
    try { alternativas = await alternativasDaLojaPublica(lojaSelecionada.slug, maxPreco); if (!alternativas.produtos.length && alternativas.partial) available = false; }
    catch { available = false; }
  }

  return (
    <main data-public-cache={available && !alternativas?.partial ? "ready" : "unavailable"} className="mx-auto max-w-page px-4 py-6 sm:px-6 lg:px-10">
      {busca && <TrackView tipo="busca" termo={busca} origem="ofertas" />}
      {available && busca && produtos.length === 0 && <TrackView tipo="busca_sem_resultado" termo={busca} origem="ofertas" />}
      <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Ofertas", ...(lojaSelecionada ? { href: "/ofertas" } : {}) }, ...(lojaSelecionada ? [{ label: lojaSelecionada.nome }] : [])]} />
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{colecao?.label ?? (lojaSelecionada ? `Ofertas da ${lojaSelecionada.nome}` : "Encontre a sua próxima oferta.")}</h1>
      <p className="mt-1 text-sm text-muted">
        Preços coletados nos últimos {MAX_PRICE_AGE_DAYS} dias. Confira o valor final e a disponibilidade na loja.
        {total !== null && total > 0 && <span className="label-mono ml-2 text-[11px]">{total.toLocaleString("pt-BR")} produtos no radar</span>}
      </p>

      <form className="mt-5 flex flex-wrap gap-2" action="/ofertas">
        <label htmlFor="offers-search" className="sr-only">Buscar produto</label>
        <Input id="offers-search" name="busca" type="search" maxLength={80} defaultValue={busca} placeholder="Buscar produto…" className="min-w-0 basis-full text-base sm:flex-1 sm:basis-auto" />
        <input type="hidden" name="categoria" value={categoria} />
        {colecao && <input type="hidden" name="colecao" value={colecao.id} />}
        {loja && <input type="hidden" name="loja" value={loja} />}
        <CatalogPriceFilter value={maxPreco} id="offers-price-limit" />
        <Button>Buscar</Button>
      </form>

      <CatalogFilters selection={selection}>
        <CategoriaFiltro baseHref="/ofertas" ativo={categoria} params={{ busca: busca || undefined, loja: loja || undefined, ate, colecao: colecao?.id }} />
        <BarraLojas baseHref="/ofertas" ativa={loja}
          lojas={lojas}
          params={{ categoria: categoria !== "all" ? categoria : undefined, busca: busca || undefined, ate, colecao: colecao?.id }} />
      </CatalogFilters>

      {produtos.length ? (
        <>
          <GridProdutos produtos={produtos} />
          <Paginacao pagina={pagina} total={total} hasMore={hasMore} porPagina={POR_PAGINA} baseHref="/ofertas"
            params={{ categoria: categoria !== "all" ? categoria : undefined, busca: busca || undefined, loja: loja || undefined, ate, colecao: colecao?.id }} />
        </>
      ) : alternativas?.produtos.length && lojaSelecionada ? (
        <StoreCatalogRecovery nome={lojaSelecionada.nome} available={available} produtos={alternativas.produtos} mesmaLoja={alternativas.mesmaLoja} maxPrice={maxPreco} />
      ) : (
        <EmptyState className="mt-8" icon={<Search className="h-6 w-6 text-brand" />} title={available ? "Nenhuma oferta neste filtro" : "Não foi possível carregar as ofertas"}
          hint={available ? "Tente outra categoria, limpe a busca, ou aguarde a próxima coleta automática." : "A consulta está temporariamente indisponível. Tente novamente em alguns instantes."}
          action={<div className="flex flex-wrap justify-center gap-3"><Link href="/ofertas" prefetch={false}><Button variant="outline" size="sm">Explorar outras ofertas</Button></Link><Link href="/cupons" prefetch={false}><Button variant="outline" size="sm">Ver cupons</Button></Link></div>} />
      )}
    </main>
  );
}
