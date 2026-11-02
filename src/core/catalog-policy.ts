/** Teto de exposição; nunca modifica o preço recebido da loja. */
export const DEFAULT_CATALOG_PRICE_LIMIT = 1000;
export const HOME_HIGHLIGHT_PRICE_LIMIT = 300;
export const CATALOG_PRICE_OPTIONS = [20, 50, 100, 300, 500, 1000, 2000, 5000] as const;
// Legado AliExpress contém conversão estimada sem moeda de origem persistida.
// Liberar após reingestão BRL com proveniência; preservar os registros para auditoria.
export const UNVERIFIED_BRL_STORES = ["aliexpress"] as const;
export function verifiedBrlPrice(store: string): boolean {
  return !UNVERIFIED_BRL_STORES.some(slug => slug === store);
}

export function catalogPriceLimit(value: unknown): number | null {
  if (value === "todos") return null;
  const price = typeof value === "string" ? Number(value) : value;
  return typeof price === "number" && CATALOG_PRICE_OPTIONS.some(option => option === price)
    ? price : DEFAULT_CATALOG_PRICE_LIMIT;
}

/** Fotos genéricas e rota Dufrio com 404 confirmado em 02/11; filtrar antes de paginar. */
export const GENERIC_IMAGE_PATTERNS = ["%noimage%", "%no-image%", "%placeholder%", "%sem-imagem%", "%image-not-found%",
  "%://www.dufrio.com.br/media/catalog/product/%", "%://dufrio.com.br/media/catalog/product/%"] as const;

export function validProductImage(value: string | null | undefined): boolean {
  if (!value || /no[-_]?image|placeholder|sem[-_]?imagem|image[-_]?not[-_]?found/i.test(value)) return false;
  try {
    const url = new URL(value);
    const unavailableLegacy = ["dufrio.com.br", "www.dufrio.com.br"].includes(url.hostname)
      && url.pathname.toLowerCase().startsWith("/media/catalog/product/");
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password && !unavailableLegacy;
  } catch { return false; }
}
