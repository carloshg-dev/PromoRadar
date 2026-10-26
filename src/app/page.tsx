import Link from "next/link";
import { DiscoverySearch } from "@/components/discovery-search";
import { HomeSpotlight } from "@/components/home-spotlight";
import { ProductShelf } from "@/components/product-shelf";
import { CupomCard } from "@/components/cupom-card";
import { VERTICAIS } from "@/lib/navigation";
import { temaSazonal } from "@/lib/seasonal";
import { decodeHtmlEntities } from "@/lib/utils";
import { SavedRadar } from "@/components/saved-radar";
import { criarLeituraVitrine, listarOfertas, listarNoticias, ofertasEmDestaque, listarAfiliados, listarAfiliadosRodizio, listarVitrinePorLoja, achadosPorCategorias, achadosBelezaCarrossel } from "@/infrastructure/repositories/produtos.repo";
import type { Produto } from "@/core/domain/types";
import type { Comparacao, ProdutoRodizio } from "@/infrastructure/repositories/produtos.repo";
import { cuponsCurados } from "@/lib/cupons-curados";
import { BarraLojas } from "@/components/vitrine/barra-lojas";
import { LOJAS_SOMENTE_COMPARADOR, permitidoNaHome, validarDisponibilidadeHome } from "@/core/home-catalog";
import { Search, ArrowUpRight, Clock3, Scale, ChartNoAxesCombined } from "lucide-react";

export const revalidate = 7200;
export const metadata = { alternates: { canonical: "/" } };

function filtrarParaHome<T extends Produto>(produtos: T[]): T[] {
  return produtos.filter((produto) => permitidoNaHome(produto));
}

function comparacaoPermitidaNaHome(comparacao: Comparacao | null): Comparacao | null {
  if (!comparacao) return null;
  const ofertas = comparacao.ofertas
    .filter((produto) => permitidoNaHome(produto))
    .sort((a, b) => (a.precoAtual ?? Number.POSITIVE_INFINITY) - (b.precoAtual ?? Number.POSITIVE_INFINITY));
  if (ofertas.length < 2) return null;

  const precos = ofertas
    .map((oferta) => oferta.precoAtual)
    .filter((preco): preco is number => preco !== null);
  if (precos.length < 2) return null;

  const menorPreco = Math.min(...precos);
  const maiorPreco = Math.max(...precos);
  const economia = Math.max(0, maiorPreco - menorPreco);
  const scores = ofertas
    .map((oferta) => oferta.promoScore)
    .filter((score): score is number => score !== null);

  return {
    ...comparacao,
    ofertas,
    lojas: ofertas.length,
    menorPreco,
    maiorPreco,
    economia,
    economiaPct: maiorPreco > 0 ? (economia / maiorPreco) * 100 : 0,
    melhorScore: scores.length ? Math.max(...scores) : null,
  };
}

function cupomPermitidoNaHome(cupom: { marca: string }): boolean {
  const marca = cupom.marca
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return !["kabum", "terabyte", "epocacosmeticos"].some((loja) => marca.includes(loja));
}

function produtosUnicos(...listas: Produto[][]): Produto[] {
  const vistos = new Set<string>();
  return listas.flat().filter((produto) => {
    if (!permitidoNaHome(produto)) return false;
    if (vistos.has(produto.id)) return false;
    vistos.add(produto.id);
    return produto.emEstoque && Boolean(produto.imagemUrl) && produto.precoAtual !== null;
  });
}

export default async function Home() {
  const leitura = criarLeituraVitrine();
  let falhasOfertas = 0;
  async function carregarComPrazo<T>(carregar: () => Promise<T>, fallback: T): Promise<T> {
    try { return await carregar(); }
    catch (error) {
      falhasOfertas++;
      const code = (error as { code?: unknown } | null)?.code;
      console.warn("[home] source_unavailable", typeof code === "string" && /^[A-Z0-9_]{1,16}$/.test(code) ? code : leitura.signal.aborted ? "deadline" : "read_failed");
      return fallback;
    }
  }
  // As fontes da Home são independentes. Carregá-las em paralelo evita somar a
  // latência de cada parceiro; o prazo preserva uma página funcional mesmo se
  // uma integração estiver lenta. O resultado completo é persistido no ISR/R2.
  const [
    afiliados,
    produtosRodizio,
    carrosselBeleza,
    ofertasMonitoradas,
    ofertasMercadoLivre,
    destaques,
    itensDestaque,
    beleza,
    perfumes,
    gadgets,
    fit,
    todasNoticias,
  ] = await Promise.all([
    carregarComPrazo<Produto[]>(() => listarAfiliados(70, leitura), []),
    carregarComPrazo<ProdutoRodizio[]>(() => listarAfiliadosRodizio(9, 12, leitura), []),
    carregarComPrazo<Produto[]>(() => achadosBelezaCarrossel(40, leitura), []),
    carregarComPrazo<Produto[]>(() => listarVitrinePorLoja("carrefour", 40, leitura), []),
    carregarComPrazo<Produto[]>(() => listarVitrinePorLoja("mercadolivre", 64, leitura), []),
    carregarComPrazo<Produto[]>(() => listarOfertas({ limit: 48 }, leitura), []),
    carregarComPrazo<Awaited<ReturnType<typeof ofertasEmDestaque>>>(() => ofertasEmDestaque(8, leitura), []),
    carregarComPrazo<Produto[]>(() => achadosPorCategorias(["maquiagem", "skincare", "cabelos"], 12, leitura), []),
    carregarComPrazo<Produto[]>(() => achadosPorCategorias(["perfumes-importados", "perfumes-arabes"], 12, leitura), []),
    carregarComPrazo<Produto[]>(() => achadosPorCategorias(["fones-bluetooth", "smartwatch", "caixa-de-som", "power-bank", "webcam-acao"], 12, leitura), []),
    carregarComPrazo<Produto[]>(() => achadosPorCategorias(["whey-protein", "creatina", "pre-treino", "fit-outros"], 12, leitura), []),
    listarNoticias(20, leitura).catch(() => []),
  ]);

  const afiliadosHome = filtrarParaHome(afiliados);
  const produtosRodizioHome = filtrarParaHome(produtosRodizio);
  const carrosselBelezaHome = filtrarParaHome(carrosselBeleza);
  const belezaHome = filtrarParaHome(beleza);
  const perfumesHome = filtrarParaHome(perfumes);
  const gadgetsHome = filtrarParaHome(gadgets);
  const fitHome = filtrarParaHome(fit);
  const itensDestaqueHome = itensDestaque
    .filter(({ produto }) => permitidoNaHome(produto))
    .map((item) => ({
      ...item,
      comparacao: comparacaoPermitidaNaHome(item.comparacao),
    }));
  // A API completa da Lomadee pertence a /cupons. Mantemos a Home isolada de
  // limites externos para preservar LCP e evitar duas coletas concorrentes no build.
  const cuponsDestaque = cuponsCurados().filter(cupomPermitidoNaHome);
  const noticias = [...todasNoticias]
    .sort((a, b) => (b.imagem_url ? 1 : 0) - (a.imagem_url ? 1 : 0))
    .slice(0, 7);
  // Se a consulta geral perder o prazo, a Home ainda possui vários pools reais
  // vindos do mesmo catálogo. Reaproveitá-los evita declarar falsamente que a
  // primeira coleta não ocorreu e mantém a vitrine funcional.
  const ofertasMonitoradasHome = filtrarParaHome(ofertasMonitoradas);
  const ofertasMercadoLivreHome = filtrarParaHome(ofertasMercadoLivre);
  const ofertasMonitoradasVisiveis = ofertasMonitoradasHome.length
    ? ofertasMonitoradasHome
    : afiliadosHome.filter((produto) => produto.lojaSlug === "carrefour");
  const ofertasMercadoLivreVisiveis = ofertasMercadoLivreHome.length
    ? ofertasMercadoLivreHome
    : afiliadosHome.filter((produto) => produto.lojaSlug === "mercadolivre");
  const destaquesPermitidos = filtrarParaHome(destaques);
  validarDisponibilidadeHome([
    afiliadosHome, produtosRodizioHome, carrosselBelezaHome, ofertasMonitoradasHome,
    ofertasMercadoLivreHome, destaquesPermitidos, itensDestaqueHome.map((item) => item.produto),
    belezaHome, perfumesHome, gadgetsHome, fitHome,
  ], falhasOfertas);
  const destaquesVisiveis = destaquesPermitidos.length
    ? destaquesPermitidos
    : produtosUnicos(
      afiliadosHome,
      ofertasMonitoradasVisiveis,
      ofertasMercadoLivreVisiveis,
      carrosselBelezaHome,
      belezaHome,
      perfumesHome,
      gadgetsHome,
      fitHome,
    ).slice(0, 48);

  const spotlight = itensDestaqueHome.find(item => item.comparacao) ?? itensDestaqueHome[0];
  const heroProduct = spotlight?.produto ?? gadgetsHome[0] ?? afiliadosHome[0] ?? destaquesVisiveis[0];
  const tema = temaSazonal();

  return (
    <main className="mx-auto max-w-page px-4 sm:px-6 lg:px-10">
      <DiscoverySearch><HomeSpotlight produto={heroProduct} comparacao={spotlight?.comparacao} /></DiscoverySearch>
      <nav aria-label="Explorar categorias" className="flex gap-3 overflow-x-auto border-y border-line py-3 sm:justify-between">
        {VERTICAIS.map(vertical => {
          const Icon = vertical.categorias[0]?.Icon ?? Search;
          return <Link prefetch={false} key={vertical.slug} href={vertical.href} className="route-link flex min-h-14 shrink-0 items-center gap-2.5 rounded-lg px-3 text-sm font-medium"><Icon className={`h-5 w-5 ${vertical.accent.text}`} aria-hidden="true" />{vertical.label}<ArrowUpRight className="h-3.5 w-3.5 text-muted" aria-hidden="true" /></Link>;
        })}
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-3 py-5 text-xs leading-5 text-muted">
        <p className="flex max-w-[80ch] items-start gap-2"><Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span>Seleção de coletas dos últimos 7 dias. Atualizada em <time dateTime={new Date(leitura.agora).toISOString()}>{new Date(leitura.agora).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</time> (Brasília). Confira o preço final na loja.</span></p>
        {tema && <Link prefetch={false} href={tema.cta.href} className="inline-flex min-h-8 items-center gap-1 text-brand hover:underline">{tema.selo} no radar<ArrowUpRight className="h-3.5 w-3.5" /></Link>}
      </div>
      <BarraLojas baseHref="/ofertas" excluir={[...LOJAS_SOMENTE_COMPARADOR]} />

      <ProductShelf title="Achados para a sua próxima compra" description="Uma seleção do catálogo para explorar. Abra o produto para conferir detalhes, histórico e data da coleta." href="/ofertas" products={produtosUnicos(afiliadosHome, destaquesVisiveis)} limit={8} />

      <section className="my-5 grid gap-7 rounded-2xl bg-lime p-6 sm:p-9 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div><h2 className="max-w-[22ch] font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Outras lojas.<br />Mais informação. Sua escolha.</h2><p className="mt-4 max-w-[52ch] text-sm leading-6 text-brand">Compare os preços coletados e confira modelo, capacidade e condições de cada oferta antes de escolher.</p></div>
        <div className="flex flex-col items-start gap-5 lg:items-end"><div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-brand"><span className="inline-flex items-center gap-2"><Scale className="h-4 w-4" />Comparação por classe</span><span className="inline-flex items-center gap-2"><ChartNoAxesCombined className="h-4 w-4" />Histórico disponível</span></div><Link prefetch={false} href="/comparar" className="inline-flex min-h-12 items-center gap-3 rounded-lg bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-2">Encontrar e comparar<ArrowUpRight className="h-4 w-4" /></Link></div>
      </section>

      <ProductShelf title="Beleza e cuidados, no seu ritmo" description="Maquiagem, skincare e cuidados para a rotina. A escolha começa por informação." href="/categoria/maquiagem" products={produtosUnicos(belezaHome, carrosselBelezaHome)} />
      <ProductShelf title="Perfumes para descobrir" description="Explore as fragrâncias disponíveis e confira as condições de cada loja." href="/categoria/perfumes-importados" products={perfumesHome} />
      <section className="home-shelf border-y border-line"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Um cupom também faz diferença.</h2><Link prefetch={false} href="/cupons" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-brand hover:underline">Explorar cupons<ArrowUpRight className="h-4 w-4" /></Link></div><div className="grid gap-4 md:grid-cols-3">{cuponsDestaque.slice(0, 3).map(cupom => <CupomCard key={cupom.id} cupom={cupom} />)}</div></section>
      <ProductShelf title="Tecnologia para o dia a dia" description="Fones, smartwatches e outros gadgets em uma seleção de ofertas recentes." href="/categoria/fones-bluetooth" products={gadgetsHome} />
      <ProductShelf title="Para acompanhar a sua rotina" description="Suplementos e achados do Mundo Fit. Veja detalhes e informações na loja." href="/categoria/whey-protein" products={fitHome} />
      <ProductShelf title="No catálogo do Mercado Livre" description="Ofertas coletadas do parceiro, com acesso aos detalhes e ao histórico disponível." href="/ofertas?loja=mercadolivre" products={ofertasMercadoLivreVisiveis} />
      <ProductShelf title="Casa e outras descobertas" description="Uma seleção do catálogo Carrefour para continuar explorando." href="/ofertas?loja=carrefour" products={ofertasMonitoradasVisiveis} />
      <SavedRadar />
      {noticias.length > 0 && <section className="home-shelf"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Além das ofertas</h2><Link prefetch={false} href="/noticias" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-brand">Ver notícias<ArrowUpRight className="h-4 w-4" /></Link></div><div className="grid gap-x-8 md:grid-cols-3">{noticias.slice(0, 3).map(noticia => <a key={noticia.id} href={noticia.url} target="_blank" rel="noopener noreferrer" className="group border-t border-line py-5"><p className="text-xs text-muted">{noticia.fonte}</p><h3 className="mt-3 text-base font-medium leading-6 group-hover:text-brand">{decodeHtmlEntities(noticia.titulo)}</h3><span className="mt-4 inline-flex min-h-11 items-center gap-1 text-xs font-medium text-brand">Ler na fonte<ArrowUpRight className="h-3.5 w-3.5" /></span></a>)}</div></section>}
    </main>
  );
}
