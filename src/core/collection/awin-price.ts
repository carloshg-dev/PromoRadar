/** Aceita formatos numéricos do feed; texto ambíguo não vira um preço. */
export function parseFeedPrice(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const text = value.trim();
  if (!/^(?:\d+(?:\.\d{1,2})?|\d+(?:,\d{1,2})|\d{1,3}(?:\.\d{3})+,\d{2}|\d{1,3}(?:,\d{3})+\.\d{2})$/.test(text)) return null;
  const normalized = text.includes(",") && /,\d{1,2}$/.test(text)
    ? text.replace(/\./g, "").replace(",", ".") : text.replace(/,/g, "");
  const price = Number(normalized);
  return Number.isFinite(price) && price > 0 ? price : null;
}

export function awinPrice(row: Record<string, string>): { current: number; reference: number | null } | null {
  // A moeda de cada item deve vir declarada no feed; não inferir pelo programa.
  if (row.currency?.trim().toUpperCase() !== "BRL") return null;
  const current = parseFeedPrice(row.search_price);
  if (current === null) return null;
  const reference = parseFeedPrice(row.rrp_price) ?? parseFeedPrice(row.product_price_old);
  return { current, reference: reference !== null && reference > current ? reference : null };
}
