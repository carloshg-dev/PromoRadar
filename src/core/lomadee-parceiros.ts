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

export const LOMADEE_PARCEIROS: LomadeeParceiro[] = [
  {
    matchMarca: /sieno/i,
    slug: "sieno",
    nome: "Sieno Perfumes",
    baseUrl: "https://www.sieno.com.br",
    plataforma: "shopify",
    categoria: "perfumes-importados",
  },
  {
    // SUBSTITUIU a Casa do Fitness (04/07): aquela era VTEX cloud-bloqueada (403 no
    // Actions + intelligent-search vazia). A NutriBullet é Shopify (products.json
    // aberto, ~88 produtos com foto+preço) — coleta limpa na nuvem. Não é whey/
    // creatina, é linha de nutrição (liquidificadores/extratores), mas é volume fit
    // REAL e monetizado. Das marcas fit da Lomadee, a única open-platform viável.
    matchMarca: /nutribullet/i,
    slug: "nutribullet",
    nome: "NutriBullet",
    baseUrl: "https://www.nutribulletbrasil.com.br",
    plataforma: "shopify",
    categoria: "fit-outros",
    maxProdutos: 100,
  },
  {
    matchMarca: /bio ?bran/i,
    slug: "biobran",
    nome: "Bio Bran",
    baseUrl: "https://biobran.com.br",
    plataforma: "woo",
    categoria: "fit-outros",
    // kits de ATACADO p/ revendedor (ex.: "50 Unidades") não são oferta B2C
    excluir: /revendedor|atacado|\b\d{2,} unidades\b/i,
  },
];

/** Logo oficial da marca no CDN da Lomadee (lojas.logo_url + Barra de lojas). */
export function lomadeeLogoUrl(brandId: string): string {
  return `https://cdn.lomadee.com.br/logos/${brandId}/logo`;
}
