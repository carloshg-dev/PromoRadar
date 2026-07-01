import { listarOfertasPaginado } from "@/infrastructure/repositories/produtos.repo";
import { VitrineComFiltroLoja } from "@/components/vitrine/filtro-lojas";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";
import { Paginacao } from "@/components/ui/paginacao";
import { CategoriaFiltro } from "@/components/layout/categoria-filtro";
import { TrackView } from "@/components/analytics/track-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const POR_PAGINA = 60;

export const metadata = { title: "Melhores ofertas" };
export const revalidate = 120;

export default async function Ofertas({ searchParams }: { searchParams: { categoria?: string; busca?: string; pagina?: string } }) {
  const categoria = searchParams.categoria ?? "all";
  const busca = searchParams.busca ?? "";
  const pagina = Math.max(1, Number(searchParams.pagina) || 1);
  let produtos: Awaited<ReturnType<typeof listarOfertasPaginado>>["produtos"] = [];
  let total = 0;
  try {
    ({ produtos, total } = await listarOfertasPaginado({ categoria, busca, limit: POR_PAGINA, pagina }));
  } catch { produtos = []; }

  return (
    <main className="mx-auto max-w-page px-4 py-6 sm:px-6 lg:px-10">
      {busca && <TrackView tipo="busca" termo={busca} origem="ofertas" />}
      <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Ofertas" }]} />
      <h1 className="mt-3 text-2xl font-bold">Melhores ofertas</h1>
      <p className="mt-1 text-sm text-muted">
        Comparadas em tempo real — o preço que importa, não a vitrine.
        {total > 0 && <span className="label-mono ml-2 text-[11px]">{total.toLocaleString("pt-BR")} produtos no radar</span>}
      </p>

      <form className="mt-5 flex flex-wrap gap-2" action="/ofertas">
        <Input name="busca" defaultValue={busca} placeholder="Buscar produto…" className="min-w-[220px] flex-1" />
        <input type="hidden" name="categoria" value={categoria} />
        <Button>Buscar</Button>
      </form>

      <CategoriaFiltro baseHref="/ofertas" ativo={categoria} />

      {produtos.length ? (
        <>
          <VitrineComFiltroLoja produtos={produtos} />
          <Paginacao pagina={pagina} total={total} porPagina={POR_PAGINA} baseHref="/ofertas"
            params={{ categoria: categoria !== "all" ? categoria : undefined, busca: busca || undefined }} />
        </>
      ) : (
        <EmptyState className="mt-8" icon="🔍" title="Nenhuma oferta neste filtro"
          hint="Tente outra categoria, limpe a busca, ou aguarde a próxima coleta automática."
          action={<Link href="/ofertas"><Button variant="outline" size="sm">Limpar filtros</Button></Link>} />
      )}
    </main>
  );
}
