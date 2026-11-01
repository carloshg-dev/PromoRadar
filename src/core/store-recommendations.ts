import type { Produto } from "./domain/types";
import { HOME_HIGHLIGHT_PRICE_LIMIT, validProductImage, verifiedBrlPrice } from "./catalog-policy";
import { hasRecentPrice } from "./offer-freshness";

/** Alternativas mantêm o orçamento e a identidade real de cada loja. */
export function selectStoreRecommendations(items: readonly Produto[], maxPrice: number | null, now = Date.now(), limit = 12): Produto[] {
  const ceiling = Math.min(maxPrice ?? HOME_HIGHLIGHT_PRICE_LIMIT, HOME_HIGHLIGHT_PRICE_LIMIT);
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.id) || !item.emEstoque || !verifiedBrlPrice(item.lojaSlug) || !validProductImage(item.imagemUrl)
      || item.precoAtual === null || !Number.isFinite(item.precoAtual) || item.precoAtual <= 0 || item.precoAtual > ceiling
      || !hasRecentPrice(item.atualizadoEm, now)) return false;
    seen.add(item.id); return true;
  }).sort((a, b) => a.precoAtual! - b.precoAtual! || a.id.localeCompare(b.id)).slice(0, Math.max(0, Math.min(24, limit)));
}
