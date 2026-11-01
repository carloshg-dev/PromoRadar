import { contemTermoProibido } from "./blacklist-nicho";
import { DEFAULT_CATALOG_PRICE_LIMIT, validProductImage } from "./catalog-policy";

export interface ShopifyVariantPrice { price?: string; compare_at_price?: string | null; available?: boolean }

/** Preço atual e referência pertencem à mesma variante, disponível na loja. */
export function shopifyAvailablePrice(variants: readonly ShopifyVariantPrice[]) {
  let best: { precoAtual: number; precoOriginal: number | null } | null = null;
  for (const variant of variants) {
    const price = Number(variant.price), reference = Number(variant.compare_at_price);
    if (variant.available !== true || !Number.isFinite(price) || price <= 0 || (best && price >= best.precoAtual)) continue;
    best = { precoAtual: price, precoOriginal: Number.isFinite(reference) && reference > price ? reference : null };
  }
  return best;
}

interface CatalogCandidate { skuBase: string; titulo: string; urlProduto: string; imagemUrl: string | null; precoAtual: number }

/** Top-N limitado: preço real mais acessível primeiro, sem piso de volume por loja. */
export function lomadeeAffordableCandidates<T extends CatalogCandidate>(items: readonly T[], limit: number, exclude?: RegExp): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (!item.skuBase || !item.titulo || !item.urlProduto || !validProductImage(item.imagemUrl)
      || !Number.isFinite(item.precoAtual) || item.precoAtual <= 0 || item.precoAtual > DEFAULT_CATALOG_PRICE_LIMIT
      || contemTermoProibido(item.titulo) || exclude?.test(item.titulo) || seen.has(item.skuBase)) return false;
    seen.add(item.skuBase); return true;
  }).sort((a, b) => a.precoAtual - b.precoAtual || a.skuBase.localeCompare(b.skuBase)).slice(0, Math.max(0, Math.min(250, limit)));
}
