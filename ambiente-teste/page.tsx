import Link from "next/link";
import { listarOfertas, listarNoticias, ofertaDestaque, listarAfiliados, listarAfiliadosRodizio } from "@/infrastructure/repositories/produtos.repo";
import type { Produto } from "@/core/domain/types";
import type { ProdutoRodizio } from "@/infrastructure/repositories/produtos.repo";
import { ProdutoCard } from "@/components/produto-card";
import { NewsCarousel } from "@/components/news-carousel";
import { FeaturedDeal } from "@/components/featured-deal";
import { ParceirosFeed } from "@/components/parceiros-feed";
import { SeasonalHomeHero } from "@/components/seasonal-home-hero";
import { OfertasVerificadas } from "@/components/ofertas-verificadas";
import { VitrineVertical } from "@/components/vitrine-vertical";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { ScoreRing } from "@/components/score-ring";
import {
  Sparkles, Search, ArrowRight, Dumbbell,
  Palette, SprayCan, Headphones,
} from "lucide-react";

export const revalidate = 300;

/** Junta as melhores ofertas de várias categorias (p/ as vitrines por vertical). */
function melhores(listas: Produto[][], n = 5): Produto[] {
  return listas.flat().sort((a, b) => (b.promoScore ?? 0) - (a.promoScore ?? 0)).slice(0, n);
}

export default async function Home() {
  // Feed de AFILIADOS (topo) — só o que monetiza (Amazon + Lomadee), aleatório.
  let afiliados: Produto[] = [];
  try { afiliados = await listarAfiliados(20); } catch {}

  let produtosRodizio: ProdutoRodizio[] = [];
  try { produtosRodizio = await listarAfiliadosRodizio(9); } catch {}

  // Top ofertas por PromoScore (sem piso: nas 1as coletas o histórico é curto).
  let destaques: Produto[] = [];
  try { destaques = await listarOfertas({ limit: 12 }); } catch {}

  // Oferta em destaque (card com gráfico real) — a melhor comparação do momento.
  let destaque: Awaited<ReturnType<typeof ofertaDestaque>> = null;
  try { destaque = await ofertaDestaque(); } catch {}

  // Vitrines em destaque — Beleza, Perfumes e Gadgets (o público é impactado ao entrar).
  let beleza: Produto[] = [], perfumes: Produto[] = [], gadgets: Produto[] = [], fit: Produto[] = [];
  try {
    const [bel, perf, gad, ft] = await Promise.all([
      Promise.all(["maquiagem", "skincare", "cabelos"].map((c) => listarOfertas({ categoria: c, limit: 5 }))),
      Promise.all(["perfumes-importados", "perfumes-arabes"].map((c) => listarOfertas({ categoria: c, limit: 6 }))),
      Promise.all(["fones-bluetooth", "smartwatch", "caixa-de-som", "power-bank", "webcam-acao"].map((c) => listarOfertas({ categoria: c, limit: 3 }))),
      Promise.all(["whey-protein", "creatina", "pre-treino"].map((c) => listarOfertas({ categoria: c, limit: 4 }))),
    ]);
    beleza = melhores(bel); perfumes = melhores(perf); gadgets = melhores(gad); fit = melhores(ft, 5);
  } catch {}

  // Notícias (agora mais discretas, no rodapé): prioriza as que têm imagem.
  let noticias: Awaited<ReturnType<typeof listarNoticias>> = [];
  try {
    const all = await listarNoticias(20);
    noticias = [...all].sort((a, b) => (b.imagem_url ? 1 : 0) - (a.imagem_url ? 1 : 0)).slice(0, 7);
  } catch {}

  return (
    <main className="mx-auto max-w-page px-4 sm:px-6 lg:px-10">
      {/* FEED DE PARCEIROS (topo) — produtos de afiliado, esteira automática */}
      <ParceirosFeed produtos={afiliados} />

      <SeasonalHomeHero produtosRodizio={produtosRodizio} />

      {/* HERO — comparador (Oferta em Destaque) na 1ª dobra, logo abaixo do feed */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[800px] -translate-x-1/2 rounded-full bg-brand/15 blur-[130px]" />
        <div className="relative grid items-center gap-10 py-10 lg:grid-cols-[1.05fr_.95fr] lg:py-14">
          <div className="order-2 min-w-0 animate-fade-up lg:order-1">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-bg-soft/60 px-3 py-1 text-xs text-muted">
              <Sparkles className="h-3.5 w-3.5 text-brand-2" /> Inteligência de promoções · PromoScore proprietário
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              <span className="gradient-text">A oportunidade</span><br />antes do mercado.
            </h1>
            <p className="mt-5 max-w-md text-base text-muted">
              Monitoramos preços reais em tecnologia, eletro, ferramentas, suplementos, gadgets, perfumes e beleza,
              detectamos descontos falsos e classificamos cada oferta de 0 a 100. Você compra no momento
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

          {/* OFERTA EM DESTAQUE (real, com gráfico) — no mobile vem ANTES do texto */}
          <div className="order-1 min-w-0 animate-fade-up [animation-delay:.1s] lg:order-2">
            {destaque ? <FeaturedDeal d={destaque} /> : (
            <div className="ring-glow card-grad rounded-3xl border border-line p-5">
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
                <ScoreRing score={96} size={80} showLabel={false} />
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

      {/* OFERTAS VERIFICADAS — promoções reais dos parceiros Awin (conferidas + ativas) */}
      <OfertasVerificadas />

      {/* VITRINES EM DESTAQUE — Beleza, Perfumes, Gadgets (impacto imediato) */}
      <VitrineVertical titulo="Beleza & Cosméticos" Icon={Palette} accentText="text-fit" accentGrad="from-fit to-warn"
        href="/categoria/maquiagem" hrefLabel="ver beleza" produtos={beleza} />
      <VitrineVertical titulo="Perfumes" Icon={SprayCan} accentText="text-parfum-2" accentGrad="from-parfum to-fit"
        href="/categoria/perfumes-importados" hrefLabel="ver perfumes" produtos={perfumes} />
      <VitrineVertical titulo="Gadgets" Icon={Headphones} accentText="text-gadget-2" accentGrad="from-gadget to-cyan"
        href="/categoria/fones-bluetooth" hrefLabel="ver gadgets" produtos={gadgets} />

      {/* DESTAQUES (PromoScore) — a inteligência, mantida abaixo do feed */}
      <section className="pb-16">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
            <Sparkles className="h-4 w-4 text-brand-2" /> Destaques do PromoScore
          </h2>
          <Link href="/ofertas" className="text-xs text-brand-2 hover:underline">ver todas →</Link>
        </div>
        {destaques.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {destaques.map((p, i) => <ProdutoCard key={p.id} p={p} rank={i + 1} />)}
          </div>
        ) : (
          <EmptyState icon="🛰️" title="Coleta em preparação"
            hint="As ofertas aparecem aqui assim que a primeira coleta rodar. Enquanto isso, explore as categorias pelo menu superior."
            action={<Link href="/ofertas"><Button variant="outline" size="sm">Ir para ofertas</Button></Link>} />
        )}
      </section>

      {/* MUNDO FIT (vertical suplementos — acento coral) */}
      {fit.length > 0 && (
        <VitrineVertical titulo="Mundo Fit — suplementos" Icon={Dumbbell} accentText="text-fit" accentGrad="from-fit to-warn"
          href="/categoria/whey-protein" hrefLabel="ver mais" produtos={fit} />
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
