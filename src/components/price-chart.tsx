"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export interface ChartPoint { data: string; preco: number }

/** Histórico estável durante a montagem e mudanças de largura. */
export function PriceChart({ points, color = "#1b6549", height = 224 }:
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
        <CartesianGrid stroke="#dbe3d7" strokeDasharray="3 3" />
        <XAxis dataKey="data" tick={{ fill: "#5b6b61", fontSize: 11 }} stroke="#dbe3d7" minTickGap={24} />
        <YAxis tick={{ fill: "#5b6b61", fontSize: 11 }} stroke="#dbe3d7" width={56}
          tickFormatter={(v) => `R$${Math.round(v)}`} domain={["auto", "auto"]} />
        <Tooltip
          contentStyle={{ background: "#ffffff", border: "1px solid #dbe3d7", borderRadius: 12, color: "#20372d" }}
          formatter={(v: number) => [`R$ ${v.toFixed(2)}`, "Preço"]} />
        <Area type="monotone" dataKey="preco" stroke={color} strokeWidth={2.5} fill={`url(#${gid})`} dot={false} isAnimationActive={false}
          activeDot={{ r: 4, fill: color }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
