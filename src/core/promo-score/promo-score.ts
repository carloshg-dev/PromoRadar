/**
 * PromoScore — algoritmo proprietário de classificação de oportunidades (0–100).
 *
 * Princípio: um bom "score" não é só o desconto anunciado (que pode ser falso),
 * mas o quão bom é o preço atual *em relação ao histórico real* do produto.
 *
 * O score é uma média ponderada, transparente e auditável, de 5 sinais:
 *
 *   1. position  (35%) — onde o preço atual cai entre o mínimo e o máximo históricos.
 *                        Preço == mínimo histórico → 100. Preço == máximo → 0.
 *   2. vsAvg     (25%) — quão abaixo da média histórica está o preço atual.
 *   3. realDisc  (20%) — desconto REAL medido contra a média (não o "de/por" da loja),
 *                        o que neutraliza descontos fabricados.
 *   4. rarity    (10%) — raridade: promoções que aparecem pouco valem mais.
 *   5. freshness ( 5%) — variação recente: queda recente de preço pontua mais.
 *   + stock      ( 5%) — disponibilidade em estoque.
 *
 * Sem histórico suficiente, caímos para um score conservador baseado só no
 * desconto anunciado, descontado por incerteza.
 */

import type { PriceStats } from "@/core/domain/types";

export interface PromoScoreInput {
  precoAtual: number;
  /** Preço "de" anunciado pela loja (pode ser inflado/ausente). */
  precoOriginal?: number | null;
  emEstoque: boolean;
  stats: PriceStats;
  /** Preço anterior conhecido (penúltima observação), p/ medir variação recente. */
  precoAnterior?: number | null;
}

export interface PromoScoreResult {
  score: number;            // 0..100
  tier: ScoreTier;
  /** Desconto real (%) medido contra a média histórica; null se sem histórico. */
  descontoReal: number | null;
  breakdown: Record<string, number>;
}

export type ScoreTier = "excepcional" | "excelente" | "boa" | "comum";

const WEIGHTS = {
  position: 0.35,
  vsAvg: 0.25,
  realDisc: 0.2,
  rarity: 0.1,
  freshness: 0.05,
  stock: 0.05,
} as const;

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export function tierFor(score: number): ScoreTier {
  if (score >= 95) return "excepcional";
  if (score >= 80) return "excelente";
  if (score >= 60) return "boa";
  return "comum";
}

export function computePromoScore(input: PromoScoreInput): PromoScoreResult {
  const { precoAtual, precoOriginal, emEstoque, stats, precoAnterior } = input;
  const { min, max, avg, promoCount = 0, sampleSize = 0 } = stats;

  const stockSignal = emEstoque ? 100 : 0;

  // Sem histórico confiável: fallback conservador no desconto anunciado.
  if (!avg || !min || !max || sampleSize < 3) {
    const anunciado =
      precoOriginal && precoOriginal > precoAtual
        ? (1 - precoAtual / precoOriginal) * 100
        : 0;
    // Penaliza incerteza: no máximo 70 sem histórico.
    const score = clamp(Math.round(anunciado * 0.7 * 0.9 + (emEstoque ? 7 : 0)), 0, 70);
    return {
      score,
      tier: tierFor(score),
      descontoReal: null,
      breakdown: { anunciado: Math.round(anunciado), incerteza: 1, stock: stockSignal },
    };
  }

  // 1. Posição no range histórico (100 = no mínimo histórico).
  const range = Math.max(max - min, 0.01);
  const position = clamp((1 - (precoAtual - min) / range) * 100);

  // 2. Quão abaixo da média (cap a 30% abaixo = 100).
  const belowAvg = (1 - precoAtual / avg) * 100; // positivo = abaixo da média
  const vsAvg = clamp((belowAvg / 30) * 100);

  // 3. Desconto real contra a média histórica.
  const descontoReal = Math.round(belowAvg);
  const realDisc = clamp((Math.max(belowAvg, 0) / 40) * 100);

  // 4. Raridade: poucas promoções no histórico => mais valiosa.
  const promoRatio = sampleSize > 0 ? promoCount / sampleSize : 1;
  const rarity = clamp((1 - promoRatio) * 100);

  // 5. Variação recente: queda recente pontua.
  let freshness = 50;
  if (precoAnterior && precoAnterior > 0) {
    const dropPct = (1 - precoAtual / precoAnterior) * 100;
    freshness = clamp(50 + dropPct * 5);
  }

  const breakdown = {
    position: Math.round(position),
    vsAvg: Math.round(vsAvg),
    realDisc: Math.round(realDisc),
    rarity: Math.round(rarity),
    freshness: Math.round(freshness),
    stock: stockSignal,
  };

  const score = clamp(
    Math.round(
      position * WEIGHTS.position +
        vsAvg * WEIGHTS.vsAvg +
        realDisc * WEIGHTS.realDisc +
        rarity * WEIGHTS.rarity +
        freshness * WEIGHTS.freshness +
        stockSignal * WEIGHTS.stock,
    ),
  );

  return { score, tier: tierFor(score), descontoReal, breakdown };
}
