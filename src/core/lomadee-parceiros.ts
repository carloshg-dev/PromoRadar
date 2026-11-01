import type { CategoriaSlug } from "@/core/domain/types";

/**
 * PARCEIROS LOMADEE — módulo isolado (Núcleo + Módulos): fonte ÚNICA das lojas
 * Lomadee cujo CATÁLOGO nós coletamos (dado = raspagem da loja; dinheiro = link
 * cunhado no encurtador oficial). Loja nova aprovada = 1 entrada aqui.
 *
 * AUTO-COMPLIANCE: o adapter só coleta se a marca estiver na lista da API
 * `/affiliate/brands` (pausada SOME da lista) E com o canal Comparador liberado
 * (canal PriceComparator com shortUrls preenchido).
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

// Novas lojas exigem catálogo, preços BRL e canal validados. Não há piso de volume:
// catálogos pequenos com achadinhos válidos também podem ser integrados.
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
