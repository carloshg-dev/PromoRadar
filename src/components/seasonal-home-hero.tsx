import Link from "next/link";
import { ArrowRight, Flame, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SeasonalHomeHero() {
  return (
    <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-emerald-400/25 bg-[#031b2f] shadow-[0_28px_90px_-48px_rgba(0,219,231,.55)]">
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
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#021521]/95 via-[#06233b]/72 to-[#031424]/30 sm:from-[#021521]/92 sm:via-[#06233b]/62 sm:to-transparent" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-28 bg-gradient-to-t from-bg via-bg/30 to-transparent" />

      <div className="relative min-h-[520px] px-5 py-10 sm:min-h-[390px] sm:px-9 sm:py-12 lg:min-h-[430px] lg:px-12 lg:py-14">
        <div className="max-w-[620px]">
          <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/40 bg-yellow-300/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-yellow-100 shadow-[0_0_28px_-16px_rgba(250,204,21,.9)]">
            <Trophy className="h-3.5 w-3.5" />
            Copa & Arraia PromoDetec
          </span>
          <h2 className="mt-5 max-w-xl text-4xl font-black leading-[1.02] tracking-tight text-white drop-shadow-[0_4px_18px_rgba(0,0,0,.55)] sm:text-5xl lg:text-6xl">
            A grande jogada e comprar no clima da festa.
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-6 text-zinc-100/88 sm:text-base">
            Ofertas garimpadas para torcer, festejar e comparar com calma: do placar do PromoScore ao arraia de categorias, a melhor compra entra em campo quando o preco faz sentido.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/ofertas">
              <Button size="lg" className="border border-emerald-300/40 bg-emerald-500 text-emerald-950 hover:bg-emerald-400">
                Ver ofertas da temporada <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link
              href="/comparar"
              className="inline-flex items-center gap-2 rounded-xl border border-yellow-300/35 bg-yellow-300/12 px-4 py-2.5 text-sm font-semibold text-yellow-100 transition hover:bg-yellow-300/20 hover:text-white"
            >
              <Flame className="h-4 w-4" />
              Comparar antes do apito
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
