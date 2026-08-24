import Link from "next/link";
import { listarOfertas, listarNoticias, ofertasEmDestaque, listarAfiliados, listarAfiliadosRodizio, listarVitrinePorLoja, achadosPorCategorias, achadosBelezaCarrossel } from "@/infrastructure/repositories/produtos.repo";
import type { Produto } from "@/core/domain/types";
import type { Comparacao, ProdutoRodizio } from "@/infrastructure/repositories/produtos.repo";
import { NewsCarousel } from "@/components/news-carousel";
import { FeaturedDealRotator } from "@/components/featured-deal-rotator";
import { ParceirosFeed } from "@/components/parceiros-feed";
import { CuponsCarrossel } from "@/components/cupons-carrossel";
import { SeasonalHomeHero } from "@/components/seasonal-home-hero";
import { cuponsCurados } from "@/lib/cupons-curados";
import { OfertasVerificadas } from "@/components/ofertas-verificadas";
import { OfertasMercadoLivre } from "@/components/ofertas-mercadolivre";
import { VitrineVertical } from "@/components/vitrine-vertical";
import { DestaquesGrid } from "@/components/destaques-grid";
import { BarraLojas } from "@/components/vitrine/barra-lojas";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { ehLinkMonetizado } from "@/lib/afiliados";
import {
  Sparkles, Search, ArrowRight, Dumbbell,
  Palette, SprayCan, Headphones,
} from "lucide-react";

export const revalidate = 7200;

const HOME_DATA_TIMEOUT_MS = 8_000;
const LOJAS_SOMENTE_COMPARADOR = new Set([
  "kabum",
  "terabyteshop",
  "epocacosmeticos",
]);

function permitidoNaHome(produto: Produto): boolean {
  const imagem = produto.imagemUrl?.toLowerCase() ?? "";
  const placeholder = /(?:no[-_]?image|placeholder|sem[-_]?imagem|image[-_]?not[-_]?found)/.test(imagem);
  return !LOJAS_SOMENTE_COMPARADOR.has(produto.lojaSlug)
    && produto.emEstoque
    && produto.precoAtual !== null
    && Boolean(imagem)
    && !placeholder;
}

function filtrarParaHome<T extends Produto>(produtos: T[]): T[] {
  return produtos.filter(permitidoNaHome);
}

function comparacaoPermitidaNaHome(comparacao: Comparacao | null): Comparacao | null {
  if (!comparacao) return null;
  const ofertas = comparacao.ofertas
    .filter(permitidoNaHome)
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

async function carregarComPrazo<T>(
  carregar: () => Promise<T>,
  fallback: T,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    const prazo = new Promise<T>((resolve) => {
      timeout = setTimeout(() => resolve(fallback), HOME_DATA_TIMEOUT_MS);
    });

    return await Promise.race([carregar(), prazo]);
  } catch {
    return fallback;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export default async function Home() {
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
    carregarComPrazo<Produto[]>(() => listarAfiliados(70), []),
    carregarComPrazo<ProdutoRodizio[]>(() => listarAfiliadosRodizio(9), []),
    carregarComPrazo<Produto[]>(() => achadosBelezaCarrossel(40), []),
    carregarComPrazo<Produto[]>(() => listarVitrinePorLoja("carrefour", 40), []),
    carregarComPrazo<Produto[]>(() => listarVitrinePorLoja("mercadolivre", 64), []),
    carregarComPrazo<Produto[]>(() => listarOfertas({ limit: 48 }), []),
    carregarComPrazo<Awaited<ReturnType<typeof ofertasEmDestaque>>>(() => ofertasEmDestaque(8), []),
    carregarComPrazo<Produto[]>(() => achadosPorCategorias(["maquiagem", "skincare", "cabelos"], 12), []),
    carregarComPrazo<Produto[]>(() => achadosPorCategorias(["perfumes-importados", "perfumes-arabes"], 12), []),
    carregarComPrazo<Produto[]>(() => achadosPorCategorias(["fones-bluetooth", "smartwatch", "caixa-de-som", "power-bank", "webcam-acao"], 12), []),
    carregarComPrazo<Produto[]>(() => achadosPorCategorias(["whey-protein", "creatina", "pre-treino", "fit-outros"], 12), []),
    carregarComPrazo<Awaited<ReturnType<typeof listarNoticias>>>(() => listarNoticias(20), []),
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
  const destaquesPermitidos = destaques.filter(permitidoNaHome);
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

  return (
    <main className="mx-auto max-w-page px-4 sm:px-6 lg:px-10">
      {/* LOJAS PARCEIRAS — primeiro elemento visível na home.
          Quem chega pelo Instagram (Shopee, Amazon…) vê a logo de cara
          e confirma que está no lugar certo. */}
      <BarraLojas baseHref="/ofertas" excluir={[...LOJAS_SOMENTE_COMPARADOR]} />

      {/* FEED DE PARCEIROS (topo) — produtos de afiliado, esteira automática.
          Pool 150 → embaralha e exibe 15 por F5 (vitrine viva). */}
      <ParceirosFeed produtos={afiliadosHome} exibir={15} />

      {/* BELEZA & PERFUMES — 2º carrossel logo ABAIXO, sentido REVERSO (movimento
          cruzado): perfumes importados/árabes + skincare/cabelos/maquiagem */}
      <ParceirosFeed produtos={carrosselBelezaHome} exibir={15} direcao="reverso" variante="beleza"
        titulo="Beleza & Perfumes" verTudoHref="/categoria/perfumes-importados"
        subtitulo="Perfumes importados, skincare e cuidados do rosto e corpo — rodando sem parar." />

      {/* CUPONS EM DESTAQUE — carrossel enxuto logo abaixo do de produtos */}
      <CuponsCarrossel cupons={cuponsDestaque} />

      <SeasonalHomeHero produtosRodizio={produtosRodizioHome} />

      {/* HERO — comparador (Oferta em Destaque) na 1ª dobra, logo abaixo do feed */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[800px] -translate-x-1/2 rounded-full bg-brand/15 blur-[130px]" />
        <div className="relative grid items-center gap-10 py-10 lg:grid-cols-[1.05fr_.95fr] lg:py-14">
          <div className="order-2 min-w-0 animate-fade-up lg:order-1">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-bg-soft/60 px-3 py-1 text-xs text-muted">
              <Sparkles className="h-3.5 w-3.5 text-brand-2" /> Inteligência de promoções · comparação em tempo real
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              <span className="gradient-text">A oportunidade</span><br />antes do mercado.
            </h1>
            <p className="mt-5 max-w-md text-base text-muted">
              Monitoramos preços reais em tecnologia, eletro, ferramentas, suplementos, gadgets, perfumes e beleza,
              detectamos descontos falsos e comparamos entre lojas com histórico de preço. Você compra no momento
              certo — com dados, não com vitrine.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/ofertas"><Button size="lg">Ver melhores ofertas <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link href="/comparar"><Button variant="outline" size="lg">Comparar entre lojas</Button></Link>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-muted">
              <Search className="h-3.5 w-3.5" /> Busque qualquer produto com <Kbd>Ctrl</Kbd><Kbd>K</Kbd>
            </div>
          </div>

          {/* OFERTA EM DESTAQUE (real, em loop) — no mobile vem ANTES do texto */}
          <div className="order-1 min-w-0 lg:order-2">
            {itensDestaqueHome.length ? <FeaturedDealRotator itens={itensDestaqueHome} /> : (
            <div className="ring-glow card-grad animate-fade-up rounded-3xl border border-line p-5 [animation-delay:.1s]">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Exemplo ilustrativo</div>
                <span className="rounded-md bg-bg-soft px-1.5 py-0.5 text-[10px] text-muted">demonstração</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-bg-soft/60 p-4">
                <div>
                  <div className="text-xs text-muted">Preço atual</div>
                  <div className="font-display text-3xl font-extrabold text-emerald-400">R$ 3.499</div>
                  <div className="text-[11px] text-emerald-300/80">38% abaixo da média</div>
                </div>
                <span className="rounded-xl bg-emerald-500/15 px-3 py-2 text-lg font-black text-emerald-300">−36%</span>
              </div>
              <div className="mt-4 flex h-24 items-end gap-1.5">
                {[60,72,55,80,68,90,40,52,38,30,44,28].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-brand/30 to-cyan"
                    style={{ height: `${h}%`, opacity: i > 7 ? 1 : .5 }} />
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[["Mínimo","R$ 3.4k","text-emerald-400"],["Médio","R$ 5.6k",""],["Máximo","R$ 6.9k","text-rose-400"]].map(([l,v,c]) => (
                  <div key={l} className="rounded-lg bg-bg-soft/60 py-2">
                    <div className="text-[10px] text-muted">{l}</div>
                    <div className={`text-xs font-semibold ${c}`}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>
        </div>
      </section>

      {/* OFERTAS MONITORADAS — amostra rotativa do catálogo Carrefour coletado. */}
      <OfertasVerificadas produtos={ofertasMonitoradasVisiveis} />

      {/* MERCADO LIVRE — amostra rotativa do catálogo coletado, com tracking interno. */}
      <OfertasMercadoLivre produtos={ofertasMercadoLivreVisiveis} />

      {/* VITRINES EM DESTAQUE — Beleza, Perfumes, Gadgets (impacto imediato) */}
      <VitrineVertical titulo="Beleza & Cosméticos" Icon={Palette} accentText="text-fit" accentGrad="from-fit to-warn"
        href="/categoria/maquiagem" hrefLabel="ver beleza" produtos={belezaHome} />
      <VitrineVertical titulo="Perfumes" Icon={SprayCan} accentText="text-parfum-2" accentGrad="from-parfum to-fit"
        href="/categoria/perfumes-importados" hrefLabel="ver perfumes" produtos={perfumesHome} />
      <VitrineVertical titulo="Gadgets" Icon={Headphones} accentText="text-gadget-2" accentGrad="from-gadget to-cyan"
        href="/categoria/fones-bluetooth" hrefLabel="ver gadgets" produtos={gadgetsHome} />

      {/* DESTAQUES — melhores ofertas do momento, mantidas abaixo do feed */}
      <section className="pb-16">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
            <Sparkles className="h-4 w-4 text-brand-2" /> Destaques de hoje
          </h2>
          <Link href="/ofertas" className="text-xs text-brand-2 hover:underline">ver todas →</Link>
        </div>
        {destaquesVisiveis.length ? (
          <DestaquesGrid pool={destaquesVisiveis} exibir={12} />
        ) : (
          <EmptyState icon="🛰️" title="Coleta em preparação"
            hint="As ofertas aparecem aqui assim que a primeira coleta rodar. Enquanto isso, explore as categorias pelo menu superior."
            action={<Link href="/ofertas"><Button variant="outline" size="sm">Ir para ofertas</Button></Link>} />
        )}
      </section>

      {/* MUNDO FIT (vertical suplementos — acento coral) */}
      {fitHome.length > 0 && (
        <VitrineVertical titulo="Mundo Fit — suplementos" Icon={Dumbbell} accentText="text-fit" accentGrad="from-fit to-warn"
          href="/categoria/whey-protein" hrefLabel="ver mais" produtos={fitHome} />
      )}

      {/* NOTÍCIAS (agora no rodapé, mais discretas) */}
      {noticias.length > 0 && (
        <section className="pb-20">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">Notícias de tecnologia</h2>
          <NewsCarousel items={noticias} />
        </section>
      )}
    </main>
  );
}
