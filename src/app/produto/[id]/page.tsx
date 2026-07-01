import Link from "next/link";
import { notFound } from "next/navigation";
import { obterProduto, historicoPrecos, comparacaoDeProduto, relacionados } from "@/infrastructure/repositories/produtos.repo";
import { PriceChart, type ChartPoint } from "@/components/price-chart";
import { PromoScoreBadge } from "@/components/promo-score-badge";
import { StorePriceBars } from "@/components/store-price-bars";
import { ProdutoCard } from "@/components/produto-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Tooltip } from "@/components/ui/tooltip";
import { formatBRL, corLoja } from "@/lib/utils";
import { ehLinkMonetizado } from "@/lib/afiliados";
import { gerarInsights, calcularTendencia, type SeriePonto } from "@/core/insights/insights";
import { TrackView } from "@/components/analytics/track-view";
import { ExternalLink, TrendingDown, TrendingUp, Minus, Info, ImageOff, Scale, LineChart as LineChartIcon, Sparkles } from "lucide-react";

// 10 min: preços mudam no máx. 3x/dia e a comparação por classe varre até
// 2000 linhas — cache mais longo corta ~5x o egress do Supabase free.
export const revalidate = 600;

export async function generateMetadata({ params }: { params: { id: string } }) {
  const p = await obterProduto(params.id).catch(() => null);
  return { title: p ? p.titulo.slice(0, 60) : "Produto" };
}

export default async function ProdutoPage({ params }: { params: { id: string } }) {
  const p = await obterProduto(params.id).catch(() => null);
  if (!p) notFound();

  const hist = (await historicoPrecos(params.id).catch(() => [])) as SeriePonto[];
  const points: ChartPoint[] = hist.map((h) => ({
    data: new Date(h.coletado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    preco: Number(h.preco),
  }));
  const [comp, rel] = await Promise.all([
    comparacaoDeProduto(p).catch(() => null),
    p.categoriaSlug ? relacionados(p.categoriaSlug, p.id, 8).catch(() => []) : Promise.resolve([]),
  ]);

  const insights = gerarInsights(p, hist);
  const tend = calcularTendencia(p, hist);
  const TrendIcon = tend.direcao === "queda" ? TrendingDown : tend.direcao === "alta" ? TrendingUp : Minus;
  const trendColor = tend.direcao === "queda" ? "text-neon" : tend.direcao === "alta" ? "text-rose-400" : "text-muted";
  const cor = corLoja(p.lojaSlug ?? p.lojaNome);
  const monetizado = ehLinkMonetizado(p.url);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <TrackView tipo="ver_produto" produtoId={p.id} lojaSlug={p.lojaSlug} categoriaSlug={p.categoriaSlug} />
      <Breadcrumbs items={[
        { label: "Início", href: "/" },
        { label: p.categoriaNome ?? "Categoria", href: p.categoriaSlug ? `/categoria/${p.categoriaSlug}` : undefined },
        { label: p.titulo.slice(0, 40) + (p.titulo.length > 40 ? "…" : "") },
      ]} />

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-md bg-bg-soft px-2 py-1 text-muted">{p.categoriaEmoji} {p.categoriaNome}</span>
        <span className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 label-mono text-[10px]" style={{ borderColor: `${cor}40`, color: cor }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: cor }} />{p.lojaNome}
        </span>
      </div>
      <h1 className="mt-2 text-2xl font-bold leading-snug">{p.titulo}</h1>

      {/* KPIs */}
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Preço atual" value={formatBRL(p.precoAtual)} accent="text-neon" />
        <Kpi label="Menor histórico" value={formatBRL(p.precoMinHist)} hint="O menor preço já coletado." />
        <Kpi label="Média histórica" value={formatBRL(p.precoAvgHist)} hint="Média de todos os preços coletados." />
        <Kpi label="Tendência" value={`${tend.variacaoPct > 0 ? "+" : ""}${tend.variacaoPct}%`} icon={<TrendIcon className={`h-4 w-4 ${trendColor}`} />} accent={trendColor} hint="Variação vs. a média histórica." />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {/* Comparar entre lojas (barras) — o destaque "vivo" da página */}
          {comp && comp.lojas > 1 && (
            <Card className="glass p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                  <Scale className="h-4 w-4 text-brand-2" /> Comparar entre lojas
                </h2>
                <Link href="/comparar" className="shrink-0 text-xs text-brand-2 hover:underline">ver todas →</Link>
              </div>
              <StorePriceBars ofertas={comp.ofertas} menorPreco={comp.menorPreco} maiorPreco={comp.maiorPreco} />
              <p className="mt-3 text-[10px] text-muted">Comparação por classe ({comp.rotulo}) — pode incluir marcas/variações diferentes.</p>
            </Card>
          )}

          {/* Histórico de preços */}
          <Card className="glass p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
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
                  <Stat label="Máximo" value={formatBRL(p.precoMaxHist)} accent="text-rose-400" />
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

        {/* Compra + score */}
        <Card className="glass flex h-fit flex-col p-5">
          <div className="mb-4 grid aspect-square place-items-center overflow-hidden rounded-xl bg-white">
            {p.imagemUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.imagemUrl} alt={p.titulo} className="h-full w-full object-contain p-4" />
            ) : (
              <ImageOff className="h-10 w-10 text-muted/40" />
            )}
          </div>
          <PromoScoreBadge score={p.promoScore} />
          <div className="mt-4 font-display text-3xl font-extrabold text-neon">{formatBRL(p.precoAtual)}</div>
          {p.precoOriginal && p.precoAtual && p.precoOriginal > p.precoAtual && (
            <div className="text-sm text-muted line-through">{formatBRL(p.precoOriginal)}</div>
          )}
          {p.descontoPct ? <div className="mt-1 text-sm font-semibold text-brand-2">{p.descontoPct}% vs. média histórica</div> : null}
          {/* Dois Níveis (mesma regra do card): monetizado → /r/ leva à loja de
              verdade; não-monetizado → SEM CTA externo (não damos tráfego de graça —
              a comparação abaixo já é o valor que entregamos pra essa loja). */}
          {monetizado ? (
            <>
              {/* /r/ registra o clique (afiliados/conversão) e redireciona à loja */}
              <a href={`/r/${p.id}?o=produto`} target="_blank" rel="noopener noreferrer nofollow" className="mt-5">
                <Button className="w-full" size="lg">Ir à loja — {p.lojaNome}<ExternalLink className="h-4 w-4" /></Button>
              </a>
              <p className="mt-3 text-[11px] text-muted">Preço e disponibilidade sujeitos a alteração — oferta válida enquanto durarem os estoques. Confirme o valor final na loja antes de comprar.</p>
            </>
          ) : (
            <div className="mt-5 rounded-xl border border-line bg-bg-soft/60 px-4 py-3 text-center text-xs text-muted">
              A {p.lojaNome} ainda não tem parceria de afiliado ativa com a PromoDetec — por isso não linkamos direto. Use o comparativo de preços abaixo para achar a melhor oferta disponível.
            </div>
          )}
        </Card>
      </div>

      {/* Insights automáticos */}
      <Card className="glass mt-4 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-200">🧠 Insights automáticos</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {insights.map((i, idx) => (
            <div key={idx} className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm ${
              i.tipo === "positivo" ? "border-neon/20 bg-neon/5 text-neon-2"
              : i.tipo === "alerta" ? "border-amber-500/20 bg-amber-500/5 text-amber-100"
              : "border-line bg-bg-soft text-zinc-300"}`}>
              <span className="text-base leading-none">{i.icon}</span>
              <span className="leading-snug">{i.texto}</span>
            </div>
          ))}
        </div>
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
      <div className={`mt-1 flex items-center gap-1.5 font-display text-lg font-extrabold ${accent ?? "text-zinc-100"}`}>{icon}{value}</div>
    </Card>
  );
}
function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg bg-bg-soft p-2.5">
      <div className="text-muted">{label}</div>
      <div className={`mt-0.5 font-semibold ${accent ?? "text-zinc-100"}`}>{value}</div>
    </div>
  );
}
