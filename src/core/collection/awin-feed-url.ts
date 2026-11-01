const REQUIRED_COLUMNS = ["product_name", "aw_deep_link", "aw_product_id", "merchant_image_url", "aw_image_url", "search_price", "currency", "rrp_price", "product_price_old", "brand_name", "merchant_name"];

/** Pede a moeda à Awin; nunca a deduz do país, do anunciante ou do preço. */
export function awinFeedWithCurrency(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" || !["datafeed.api.productserve.com", "productdata.awin.com"].includes(url.hostname) || !url.pathname.startsWith("/datafeed/download/")) return value;
  const parts = url.pathname.split("/").filter(Boolean);
  const at = parts.findIndex((part, index) => index >= 2 && index % 2 === 0 && part === "columns");
  const columns = at >= 0 ? decodeURIComponent(parts[at + 1] ?? "").split(",").filter(Boolean) : [];
  const requested = encodeURIComponent([...new Set([...columns, ...REQUIRED_COLUMNS])].join(","));
  if (at >= 0) parts[at + 1] = requested;
  else parts.push("columns", requested);
  url.pathname = `/${parts.join("/")}/`;
  return url.href;
}
