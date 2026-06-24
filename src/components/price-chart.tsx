"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export interface ChartPoint { data: string; preco: number }

/** Gráfico de histórico de preço. Verde neon (acento de "preço/oferta") + área preenchida. */
export function PriceChart({ points, color = "#22E06B", height = 224 }:
  { points: ChartPoint[]; color?: string; height?: number }) {
  if (points.length < 2) {
    return (
      <div className="grid place-items-center text-xs text-muted" style={{ height }}>
        Histórico insuficiente — volte após algumas coletas.
      </div>
    );
  }
  const gid = `grad-${color.replace("#", "")}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#23232e" strokeDasharray="3 3" />
        <XAxis dataKey="data" tick={{ fill: "#8b8b9a", fontSize: 11 }} stroke="#23232e" minTickGap={24} />
        <YAxis tick={{ fill: "#8b8b9a", fontSize: 11 }} stroke="#23232e" width={56}
          tickFormatter={(v) => `R$${Math.round(v)}`} domain={["auto", "auto"]} />
        <Tooltip
          contentStyle={{ background: "#16161f", border: "1px solid #23232e", borderRadius: 12, color: "#e7e7ee" }}
          formatter={(v: number) => [`R$ ${v.toFixed(2)}`, "Preço"]} />
        <Area type="monotone" dataKey="preco" stroke={color} strokeWidth={2.5} fill={`url(#${gid})`} dot={false}
          activeDot={{ r: 4, fill: color }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
