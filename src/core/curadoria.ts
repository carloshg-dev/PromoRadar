import type { Produto } from "@/core/domain/types";
import { formatBRL } from "@/lib/utils";

/**
 * CURADORIA v4.0 — o "Scoring Engine" da Máquina de Conteúdo. NÃO recalcula nada
 * pesado: parte do `promo_score` (já pronto na coleta) e sobrepõe a RELEVÂNCIA-
 * PRA-POST (o que "posta bem" ≠ o que rankeia no site). Puro e testável — a
 * seleção Top-N mora em produtos.repo (top5DoDia), que só traz ~120 linhas.
 */

/** Peso de relevância de POST por categoria (0-100). Tech/beleza/eletro puxam
 *  engajamento; acessório/genérico rende menos. Ajustável sem tocar no resto. */
const PESO_CATEGORIA: Record<string, number> = {
  "placas-de-video": 100, processadores: 96, notebooks: 95, monitores: 86,
  ssds: 80, "memorias-ram": 76, "placas-mae": 72, fontes: 66, gabinetes: 62, perifericos: 76,
  tvs: 96, geladeiras: 86, "ar-condicionado": 86, "maquinas-lavar": 82, fogoes: 70, "micro-ondas": 70,
  "fones-bluetooth": 90, smartwatch: 90, "caixa-de-som": 80, "power-bank": 70, "webcam-acao": 76,
  "perfumes-importados": 96, "perfumes-arabes": 86, skincare: 90, maquiagem: 86, cabelos: 76,
  "whey-protein": 82, creatina: 80, "pre-treino": 74, "fit-outros": 55,
  moda: 66, "ofertas-parceiros": 60,
};
export function pesoCategoria(slug?: string | null): number {
  return slug ? (PESO_CATEGORIA[slug] ?? 58) : 50;
}

/**
 * Pontuação de CONTEÚDO (0-100), RESISTENTE A ÂNCORA FALSA. Descoberta no teste:
 * o `promo_score`/`desconto` brutos são inflados por "preços de" fake (Shopee com
 * 90% off que não é real). Então:
 *   • desconto CRÍVEL (0.30) — vale até ~70%; acima de 75% penaliza forte (fake);
 *   • % abaixo da MÉDIA HISTÓRICA (0.25) — sinal HONESTO, o vendedor não fabrica;
 *   • promo_score (0.25) — a base, mas com peso menor por ser gameável;
 *   • relevância de categoria (0.20).
 */
export function scoreConteudo(o: Produto): number {
  const promo = clamp(o.promoScore ?? 0, 0, 100);
  const d = clamp(o.descontoPct ?? 0, 0, 100);
  // crível: sobe até 70%, despenca acima de 75% (âncora inflada)
  const descCredivel = d <= 70 ? (d / 70) * 100 : Math.max(0, 100 - (d - 70) * 5);
  const media = clamp(abaixoDaMedia(o) ?? 0, 0, 100); // histórico > "de" do vendedor
  const cat = pesoCategoria(o.categoriaSlug);
  return Math.round(descCredivel * 0.30 + media * 0.25 + promo * 0.25 + cat * 0.20);
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

/** % abaixo da média histórica (hook mais forte que o desconto de vitrine). */
function abaixoDaMedia(o: Produto): number | null {
  const avg = o.precoAvgHist, atual = o.precoAtual;
  if (!avg || !atual || avg <= atual) return null;
  return Math.round((1 - atual / avg) * 100);
}

/** Título curto p/ legenda (corta em palavra, ~56 chars). */
function tituloCurto(t: string, max = 56): string {
  if (t.length <= max) return t;
  const corte = t.lastIndexOf(" ", max);
  return t.slice(0, corte > 20 ? corte : max).trim() + "…";
}

const HASHTAG_CAT: Record<string, string> = {
  "placas-de-video": "#placadevideo", processadores: "#processador", notebooks: "#notebook",
  tvs: "#smarttv", "fones-bluetooth": "#fonebluetooth", smartwatch: "#smartwatch",
  "perfumes-importados": "#perfume", "perfumes-arabes": "#perfumearabe", skincare: "#skincare",
  maquiagem: "#maquiagem", "whey-protein": "#whey", geladeiras: "#geladeira",
};

/**
 * LEGENDA persuasiva — 100% TEMPLATE (custo-zero, determinística). Usa DADO REAL
 * (desconto, preço, histórico, PromoScore), que convence mais que IA genérica.
 */
export function legendaPersuasiva(o: Produto): string {
  // LIDERA COM O DESCONTO, não com a categoria: o categoria_slug de marketplace é
  // não-confiável (cabo HDMI vira "Notebook"). Desconto/economia é sempre correto.
  const desc = o.descontoPct ? `−${o.descontoPct}%` : "OFERTA";
  const de = o.precoOriginal && o.precoOriginal > (o.precoAtual ?? 0)
    ? `De ~${formatBRL(o.precoOriginal)}~ por ` : "";
  const economia = o.precoOriginal && o.precoAtual && o.precoOriginal > o.precoAtual
    ? `  ·  economize ${formatBRL(o.precoOriginal - o.precoAtual)}` : "";
  const media = abaixoDaMedia(o);
  const linhaHist = media ? `📉 ${media}% abaixo da média histórica · ` : "📊 ";
  const tags = ["#promodetec", HASHTAG_CAT[o.categoriaSlug ?? ""], "#oferta", "#promoção", "#achadododia"]
    .filter(Boolean).join(" ");

  return [
    `🔥 ACHADO DO DIA · ${desc}`,
    ``,
    `${tituloCurto(o.titulo)}`,
    ``,
    `💸 ${de}${formatBRL(o.precoAtual)}${economia}`,
    `${linhaHist}PromoScore ${Math.round(o.promoScore ?? 0)}/100`,
    `🛒 ${o.lojaNome}  →  promodetec.vercel.app`,
    ``,
    tags,
  ].join("\n");
}
