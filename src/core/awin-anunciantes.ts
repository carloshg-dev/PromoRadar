import type { CategoriaSlug } from "@/core/domain/types";

/**
 * ANUNCIANTES AWIN — módulo isolado (Núcleo + Módulos): fonte ÚNICA da verdade
 * dos anunciantes APROVADOS na Awin. Alimenta:
 *   • awin.adapter — ingestão multi-loja do feed de produtos (cada anunciante
 *     vira uma LOJA própria no banco, com nome/slug/logo);
 *   • src/lib/afiliados.ts — wrapper de deeplink por domínio + ehLinkMonetizado.
 * Anunciante novo aprovado? Adiciona UMA entrada aqui e o resto acontece.
 *
 * MIDs são PÚBLICOS (vão na URL do deeplink — awinmid). O envKey tenta ler um
 * override do .env.local, mas nomes com "&" e "'" (ex. AWIN_MID_L'OCCITANE)
 * NÃO são parseados pelo dotenv → o fallback hardcoded é quem garante.
 */

export type AwinIngestao =
  | "adapter"       // entra pela coleta multi-loja do awin.adapter
  | "cron-proprio"; // tem pipeline dedicado (ex. Diesel: scripts/ingest-awin-diesel.js)

export interface AwinAnunciante {
  mid: string;              // awinmid (fallback público)
  envKey: string;           // override opcional no .env.local
  nome: string;             // exibição (vira lojas.nome)
  slug: string;             // lojas.slug
  dominios: string[];       // hosts (sem www) p/ wrapper de deeplink de links manuais
  baseUrl: string;
  categoria: CategoriaSlug; // bucket padrão v1 (refino por-produto = fase 2)
  ingestao: AwinIngestao;
  maxFeeds?: number;        // teto de feeds por rodada (default 2)
  maxProdutos?: number;     // teto de produtos por rodada (default 500)
}

export const AWIN_ANUNCIANTES: AwinAnunciante[] = [
  {
    mid: "18879", envKey: "AWIN_MID_AliexpressBR&LATAM", nome: "AliExpress", slug: "aliexpress",
    dominios: ["aliexpress.com", "pt.aliexpress.com"], baseUrl: "https://pt.aliexpress.com",
    categoria: "ofertas-parceiros", ingestao: "adapter", maxFeeds: 4, maxProdutos: 2000,
  },
  {
    mid: "78382", envKey: "AWIN_MID_PANASONICBR", nome: "Panasonic", slug: "panasonic",
    dominios: ["panasonic.com.br", "loja.panasonic.com.br"], baseUrl: "https://loja.panasonic.com.br",
    categoria: "ofertas-parceiros", ingestao: "adapter",
  },
  {
    mid: "17874", envKey: "AWIN_MID_EXTRA", nome: "Extra", slug: "extra",
    dominios: ["extra.com.br"], baseUrl: "https://www.extra.com.br",
    categoria: "ofertas-parceiros", ingestao: "adapter",
  },
  {
    mid: "17891", envKey: "AWIN_MID_L'OCCITANE", nome: "L'Occitane", slug: "loccitane",
    dominios: ["loccitane.com.br", "br.loccitane.com"], baseUrl: "https://br.loccitane.com",
    categoria: "skincare", ingestao: "adapter",
  },
  {
    mid: "30615", envKey: "AWIN_MID_SPICY", nome: "Spicy", slug: "spicy",
    dominios: ["spicy.com.br"], baseUrl: "https://www.spicy.com.br",
    categoria: "ofertas-parceiros", ingestao: "adapter",
  },
  {
    mid: "76888", envKey: "AWIN_MID_DOCEBELEZA", nome: "Doce Beleza", slug: "docebeleza",
    dominios: ["docebeleza.com.br"], baseUrl: "https://www.docebeleza.com.br",
    categoria: "ofertas-parceiros", ingestao: "adapter", // catálogo misto (perfume+make+skin); split por produto = fase 2
  },
  {
    mid: "117737", envKey: "AWIN_MID_SANAVITA", nome: "Sanavita", slug: "sanavita",
    dominios: ["sanavita.com.br"], baseUrl: "https://www.sanavita.com.br",
    categoria: "fit-outros", ingestao: "adapter",
  },
  {
    mid: "17665", envKey: "AWIN_MID_CARREFOURBR", nome: "Carrefour", slug: "carrefour",
    dominios: ["carrefour.com.br"], baseUrl: "https://www.carrefour.com.br",
    categoria: "ofertas-parceiros", ingestao: "adapter",
  },
  {
    mid: "17621", envKey: "AWIN_MID_PONTOFRIO", nome: "Ponto Frio", slug: "pontofrio",
    dominios: ["pontofrio.com.br"], baseUrl: "https://www.pontofrio.com.br",
    categoria: "ofertas-parceiros", ingestao: "adapter",
  },
  {
    mid: "26113", envKey: "AWIN_MID_POLISHOP", nome: "Polishop", slug: "polishop",
    dominios: ["polishop.com.br"], baseUrl: "https://www.polishop.com.br",
    categoria: "ofertas-parceiros", ingestao: "adapter",
  },
  {
    // Diesel fica FORA do adapter: scripts/ingest-awin-diesel.js (cron 06:30) já
    // cuida dela com lógica própria (inversão search/rrp, dedup por título, split
    // perfume/moda). Incluir aqui = ingestão DUPLA (skus awin-* vs diesel-*).
    mid: "17846", envKey: "AWIN_MID_DieselBR", nome: "Diesel", slug: "diesel",
    dominios: ["diesel.com.br"], baseUrl: "https://www.diesel.com.br",
    categoria: "moda", ingestao: "cron-proprio",
  },
  {
    mid: "17698", envKey: "AWIN_MID_OlympikusBR", nome: "Olympikus", slug: "olympikus",
    dominios: ["olympikus.com.br"], baseUrl: "https://www.olympikus.com.br",
    categoria: "moda", ingestao: "adapter",
  },
];

/** MID efetivo (override do .env quando parseável → fallback público). */
export function awinMid(a: AwinAnunciante): string {
  return process.env[a.envKey]?.trim() || a.mid;
}

/** Logo oficial do anunciante no CDN da Awin (lojas.logo_url + Barra de lojas). */
export function awinLogoUrl(mid: string): string {
  return `https://ui.awin.com/images/upload/merchant/profile/${mid}.png`;
}

/** mid → anunciante, SÓ os de ingestão via adapter (cron-proprio fica fora). */
export function anunciantesDoAdapter(): Map<string, AwinAnunciante> {
  return new Map(
    AWIN_ANUNCIANTES.filter((a) => a.ingestao === "adapter").map((a) => [awinMid(a), a]),
  );
}

/** host → mid, p/ o wrapper de deeplink (TODOS os anunciantes, incl. cron-proprio). */
export function midsPorDominio(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const a of AWIN_ANUNCIANTES) for (const d of a.dominios) out[d] = awinMid(a);
  return out;
}
