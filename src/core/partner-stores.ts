import { validProductImage, verifiedBrlPrice } from "./catalog-policy";

export interface PartnerStore { slug: string; nome: string; logoUrl: string | null }
interface StoreMetadata extends PartnerStore { baseUrl: string | null; rede: string | null }

/** Navegação das parceiras ativas; não confunde exclusão dos destaques com falta de catálogo. */
export function partnerStores(stores: readonly StoreMetadata[]): PartnerStore[] {
  const selected = new Set<string>();
  return stores.filter(store => {
    if (!store.rede || !verifiedBrlPrice(store.slug) || selected.has(store.slug)) return false;
    selected.add(store.slug); return true;
  }).slice(0, 24).map(store => {
    let logoUrl = validProductImage(store.logoUrl) && store.logoUrl?.startsWith("https:") ? store.logoUrl : null;
    if (!logoUrl && store.baseUrl) {
      try {
        const base = new URL(store.baseUrl);
        if (["http:", "https:"].includes(base.protocol) && !base.username && !base.password) {
          logoUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(base.hostname)}&sz=128`;
        }
      } catch { /* A marca continua identificada pelo nome. */ }
    }
    return { slug: store.slug, nome: store.nome, logoUrl };
  });
}
