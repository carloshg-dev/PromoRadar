import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { obterProduto, historicoPrecos, comparacaoDeProduto, relacionados } from "@/infrastructure/repositories/produtos.repo";
import { PriceChart, type ChartPoint } from "@/components/price-chart";
import { StorePriceBars } from "@/components/store-price-bars";
import { ProdutoCard } from "@/components/produto-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Tooltip } from "@/components/ui/tooltip";
import { formatBRL, corLoja, timeAgo } from "@/lib/utils";
import { gerarInsights, calcularTendencia, type SeriePonto } from "@/core/insights/insights";
import { TrackView } from "@/components/analytics/track-view";
import { ProductActions } from "@/components/product-actions";
import { productMetadata, productStructuredData, safeJsonLd } from "@/lib/product-seo";
import { hasRecentPrice } from "@/core/offer-freshness";
import { formatShortDate } from "@/core/formatting";
import { ExternalLink, TrendingDown, TrendingUp, Minus, Info, ImageOff, Scale, LineChart as LineChartIcon, Sparkles, ShoppingBag, CheckCircle2, TriangleAlert } from "lucide-react";
import { TODAS_CATEGORIAS } from "@/lib/navigation";

// A página e os dados públicos têm cache; a comparação vem do snapshot do runner.
export const revalidate = 1800;
// Cache do render Next fica na página; o repositório também é usado em scripts Node.
const cachedProduct = cache(obterProduto);

export async function generateMetadata({ params }: { params: { id: string } }) {
  const p = await cachedProduct(params.id).catch(() => null);
  return p ? productMetadata(p) : { title: "Produto não encontrado", robots: { index: false } };
}

export default async function ProdutoPage({ params }: { params: { id: string } }) {
  const p = await cachedProduct(params.id).catch(() => null);
  if (!p) notFound();

  let readFailed = false;
  const hist = (await historicoPrecos(params.id).catch(() => { readFailed = true; return []; })) as SeriePonto[];
  const points: ChartPoint[] = hist.map((h) => ({
    data: formatShortDate(h.coletado_em),
    preco: Number(h.preco),
  }));
  const [comp, rel] = await Promise.all([
    comparacaoDeProduto(p).catch(() => { readFailed = true; return null; }),
    p.categoriaSlug ? relacionados(p.categoriaSlug, p.id, 8).catch(() => { readFailed = true; return []; }) : Promise.resolve([]),
  ]);

  const insights = gerarInsights(p, hist);
  const tend = calcularTendencia(p, hist);
  const TrendIcon = tend.direcao === "queda" ? TrendingDown : tend.direcao === "alta" ? TrendingUp : Minus;
  const trendColor = tend.direcao === "queda" ? "text-neon" : tend.direcao === "alta" ? "text-danger" : "text-muted";
  const cor = corLoja(p.lojaSlug ?? p.lojaNome);
  const CategoryIcon = TODAS_CATEGORIAS.find(category => category.slug === p.categoriaSlug)?.Icon ?? ShoppingBag;
  const recentPrice = hasRecentPrice(p.atualizadoEm);
  const historicalDiscount = hist.length >= 2 && p.precoAtual && p.precoAvgHist && p.precoAvgHist > p.precoAtual
    ? Math.round((1 - p.precoAtual / p.precoAvgHist) * 100) : null;
  const sellerDiscount = p.precoAtual && p.precoOriginal && p.precoOriginal > p.precoAtual
    ? Math.round((1 - p.precoAtual / p.precoOriginal) * 100) : null;

  return (
    <main data-public-cache={readFailed ? "unavailable" : "ready"} className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(productStructuredData(p)) }} />
      <TrackView tipo="ver_produto" produtoId={p.id} lojaSlug={p.lojaSlug} categoriaSlug={p.categoriaSlug} />
      <Breadcrumbs items={[
        { label: "Início", href: "/" },
        { label: p.categoriaNome ?? "Categoria", href: p.categoriaSlug ? `/categoria/${p.categoriaSlug}` : undefined },
        { label: p.titulo.slice(0, 40) + (p.titulo.length > 40 ? "…" : "") },
      ]} />

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-bg-soft px-2 py-1 text-muted"><CategoryIcon className="h-3.5 w-3.5" aria-hidden="true" />{p.categoriaNome}</span>
        <span className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 label-mono text-[10px] text-ink" style={{ borderColor: `${cor}40` }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: cor }} />{p.lojaNome}
        </span>
      </div>
      <h1 className="mt-2 text-2xl font-bold leading-snug">{p.titulo}</h1>
      {!recentPrice && <div role="note" className="mt-4 rounded-xl border border-warn/30 bg-warn/5 p-3 text-sm leading-relaxed text-warn">
        <strong className="block">Preço sem atualização recente</strong>
        O valor e o estoque podem ter mudado desde a última coleta. Confira as condições atuais na loja.
      </div>}

      {/* KPIs */}
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label={recentPrice ? "Preço coletado" : "Último preço coletado"} value={formatBRL(p.precoAtual)} accent={recentPrice ? "text-neon" : "text-ink"} />
        <Kpi label="Menor histórico" value={formatBRL(p.precoMinHist)} hint="O menor preço já coletado." />
        <Kpi label="Média histórica" value={formatBRL(p.precoAvgHist)} hint="Média de todos os preços coletados." />
        <Kpi label={recentPrice ? "Tendência" : "Variação histórica"} value={`${tend.variacaoPct > 0 ? "+" : ""}${tend.variacaoPct}%`} icon={<TrendIcon className={`h-4 w-4 ${recentPrice ? trendColor : "text-muted"}`} />} accent={recentPrice ? trendColor : "text-muted"} hint="Variação vs. a média histórica." />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {/* Comparar entre lojas (barras) — o destaque "vivo" da página */}
          {comp && comp.lojas > 1 && (
            <Card className="glass p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Scale className="h-4 w-4 text-brand-2" /> Comparar entre lojas
                </h2>
                <Link prefetch={false} href="/comparar" className="shrink-0 text-xs text-brand-2 hover:underline">ver todas →</Link>
              </div>
              <StorePriceBars ofertas={comp.ofertas} menorPreco={comp.menorPreco} maiorPreco={comp.maiorPreco} />
              <p className="mt-3 text-[10px] text-muted">Comparação por classe ({comp.rotulo}) — pode incluir marcas/variações diferentes.</p>
            </Card>
          )}

          {/* Histórico de preços */}
          <Card className="glass p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <LineChartIcon className="h-4 w-4 text-neon" /> Histórico de preços
              </h2>
              <span className="label-mono text-[10px] text-muted">{points.length} ponto(s)</span>
            </div>
            {points.length >= 2 ? (
              <>
                <PriceChart points={points} />
                <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
                  <Stat label="Mínimo" value={formatBRL(p.precoMinHist)} accent="text-neon" />
                  <Stat label="Médio" value={formatBRL(p.precoAvgHist)} />
                  <Stat label="Máximo" value={formatBRL(p.precoMaxHist)} accent="text-danger" />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-line bg-bg-soft/40 px-4 py-4 text-sm text-muted">
                <LineChartIcon className="h-5 w-5 shrink-0 text-neon/70" />
                <span>Ainda sem variação registrada. O PromoDetec guarda o preço a cada coleta — em alguns dias, a curva aparece aqui automaticamente.</span>
              </div>
            )}
          </Card>
        </div>

        {/* Compra */}
        <Card className="glass flex h-fit flex-col p-5">
          <div className="mb-4 grid aspect-square place-items-center overflow-hidden rounded-xl bg-white">
            {p.imagemUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.imagemUrl} alt={p.titulo} className="h-full w-full object-contain p-4" />
            ) : (
              <ImageOff className="h-10 w-10 text-muted/40" />
            )}
          </div>
          <div className={`mt-4 font-display text-3xl font-extrabold ${recentPrice ? "text-neon" : "text-ink"}`}>{formatBRL(p.precoAtual)}</div>
          {p.precoOriginal && p.precoAtual && p.precoOriginal > p.precoAtual && (
            <div className="text-sm text-muted line-through">{formatBRL(p.precoOriginal)}</div>
          )}
          {recentPrice && (historicalDiscount ? <div className="mt-1 text-sm font-semibold text-brand-2">{historicalDiscount}% abaixo da média histórica coletada</div>
            : sellerDiscount ? <div className="mt-1 text-sm text-brand-2">{sellerDiscount}% sobre o preço de referência informado pela loja</div> : null)}
          {Number.isFinite(Date.parse(p.atualizadoEm)) && <time dateTime={p.atualizadoEm} className="mt-2 text-xs text-muted">Última coleta: {timeAgo(p.atualizadoEm)}</time>}
          {/* CTA de saída — /r/ registra o clique (afiliados/conversão) e redireciona à loja */}
          <a href={`/r/${p.id}?o=produto`} target="_blank" rel="noopener noreferrer nofollow sponsored"
            className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-center text-sm font-semibold text-white hover:bg-brand-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">{recentPrice ? "Ir à loja" : "Conferir preço"} — {p.lojaNome}<ExternalLink className="h-4 w-4 shrink-0" /></a>
          <p className="mt-3 text-xs leading-5 text-muted">Você será direcionado ao site da loja para concluir a compra.</p>
          <ProductActions item={{ id: p.id, titulo: p.titulo }} />
          <p className="mt-3 text-[11px] text-muted">Preço e disponibilidade sujeitos a alteração — oferta válida enquanto durarem os estoques. Confirme o valor final na loja antes de comprar.</p>
        </Card>
      </div>

      {/* Insights automáticos */}
      <Card className="glass mt-4 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink"><Info className="h-4 w-4" />{recentPrice ? "Insights do histórico" : "Histórico como referência"}</h2>
        {recentPrice ? <div className="grid gap-2 sm:grid-cols-2">
          {insights.map((i, idx) => (
            <div key={idx} className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm ${
              i.tipo === "positivo" ? "border-neon/20 bg-neon/5 text-neon-2"
              : i.tipo === "alerta" ? "border-warn/20 bg-warn/5 text-warn"
              : "border-line bg-bg-soft text-ink"}`}>
              <span className="mt-0.5 shrink-0" aria-hidden="true">{i.tipo === "positivo" ? <CheckCircle2 className="h-4 w-4" /> : i.tipo === "alerta" ? <TriangleAlert className="h-4 w-4" /> : <Info className="h-4 w-4" />}</span>
              <span className="leading-snug">{i.texto}</span>
            </div>
          ))}
        </div> : <p className="text-sm leading-relaxed text-muted">Use o gráfico como referência histórica. Para decidir a compra, confirme o preço atual e a disponibilidade na loja.</p>}
      </Card>

      {/* Mais ofertas na mesma categoria */}
      {rel.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
            <Sparkles className="h-4 w-4 text-brand-2" /> Mais ofertas em {p.categoriaNome ?? "destaque"}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {rel.map((r) => <ProdutoCard key={r.id} p={r} />)}
          </div>
        </section>
      )}
    </main>
  );
}

function Kpi({ label, value, accent, icon, hint }: { label: string; value: string; accent?: string; icon?: React.ReactNode; hint?: string }) {
  return (
    <Card className="glass p-3.5">
      <div className="flex items-center gap-1 label-mono text-[10px] text-muted">
        {label}
        {hint && <Tooltip label={hint}><Info className="h-3 w-3 opacity-60" /></Tooltip>}
      </div>
      <div className={`mt-1 flex items-center gap-1.5 font-display text-lg font-extrabold ${accent ?? "text-ink"}`}>{icon}{value}</div>
    </Card>
  );
}
function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg bg-bg-soft p-2.5">
      <div className="text-muted">{label}</div>
      <div className={`mt-0.5 font-semibold ${accent ?? "text-ink"}`}>{value}</div>
    </div>
  );
}
