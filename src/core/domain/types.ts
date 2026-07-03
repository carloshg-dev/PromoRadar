// Tipos de domínio centrais — fonte única de verdade para entidades do PromoDetec.

export type CategoriaSlug =
  | "placas-de-video" | "processadores" | "ssds" | "memorias-ram"
  | "fontes" | "placas-mae" | "monitores" | "notebooks"
  | "perifericos" | "gabinetes"
  // vertical Mundo Fit (suplementos + acessórios)
  | "whey-protein" | "creatina" | "pre-treino" | "fit-outros"
  // vertical Casa & Eletro (eletrodomésticos)
  | "geladeiras" | "fogoes" | "maquinas-lavar" | "tvs" | "micro-ondas" | "ar-condicionado"
  // vertical Ferramentas (ferramentaria + oficina + EPI)
  | "furadeiras" | "serras" | "lixadeiras" | "compressores" | "ferramentas-manuais"
  | "chaves-soquetes" | "epi"
  // vertical Gadgets (eletrônicos do dia a dia)
  | "fones-bluetooth" | "smartwatch" | "caixa-de-som" | "power-bank" | "webcam-acao"
  // vertical Beleza (perfumes + cosméticos: maquiagem, skincare, cabelos)
  | "perfumes-importados" | "perfumes-arabes"
  | "maquiagem" | "skincare" | "cabelos"
  // vertical Moda (roupas, calçados e acessórios — alimentada pela Shopee)
  | "moda"
  // bucket NEUTRO p/ o feed de afiliados (Lomadee solto — fora das verticais/comparador)
  | "ofertas-parceiros";

// GUILHOTINA 02/07/2026: só adapters de loja MONETIZADA. Os 12 não-afiliados
// (kabum, pichau, terabyte, growth, soldiers, maxtitanium, integralmedica,
// darklab, havan, americanas, ferramentasgerais, lojadomecanico) foram
// desativados — arquivos preservados em adapters/; reativação = devolver a
// key aqui + registry + scrape.yml (ver comentário no registry).
export type AdapterKey = "mercadolivre" | "amazon" | "lomadee" | "awin";

/** Item normalizado que todo adapter de scraping deve produzir. */
export interface RawProduct {
  skuLoja: string;
  titulo: string;
  url: string;
  imagemUrl?: string | null;
  marca?: string | null;
  categoriaSlug: CategoriaSlug;
  precoAtual: number;
  precoOriginal?: number | null;
  emEstoque: boolean;
  /** Identidade de loja POR ITEM — p/ adapters multi-loja (ex. Awin: 1 feed →
   *  N anunciantes). Ausente → o item pertence à loja única do adapter. */
  loja?: { slug: string; nome: string; baseUrl?: string | null; logoUrl?: string | null } | null;
}

/** Estatísticas históricas usadas pelo PromoScore. */
export interface PriceStats {
  min: number | null;
  max: number | null;
  avg: number | null;
  /** nº de vezes que o produto esteve em promoção no histórico */
  promoCount?: number;
  /** nº total de observações de preço */
  sampleSize?: number;
}

export interface Produto {
  id: string;
  titulo: string;
  marca: string | null;
  url: string;
  imagemUrl: string | null;
  precoAtual: number | null;
  precoOriginal: number | null;
  descontoPct: number | null;
  promoScore: number | null;
  precoMinHist: number | null;
  precoMaxHist: number | null;
  precoAvgHist: number | null;
  emEstoque: boolean;
  atualizadoEm: string;
  lojaNome: string;
  lojaSlug: string;
  categoriaNome: string | null;
  categoriaSlug: string | null;
  categoriaEmoji: string | null;
}
