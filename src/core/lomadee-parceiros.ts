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
    matchMarca: /casa do fitness/i,
    slug: "casadofitness",
    nome: "Casa do Fitness",
    baseUrl: "https://www.casadofitness.com.br",
    plataforma: "vtex",
    categoria: "fit-outros",
    maxProdutos: 200,
    // termos AMPLOS p/ capturar o catálogo inteiro (~122 produtos, teto real da loja)
    buscasVtex: [
      { termo: "whey", slug: "whey-protein" },
      { termo: "creatina", slug: "creatina" },
      { termo: "pre treino", slug: "pre-treino" },
      { termo: "bcaa", slug: "fit-outros" },
      { termo: "glutamina", slug: "fit-outros" },
      { termo: "termogenico", slug: "fit-outros" },
      { termo: "hipercalorico", slug: "fit-outros" },
      { termo: "albumina", slug: "fit-outros" },
      { termo: "multivitaminico", slug: "fit-outros" },
      { termo: "suplemento", slug: "fit-outros" },
      { termo: "halter", slug: "fit-outros" },
      { termo: "anilha", slug: "fit-outros" },
      { termo: "barra", slug: "fit-outros" },
      { termo: "banco", slug: "fit-outros" },
      { termo: "esteira", slug: "fit-outros" },
      { termo: "bike", slug: "fit-outros" },
      { termo: "kettlebell", slug: "fit-outros" },
      { termo: "corda", slug: "fit-outros" },
      { termo: "caneleira", slug: "fit-outros" },
      { termo: "luva", slug: "fit-outros" },
      { termo: "academia", slug: "fit-outros" },
    ],
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
