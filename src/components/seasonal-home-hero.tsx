import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  BellRing,
  ChartNoAxesCombined,
  ShieldCheck,
  Sparkles,
  Timer,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import type { ProdutoRodizio } from "@/infrastructure/repositories/produtos.repo";
import { Button } from "@/components/ui/button";
import { VitrineRodizio } from "@/components/vitrine-rodizio";
import { temaSazonal } from "@/lib/seasonal";

/**
 * Hero sazonal da home — agora CONSCIENTE do tema (temaSazonal decide a pele):
 *   • inverno-pais (19/07–10/08): noite de inverno em CSS puro + neve caindo,
 *     copy de Dia dos Pais ("o melhor presente é economia de verdade");
 *   • copa-arraia: o visual da Copa preservado tal qual;
 *   • fora de temporada: pele neutra da marca (nunca mais hero "vencido").
 * As MECÂNICAS (VitrineRodizio, CTAs, features) são idênticas nas três peles.
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

/** Flocos determinísticos (sem Math.random → sem mismatch de hidratação). */
const FLOCOS: ReadonlyArray<[number, number, number, number]> = [
  [4, 0, 10, 14], [12, 3, 13, 10], [20, 6, 11, 16], [28, 1.5, 14, 9],
  [36, 4.5, 10.5, 13], [44, 8, 12, 11], [52, 2, 11.5, 15], [60, 5, 13.5, 10],
  [68, 0.8, 10.8, 12], [76, 3.8, 12.5, 16], [84, 7, 11.2, 10], [92, 1.2, 13, 13],
  [16, 9, 12, 8], [57, 9.5, 10.5, 9], [88, 10, 14, 8],
];

function HeroInvernoPais({ produtosRodizio }: { produtosRodizio: ProdutoRodizio[] }) {
  const gelo = "text-[#7dd3fc] drop-shadow-[0_0_14px_rgba(56,189,248,.45)]";
  return (
    <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-sky-400/25 bg-[#030a1c] shadow-[0_28px_100px_-48px_rgba(56,189,248,.5)]">
      {/* noite de inverno em CSS puro: céu profundo + brilhos gelados + calor de vela */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_12%,rgba(56,189,248,.16),transparent_30%),radial-gradient(circle_at_16%_80%,rgba(245,158,11,.10),transparent_24%),radial-gradient(circle_at_88%_66%,rgba(124,93,255,.12),transparent_26%),linear-gradient(160deg,#020617_0%,#04102b_45%,#03112e_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-bg via-bg/45 to-transparent" />
      {/* lua fria */}
      <span aria-hidden className="absolute right-[14%] top-8 -z-10 h-16 w-16 rounded-full bg-sky-100/80 blur-[2px] shadow-[0_0_60px_18px_rgba(186,230,253,.35)]" />
      {/* neve caindo (decorativa; some com prefers-reduced-motion) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {FLOCOS.map(([left, delay, dur, size], i) => (
          <span key={i} className="animate-snow absolute -top-10 select-none text-white/70 motion-reduce:hidden"
            style={{ left: `${left}%`, animationDelay: `${delay}s`, animationDuration: `${dur}s`, fontSize: size }}>
            ❄
          </span>
        ))}
      </div>

      <div className="relative min-h-[940px] px-5 py-10 sm:min-h-[860px] sm:px-9 sm:py-12 lg:min-h-[760px] lg:px-12 lg:py-14 xl:min-h-[790px]">
        <div className="relative z-10 max-w-[620px]">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/35 bg-sky-400/12 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-sky-200 shadow-[0_0_28px_-14px_rgba(56,189,248,.9)]">
            <span aria-hidden>🥸</span>
            Dia dos Pais PromoDetec
          </span>
          <h2 className="mt-5 max-w-xl text-4xl font-black leading-[1.02] tracking-tight text-white drop-shadow-[0_4px_18px_rgba(0,0,0,.65)] sm:text-5xl lg:text-6xl">
            O melhor presente é <span className="block text-[#38bdf8] drop-shadow-[0_0_22px_rgba(56,189,248,.55)]">economia de verdade.</span>
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-6 text-zinc-100/88 sm:text-base">
            Ofertas selecionadas para surpreender seu pai com tecnologia, conforto e estilo nesse inverno.
            Compare preços, confira o histórico e garanta o melhor presente pelo melhor preço.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/ofertas">
              <Button size="lg" className="h-12 rounded-full border border-sky-300/40 bg-[#38bdf8] px-7 font-black text-slate-950 shadow-[0_0_30px_-10px_rgba(56,189,248,.85)] hover:bg-sky-300">
                Ver ofertas da temporada <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link
              href="/comparar"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-sky-200/35 bg-black/20 px-5 text-sm font-bold text-sky-100 transition hover:bg-sky-300/15 hover:text-white"
            >
              <Timer className="h-4 w-4" />
              Comparar antes de comprar
            </Link>
          </div>
          <Features accent={gelo} />
        </div>

        <VitrineRodizio produtos={produtosRodizio} />
      </div>
    </section>
  );
}

function HeroCopaArraia({ produtosRodizio }: { produtosRodizio: ProdutoRodizio[] }) {
  return (
    <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-emerald-400/25 bg-[#020811] shadow-[0_28px_100px_-48px_rgba(0,219,231,.55)]">
      <picture aria-hidden className="absolute inset-0 -z-10">
        <source media="(max-width: 639px)" srcSet="/hero_mobile_clean.png.png" />
        <img
          src="/hero_desktop_clean.png.png"
          alt=""
          loading="eager"
          fetchPriority="high"
          className="h-full w-full object-cover object-center"
        />
      </picture>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_64%_16%,rgba(0,240,106,.15),transparent_22%),radial-gradient(circle_at_78%_72%,rgba(245,158,11,.12),transparent_18%),linear-gradient(90deg,rgba(0,0,0,.96)_0%,rgba(1,10,18,.9)_31%,rgba(1,9,18,.42)_62%,rgba(1,8,17,.2)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-bg via-bg/45 to-transparent" />
      <div className="pointer-events-none absolute bottom-0 inset-x-0 z-0 h-64 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-orange-600/30 via-rose-500/10 to-transparent blur-3xl mix-blend-screen" />
      <span aria-hidden="true" className="absolute left-[43%] top-8 z-0 hidden h-px w-[34%] -rotate-3 bg-gradient-to-r from-transparent via-amber-200/35 to-transparent lg:block" />
      <span aria-hidden="true" className="absolute right-[31%] top-10 z-0 hidden h-5 w-5 rounded-full bg-amber-300/70 shadow-[0_0_24px_rgba(251,191,36,.72)] blur-[1px] lg:block" />
      <span aria-hidden="true" className="absolute right-[18%] top-16 z-0 hidden h-3 w-3 rounded-full bg-emerald-300/70 shadow-[0_0_22px_rgba(52,211,153,.7)] blur-[1px] lg:block" />

      <div className="relative min-h-[940px] px-5 py-10 sm:min-h-[860px] sm:px-9 sm:py-12 lg:min-h-[760px] lg:px-12 lg:py-14 xl:min-h-[790px]">
        <div className="relative z-10 max-w-[620px]">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#00e46a]/35 bg-[#00e46a]/12 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#90ffb6] shadow-[0_0_28px_-14px_rgba(34,224,107,.9)]">
            <Trophy className="h-3.5 w-3.5" />
            Copa &amp; Arraiá PromoDetec
          </span>
          <h2 className="mt-5 max-w-xl text-4xl font-black leading-[1.02] tracking-tight text-white drop-shadow-[0_4px_18px_rgba(0,0,0,.65)] sm:text-5xl lg:text-6xl">
            A grande jogada é comprar no clima <span className="block text-[#00d85f] text-neon-glow">da festa.</span>
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-6 text-zinc-100/88 sm:text-base">
            Ofertas garimpadas para torcer, festejar e comparar com calma: da comparação de preços ao arraiá de categorias, a melhor compra entra em campo quando o preço faz sentido.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/ofertas">
              <Button size="lg" className="h-12 rounded-full border border-emerald-300/40 bg-[#00d85f] px-7 font-black text-slate-950 shadow-[0_0_30px_-10px_rgba(0,216,95,.8)] hover:bg-emerald-300">
                Ver ofertas da temporada <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link
              href="/comparar"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-[#b6f26d]/35 bg-black/20 px-5 text-sm font-bold text-[#e9ffc8] transition hover:bg-[#b6f26d]/14 hover:text-white"
            >
              <Timer className="h-4 w-4" />
              Comparar antes do apito
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
  if (tema?.id === "inverno-pais") return <HeroInvernoPais produtosRodizio={produtosRodizio} />;
  if (tema?.id === "copa-arraia") return <HeroCopaArraia produtosRodizio={produtosRodizio} />;
  return <HeroNeutro produtosRodizio={produtosRodizio} />;
}
