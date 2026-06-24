import { cn } from "@/lib/utils";

const TIERS = [
  { min: 95, label: "Excepcional", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  { min: 80, label: "Excelente",   cls: "bg-brand/15 text-brand-2 border-brand/30" },
  { min: 60, label: "Boa oferta",  cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  { min: 0,  label: "Comum",       cls: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
];

export function PromoScoreBadge({ score }: { score: number | null }) {
  if (score == null) return null;
  const t = TIERS.find((x) => score >= x.min)!;
  return (
    <div className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-semibold", t.cls)}>
      <span className="tabular-nums">{score}</span>
      <span className="opacity-70">·</span>
      <span>{t.label}</span>
    </div>
  );
}
