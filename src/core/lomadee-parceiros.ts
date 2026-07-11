import type { CategoriaSlug } from "@/core/domain/types";

/**
 * PARCEIROS LOMADEE — módulo isolado (Núcleo + Módulos): fonte ÚNICA das lojas
 * Lomadee cujo CATÁLOGO nós coletamos (dado = raspagem da loja; dinheiro = link
 * cunhado no encurtador oficial). Loja nova aprovada = 1 entrada aqui.
 *
 * AUTO-COMPLIANCE: o adapter só coleta se a marca estiver na lista da API
 * `/affiliate/brands` (pausada SOME da lista) E com o canal Comparador liberado
 * (channels[0].shortUrls preenchido) — a lição Época/Terabyte virou código.
 */

export type PlataformaLoja = "shopify" | "vtex" | "woo";

export interface LomadeeParceiro {
  /** casa com o `name` da marca na API (ex.: "Sieno Perfumes", "Bio Bran®") */
  matchMarca: RegExp;
  slug: string;
  nome: string;
  baseUrl: string;
  plataforma: PlataformaLoja;
  /** categoria padrão (VTEX pode rotear por busca; ver buscasVtex) */
  categoria: CategoriaSlug;
  /** termos de busca VTEX → categoria (só plataforma "vtex") */
  buscasVtex?: Array<{ termo: string; slug: CategoriaSlug }>;
  /** títulos a EXCLUIR (ex.: kits B2B de atacado da Bio Bran) */
  excluir?: RegExp;
  maxProdutos?: number; // default 150
}

// GUILHOTINA DE VOLUME (04/07): só catálogo de alto volume roda. NutriBullet (~88)
// e Bio Bran (~56) REMOVIDAS por não alcançarem o piso de 200 produtos válidos.
// Sieno (~246) sobrevive. Casa do Fitness já saíra (cloud-bloqueada).
export const LOMADEE_PARCEIROS: LomadeeParceiro[] = [
  {
    matchMarca: /sieno/i,
    slug: "sieno",
    nome: "Sieno Perfumes",
    baseUrl: "https://www.sieno.com.br",
    plataforma: "shopify",
    categoria: "perfumes-importados",
  },
];

/** Logo oficial da marca no CDN da Lomadee (lojas.logo_url + Barra de lojas). */
export function lomadeeLogoUrl(brandId: string): string {
  return `https://cdn.lomadee.com.br/logos/${brandId}/logo`;
}
