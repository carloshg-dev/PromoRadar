import Link from "next/link";
import { temaSazonal } from "@/lib/seasonal";

/**
 * Faixa sazonal — o site "se veste" da época (Copa, São João, Black Friday,
 * Natal). Festiva mas com a nossa identidade: gradiente da época, emojis
 * decorativos no fundo, frase forte e um CTA. Fora das épocas, não renderiza.
 */
export function SeasonalRibbon() {
  const t = temaSazonal();
  if (!t) return null;
  return (
    <div className={`relative overflow-hidden border-b border-line bg-gradient-to-r ${t.grad}`}>
      {/* emojis decorativos no fundo (discretos, não atrapalham a leitura) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex select-none items-center justify-around whitespace-nowrap text-xl opacity-[0.12] sm:text-2xl">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i}>{t.decor[i % t.decor.length]}</span>
        ))}
      </div>

      <div className="relative mx-auto flex max-w-page items-center justify-center gap-2 px-4 py-2.5 text-center sm:gap-3 sm:px-6 lg:px-10">
        <span className="shrink-0 text-lg sm:text-xl">{t.emoji}</span>
        <p className="text-[13px] font-bold leading-tight tracking-tight text-white sm:text-base">{t.frase}</p>
        <span className="shrink-0 text-lg sm:text-xl">{t.emoji}</span>
        {t.cta && (
          <Link href={t.cta.href}
            className="ml-1 hidden shrink-0 items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-white/25 sm:inline-flex">
            {t.cta.label} →
          </Link>
        )}
      </div>
    </div>
  );
}
