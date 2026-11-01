import { affiliateError, boundedJson } from "@/infrastructure/affiliates/http";

const BASE = "https://api.lomadee.com.br";
export const LOMADEE_PAGE_SIZE = 20;
export const lomadeeRecord = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};

interface ComparatorChannel { id: string | null; link: string; matchedBy: "channel_id" | "legacy_type_id" | "unconfigured" }

/** A configuração legada guarda o tipo. Resolva-o em uma única instância da
 * conta autenticada, sem alterar secrets nem aceitar outro tipo de canal. */
export function lomadeeComparatorChannel(value: unknown, expectedChannel?: string): ComparatorChannel | null {
  let selected: ComparatorChannel | null = null;
  for (const entry of Array.isArray(value) ? value : []) {
    const channel = lomadeeRecord(entry), available = lomadeeRecord(channel.availableChannel);
    if (available.name !== "PriceComparator") continue;
    const matchedBy = !expectedChannel ? "unconfigured" : channel.id === expectedChannel ? "channel_id" : available.id === expectedChannel ? "legacy_type_id" : null;
    if (!matchedBy || (expectedChannel && (typeof channel.id !== "string" || !channel.id))) continue;
    for (const link of Array.isArray(channel.shortUrls) ? channel.shortUrls : []) {
      if (typeof link !== "string") continue;
      try {
        const url = new URL(link);
        if (url.protocol !== "https:" || url.username || url.password) continue;
        const resolved: ComparatorChannel = { id: typeof channel.id === "string" ? channel.id : null, link, matchedBy };
        if (!expectedChannel) return resolved;
        if (selected && selected.id !== resolved.id) return null;
        selected ??= resolved;
        break;
      } catch { /* Link inválido não autoriza a exibição. */ }
    }
  }
  return selected;
}

export const lomadeeComparatorLink = (value: unknown, expectedChannel?: string): string | null => lomadeeComparatorChannel(value, expectedChannel)?.link ?? null;

export async function lomadeePage(endpoint: "brands" | "campaigns", page: number, key: string, signal: AbortSignal) {
  const body = lomadeeRecord(await boundedJson(`${BASE}/affiliate/${endpoint}?limit=${LOMADEE_PAGE_SIZE}&page=${page}${endpoint === "campaigns" ? "&status=onTime" : ""}`, { headers: { "x-api-key": key }, signal }));
  if (!Array.isArray(body.data) || body.data.length > LOMADEE_PAGE_SIZE) throw new Error(`lomadee_${endpoint}_schema`);
  const meta = lomadeeRecord(body.meta ?? body.pagination);
  if (meta.page != null && Number(meta.page) !== page) throw new Error(`lomadee_${endpoint}_pagination`);
  const pages = Number(meta.totalPages);
  const reportedPages = Number.isSafeInteger(pages) && pages > 0 ? pages : null;
  if (!body.data.length && reportedPages && page < reportedPages) throw new Error(`lomadee_${endpoint}_pagination`);
  return { rows: body.data.map(lomadeeRecord), reportedPages, done: reportedPages ? page >= reportedPages : body.data.length < LOMADEE_PAGE_SIZE };
}

export async function lomadeeBrands(key: string, signal: AbortSignal) {
  const brands: Record<string, unknown>[] = [];
  let pagesRead = 0, reportedPages: number | null = null;
  try {
    for (let page = 1; page <= 20; page++) {
      const result = await lomadeePage("brands", page, key, signal);
      pagesRead++; reportedPages = result.reportedPages;
      brands.push(...result.rows);
      if (result.done) return { brands, status: "ok", pagesRead, reportedPages };
    }
    return { brands, status: "lomadee_brands_page_limit", pagesRead, reportedPages };
  } catch (error) { return { brands, status: affiliateError(error), pagesRead, reportedPages }; }
}
