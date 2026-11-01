import { affiliateError, boundedJson } from "@/infrastructure/affiliates/http";

const BASE = "https://api.lomadee.com.br";
export const LOMADEE_PAGE_SIZE = 20;
export const lomadeeRecord = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};

/** A API key escopa a conta; somente o canal Comparador com link liberado é elegível. */
export function lomadeeComparatorLink(value: unknown, expectedChannel?: string): string | null {
  for (const entry of Array.isArray(value) ? value : []) {
    const channel = lomadeeRecord(entry), available = lomadeeRecord(channel.availableChannel);
    if (available.name !== "PriceComparator" || (expectedChannel && channel.id !== expectedChannel)) continue;
    for (const link of Array.isArray(channel.shortUrls) ? channel.shortUrls : []) {
      if (typeof link !== "string") continue;
      try {
        const url = new URL(link);
        if (url.protocol === "https:" && !url.username && !url.password) return link;
      } catch { /* Link inválido não autoriza a exibição. */ }
    }
  }
  return null;
}

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
