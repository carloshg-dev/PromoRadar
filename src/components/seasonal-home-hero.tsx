import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  BellRing,
  ChartNoAxesCombined,
  ShieldCheck,
  Sparkles,
  Timer,
  type LucideIcon,
} from "lucide-react";
import type { ProdutoRodizio } from "@/infrastructure/repositories/produtos.repo";
import { Button } from "@/components/ui/button";
import { VitrineRodizio } from "@/components/vitrine-rodizio";
import { temaSazonal, type TemaSazonal } from "@/lib/seasonal";

/**
 * O calendário fornece conteúdo e mídia; este componente preserva as mesmas
 * mecânicas de oferta em todas as campanhas e usa uma pele neutra fora delas.
 */

function FeatureItem({ icon: Icon, label, accent }: { icon: LucideIcon; label: string; accent?: string }) {
  return (
    <div className="flex min-w-[132px] items-center gap-3 border-l border-white/10 pl-4 first:border-l-0 first:pl-0">
      <Icon className={`h-7 w-7 shrink-0 ${accent ?? "text-[#00e46a] drop-shadow-[0_0_14px_rgba(34,224,107,.42)]"}`} strokeWidth={1.7} />
      <span className="text-xs font-medium leading-tight text-zinc-100/86">{label}</span>
    </div>
  );
}

function Features({ accent }: { accent?: string }) {
  return (
    <div className="mt-8 grid max-w-xl grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:items-center sm:gap-0">
      <FeatureItem icon={ShieldCheck} label="Ofertas verificadas" accent={accent} />
      <FeatureItem icon={ChartNoAxesCombined} label="Histórico de preços" accent={accent} />
      <FeatureItem icon={BadgePercent} label="Cupons exclusivos" accent={accent} />
      <FeatureItem icon={BellRing} label="Alertas inteligentes" accent={accent} />
    </div>
  );
}

function HeroCampanha({ tema, produtosRodizio }: { tema: TemaSazonal; produtosRodizio: ProdutoRodizio[] }) {
  const hero = tema.hero;
  if (!hero) return <HeroNeutro produtosRodizio={produtosRodizio} />;

  return (
    <section
      className="relative isolate overflow-hidden rounded-[1.75rem] border bg-[#061019] shadow-[0_28px_100px_-48px_rgba(49,208,127,.5)]"
      style={{ borderColor: `${tema.corHex}55` }}
    >
      <picture aria-hidden className="absolute inset-0 -z-10">
        <source media="(max-width: 639px)" srcSet={hero.imagemMobile} />
        <img
          src={hero.imagemDesktop}
          alt=""
          loading="eager"
          fetchPriority="high"
          className="h-full w-full object-cover object-center"
        />
      </picture>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,8,14,.97)_0%,rgba(2,10,17,.9)_34%,rgba(2,9,16,.5)_64%,rgba(2,8,15,.24)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-bg via-bg/45 to-transparent" />

      <div className="relative min-h-[940px] px-5 py-10 sm:min-h-[860px] sm:px-9 sm:py-12 lg:min-h-[760px] lg:px-12 lg:py-14 xl:min-h-[790px]">
        <div className="relative z-10 max-w-[620px]">
          <span
            className="inline-flex items-center gap-2 rounded-full border bg-black/35 px-3 py-1 text-xs font-extrabold uppercase tracking-wide backdrop-blur-sm"
            style={{ borderColor: `${tema.corHex}77`, color: tema.corApoioHex }}
          >
            <BadgePercent className="h-3.5 w-3.5" />
            {tema.selo} PromoDetec
          </span>
          <h2 className="mt-5 max-w-xl text-4xl font-black leading-[1.02] tracking-tight text-white drop-shadow-[0_4px_18px_rgba(0,0,0,.65)] sm:text-5xl lg:text-6xl">
            {hero.titulo} <span className="block" style={{ color: tema.corHex }}>{hero.destaque}</span>
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-6 text-zinc-100/88 sm:text-base">
            {hero.descricao}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href={tema.cta.href}>
              <Button
                size="lg"
                className="h-12 rounded-full border border-white/25 px-7 font-black text-slate-950 hover:brightness-110"
                style={{ backgroundColor: tema.corHex }}
              >
                {hero.ctaPrimario} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link
              href="/comparar"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-white/25 bg-black/30 px-5 text-sm font-bold text-white transition hover:bg-black/50"
            >
              <Timer className="h-4 w-4" />
              {hero.ctaSecundario}
            </Link>
          </div>
          <Features />
        </div>

        <VitrineRodizio produtos={produtosRodizio} />
      </div>
    </section>
  );
}

/** Fora de temporada: pele neutra da marca — o hero nunca mais fica "vencido". */
function HeroNeutro({ produtosRodizio }: { produtosRodizio: ProdutoRodizio[] }) {
  const roxo = "text-brand-2 drop-shadow-[0_0_14px_rgba(124,93,255,.45)]";
  return (
    <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-line bg-[#0b0b12] shadow-[0_28px_100px_-48px_rgba(124,93,255,.45)]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_14%,rgba(124,93,255,.16),transparent_30%),radial-gradient(circle_at_18%_78%,rgba(0,219,231,.10),transparent_24%),linear-gradient(160deg,#08080d_0%,#0d0d18_60%,#0a0a12_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-bg via-bg/45 to-transparent" />

      <div className="relative min-h-[940px] px-5 py-10 sm:min-h-[860px] sm:px-9 sm:py-12 lg:min-h-[760px] lg:px-12 lg:py-14 xl:min-h-[790px]">
        <div className="relative z-10 max-w-[620px]">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/35 bg-brand/12 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-brand-2 shadow-[0_0_28px_-14px_rgba(124,93,255,.9)]">
            <Sparkles className="h-3.5 w-3.5" />
            Seleção PromoDetec
          </span>
          <h2 className="mt-5 max-w-xl text-4xl font-black leading-[1.02] tracking-tight text-white drop-shadow-[0_4px_18px_rgba(0,0,0,.65)] sm:text-5xl lg:text-6xl">
            As melhores ofertas, <span className="block gradient-text">garimpadas por dados.</span>
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-6 text-zinc-100/88 sm:text-base">
            Seleção viva do dia: preços comparados entre lojas, histórico real e zero desconto de mentira.
            Compre no momento certo — com dados, não com vitrine.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/ofertas">
              <Button size="lg" className="h-12 rounded-full px-7 font-black">
                Ver melhores ofertas <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link
              href="/comparar"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-line bg-black/20 px-5 text-sm font-bold text-zinc-200 transition hover:bg-brand/10 hover:text-white"
            >
              <Timer className="h-4 w-4" />
              Comparar entre lojas
            </Link>
          </div>
          <Features accent={roxo} />
        </div>

        <VitrineRodizio produtos={produtosRodizio} />
      </div>
    </section>
  );
}

export function SeasonalHomeHero({ produtosRodizio }: { produtosRodizio: ProdutoRodizio[] }) {
  const tema = temaSazonal();
  if (tema?.hero) return <HeroCampanha tema={tema} produtosRodizio={produtosRodizio} />;
  return <HeroNeutro produtosRodizio={produtosRodizio} />;
}
