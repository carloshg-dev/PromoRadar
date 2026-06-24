import { cn } from "@/lib/utils";

/**
 * PromoScore — gauge radial com o gradiente assinatura mauve→ciano
 * (DESIGN.md › "Radical Precision Dark"). O arco preenchido é proporcional ao
 * score; o tom do número/label segue a faixa de qualidade.
 */
function tier(s: number) {
  if (s >= 95) return { label: "Excepcional", color: "#cabeff" };
  if (s >= 80) return { label: "Excelente", color: "#cabeff" };
  if (s >= 60) return { label: "Boa", color: "#74f5ff" };
  return { label: "Comum", color: "#938ea1" };
}

export function ScoreRing({ score, size = 64, showLabel = true }:
  { score: number | null; size?: number; showLabel?: boolean }) {
  const s = Math.max(0, Math.min(100, score ?? 0));
  const t = tier(s);
  const ang = (s / 100) * 360;
  // gauge cônico: preenchido (mauve→ciano) até `ang`, trilho depois
  const gauge = `conic-gradient(from -90deg, #7C5DFF 0deg, #00dbe7 ${ang}deg, rgba(255,255,255,.07) ${ang}deg 360deg)`;
  const inner = Math.round(size * 0.74);
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative grid place-items-center" style={{ width: size, height: size }}>
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: gauge, boxShadow: s >= 80 ? "0 0 18px rgba(124,93,255,.35)" : undefined }}
        />
        <div
          className="relative grid place-items-center rounded-full bg-bg-card"
          style={{ width: inner, height: inner }}
        >
          <span className="font-display font-extrabold tabular-nums leading-none"
            style={{ fontSize: size * 0.34, color: t.color }}>
            {score ?? "—"}
          </span>
        </div>
      </div>
      {showLabel && (
        <div>
          <div className="label-mono text-[10px] text-muted">PromoScore</div>
          <div className="text-sm font-semibold" style={{ color: t.color }}>{t.label}</div>
        </div>
      )}
    </div>
  );
}

export function ScorePill({ score, className }: { score: number | null; className?: string }) {
  const s = Math.max(0, Math.min(100, score ?? 0));
  const t = tier(s);
  const ang = (s / 100) * 360;
  const gauge = `conic-gradient(from -90deg, #7C5DFF 0deg, #00dbe7 ${ang}deg, rgba(255,255,255,.08) ${ang}deg 360deg)`;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-xl border border-line bg-bg-soft/70 px-2 py-1 text-xs font-bold tabular-nums", className)}
      style={{ color: t.color }}>
      <span className="grid h-4 w-4 place-items-center rounded-full" style={{ background: gauge }}>
        <span className="h-2 w-2 rounded-full bg-bg-card" />
      </span>
      {score ?? "—"}
    </span>
  );
}
