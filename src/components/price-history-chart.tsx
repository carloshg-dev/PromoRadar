import { ChartNoAxesCombined, ShieldCheck } from "lucide-react";
import { formatBRL } from "@/lib/utils";

export type PriceVariationPoint = {
  label: string;
  value: number;
};

type ChartPoint = PriceVariationPoint & {
  x: number;
  y: number;
};

export type PriceHistorySummary = {
  min: number | null;
  avg: number | null;
  max: number | null;
};

export function buildPriceVariationPoints(summary: PriceHistorySummary, current: number | null): PriceVariationPoint[] {
  const points: PriceVariationPoint[] = [];
  if (summary.min != null) points.push({ label: "Mín.", value: summary.min });
  if (summary.avg != null) points.push({ label: "Médio", value: summary.avg });
  if (current != null) points.push({ label: "Agora", value: current });
  if (summary.max != null) points.push({ label: "Máx.", value: summary.max });

  const unique = new Map<string, PriceVariationPoint>();
  for (const point of points) unique.set(`${point.label}-${point.value}`, point);
  return [...unique.values()];
}

function normalizePoints(points: PriceVariationPoint[]): ChartPoint[] {
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const step = points.length > 1 ? 100 / (points.length - 1) : 100;

  return points.map((point, index) => ({
    ...point,
    x: points.length > 1 ? index * step : 50,
    y: 74 - ((point.value - min) / range) * 52,
  }));
}

function buildSmoothPath(points: ChartPoint[]) {
  if (!points.length) return "";
  if (points.length === 1) return `M${points[0]!.x} ${points[0]!.y}`;

  return points.reduce((path, point, index) => {
    if (index === 0) return `M${point.x} ${point.y}`;

    const previous = points[index - 1]!;
    const controlDistance = (point.x - previous.x) / 2;
    return `${path} C${previous.x + controlDistance} ${previous.y}, ${point.x - controlDistance} ${point.y}, ${point.x} ${point.y}`;
  }, "");
}

function getSummary(points: PriceVariationPoint[], fallback: PriceHistorySummary) {
  const values = points.map((point) => point.value);
  if (!values.length) return fallback;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((total, value) => total + value, 0) / values.length;
  return {
    min: fallback.min ?? min,
    avg: fallback.avg ?? avg,
    max: fallback.max ?? max,
  };
}

export function PriceHistoryChart({
  title = "Histórico de preços",
  points,
  summary,
  accent = "#00e46a",
}: {
  title?: string;
  points: PriceVariationPoint[];
  summary: PriceHistorySummary;
  accent?: string;
}) {
  const validPoints = points.filter((point) => Number.isFinite(point.value));
  const normalized = normalizePoints(validPoints);
  const path = buildSmoothPath(normalized);
  const areaPath = path ? `${path} L100 90 L0 90 Z` : "";
  const calculated = getSummary(validPoints, summary);
  // Min/Méd/Máx só fazem sentido quando há VARIAÇÃO de preço. Produto novo (1 leitura)
  // ou de preço estável tem min=méd=máx → mostrar 3 números idênticos parece quebrado.
  const temVariacao = calculated.min != null && calculated.max != null
    && Math.round(calculated.max * 100) > Math.round(calculated.min * 100);
  const selectedPoint = normalized.reduce<ChartPoint | null>((best, point) => {
    if (!best) return point;
    return point.value > best.value ? point : best;
  }, null);

  return (
    <div className="relative z-20 mt-12 rounded-[1.5rem] border border-emerald-400/35 bg-[#03111b]/82 p-5 shadow-[0_24px_80px_-42px_rgba(0,240,106,.7)] backdrop-blur-md lg:absolute lg:inset-x-9 lg:bottom-8 lg:mt-0 xl:inset-x-12">
      <div className="grid gap-6 lg:grid-cols-[1.25fr_.85fr] lg:items-center">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-3">
            <ChartNoAxesCombined className="h-6 w-6" style={{ color: accent }} />
            <h3 className="text-base font-black text-white">{title}</h3>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/12 px-2.5 py-1 text-[11px] font-extrabold text-emerald-300">
              {validPoints.length} ponto(s)
            </span>
          </div>

          <div className="grid grid-cols-[54px_1fr] gap-3">
            <div className="flex h-32 flex-col justify-between text-[11px] text-zinc-300/80">
              {[calculated.max, calculated.avg, calculated.min].map((value, index) => (
                <span key={`${value}-${index}`}>{formatBRL(value)}</span>
              ))}
            </div>

            <div className="relative h-32 overflow-hidden rounded-xl bg-[linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:100%_33.33%,12.5%_100%]">
              {path ? (
                <svg aria-hidden="true" viewBox="0 0 100 90" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                  <defs>
                    <linearGradient id="rodizio-price-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor={accent} stopOpacity=".44" />
                      <stop offset=".72" stopColor={accent} stopOpacity=".14" />
                      <stop offset="1" stopColor={accent} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={areaPath} fill="url(#rodizio-price-fill)" />
                  <path d={path} fill="none" stroke={accent} strokeLinecap="round" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
                  {normalized.map((point, i) => (
                    <circle key={`${point.label}-${i}`} cx={point.x} cy={point.y} r="1.8" fill={accent} vectorEffect="non-scaling-stroke" />
                  ))}
                  {selectedPoint ? (
                    <circle cx={selectedPoint.x} cy={selectedPoint.y} r="3.2" fill="#0b1f18" stroke="#fff" strokeWidth="1.7" vectorEffect="non-scaling-stroke" />
                  ) : null}
                </svg>
              ) : (
                <div className="grid h-full place-items-center text-xs text-zinc-300/70">Histórico indisponível</div>
              )}

              {selectedPoint ? (
                <div
                  className="absolute rounded-lg border border-emerald-400/20 bg-[#03111b]/95 px-3 py-2 text-xs shadow-2xl"
                  style={{
                    left: `${Math.min(78, Math.max(6, selectedPoint.x))}%`,
                    top: `${Math.min(58, Math.max(8, selectedPoint.y))}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div className="text-zinc-200/80">{selectedPoint.label}</div>
                  <div className="font-black" style={{ color: accent }}>{formatBRL(selectedPoint.value)}</div>
                </div>
              ) : null}

              <div className="absolute inset-x-0 bottom-0 flex justify-between px-1 text-[11px] text-zinc-300/80">
                {validPoints.map((point, i) => (
                  <span key={`${point.label}-${i}`}>{point.label}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {temVariacao ? (
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-3">
            {[
              ["Mínimo", calculated.min, accent],
              ["Médio", calculated.avg, "#ffffff"],
              ["Máximo", calculated.max, "#fb7185"],
            ].map(([label, value, color]) => (
              <div key={label as string} className="rounded-2xl border border-white/12 bg-slate-950/42 px-4 py-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.04)]">
                <div className="text-xs text-zinc-300/80">{label}</div>
                <div className="mt-1 text-lg font-black" style={{ color: color as string }}>{formatBRL(value as number | null)}</div>
                <div className="mt-1 text-xs text-zinc-200/80">dados do produto</div>
              </div>
            ))}
            <div className="flex items-center gap-2 text-sm text-zinc-200/78 sm:col-span-3">
              <ShieldCheck className="h-5 w-5" style={{ color: accent }} />
              Monitoramento diário em milhares de lojas parceiras
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="rounded-2xl border border-white/12 bg-slate-950/42 px-4 py-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.04)]">
              <div className="text-xs text-zinc-300/80">Preço atual</div>
              <div className="mt-1 text-2xl font-black" style={{ color: accent }}>
                {formatBRL(calculated.min ?? calculated.avg ?? calculated.max)}
              </div>
              <div className="mt-1 text-xs text-zinc-200/80">Novo no radar — ainda sem variação de preço registrada</div>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-200/78">
              <ShieldCheck className="h-5 w-5" style={{ color: accent }} />
              A partir de agora acompanhamos cada mudança de preço deste item
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
