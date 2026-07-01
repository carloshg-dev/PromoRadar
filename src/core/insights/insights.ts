/**
 * Motor de insights automáticos — transforma números em frases úteis para o usuário.
 * Pura (sem I/O), fácil de testar. Usada na página de produto.
 */

import type { Produto } from "@/core/domain/types";

export interface PriceTrend {
  /** "queda" | "alta" | "estavel" comparando preço atual vs. média recente */
  direcao: "queda" | "alta" | "estavel";
  /** variação % vs. a média histórica */
  variacaoPct: number;
}

export interface Insight {
  tipo: "positivo" | "neutro" | "alerta";
  icon: string;
  texto: string;
}

export interface SeriePonto { preco: number; coletado_em: string }

export function calcularTendencia(p: Produto, serie: SeriePonto[]): PriceTrend {
  const atual = p.precoAtual ?? 0;
  const avg = p.precoAvgHist ?? atual;
  if (!avg || !atual) return { direcao: "estavel", variacaoPct: 0 };
  const variacao = Math.round(((atual - avg) / avg) * 100);
  // direção pela inclinação dos últimos pontos, se houver
  let direcao: PriceTrend["direcao"] = "estavel";
  if (serie.length >= 2) {
    const ult = serie[serie.length - 1]!.preco;
    const penult = serie[serie.length - 2]!.preco;
    if (ult < penult) direcao = "queda";
    else if (ult > penult) direcao = "alta";
  } else {
    if (variacao < -2) direcao = "queda";
    else if (variacao > 2) direcao = "alta";
  }
  return { direcao, variacaoPct: variacao };
}

export function gerarInsights(p: Produto, serie: SeriePonto[]): Insight[] {
  const out: Insight[] = [];
  const atual = p.precoAtual ?? 0;

  // Menor preço histórico — só vale com variação real (min < max)
  const temHistorico = p.precoMinHist != null && p.precoMaxHist != null && p.precoMaxHist > p.precoMinHist;
  if (temHistorico && p.precoMinHist != null && atual > 0) {
    if (atual <= p.precoMinHist) {
      out.push({ tipo: "positivo", icon: "🏆", texto: "Este é o menor preço já registrado para este produto." });
    } else {
      const acima = Math.round(((atual - p.precoMinHist) / p.precoMinHist) * 100);
      if (acima <= 5) out.push({ tipo: "positivo", icon: "🎯", texto: `A apenas ${acima}% do menor preço histórico.` });
      else out.push({ tipo: "neutro", icon: "📉", texto: `Já esteve ${acima}% mais barato (mínimo de ${brl(p.precoMinHist)}).` });
    }
  }

  // Posição vs. média
  const t = calcularTendencia(p, serie);
  if (p.precoAvgHist != null && atual > 0) {
    if (t.variacaoPct < -3) out.push({ tipo: "positivo", icon: "💰", texto: `Está ${Math.abs(t.variacaoPct)}% abaixo da média histórica.` });
    else if (t.variacaoPct > 5) out.push({ tipo: "alerta", icon: "⚠️", texto: `Está ${t.variacaoPct}% acima da média — talvez valha esperar.` });
    else out.push({ tipo: "neutro", icon: "➖", texto: "Preço próximo da média histórica." });
  }

  // Tendência recente
  if (serie.length >= 2) {
    if (t.direcao === "queda") out.push({ tipo: "positivo", icon: "↘️", texto: "Tendência recente de queda no preço." });
    else if (t.direcao === "alta") out.push({ tipo: "alerta", icon: "↗️", texto: "Tendência recente de alta no preço." });
  }

  if (!out.length) out.push({ tipo: "neutro", icon: "⏳", texto: "Coletando histórico — insights melhoram a cada atualização." });
  return out;
}

function brl(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
