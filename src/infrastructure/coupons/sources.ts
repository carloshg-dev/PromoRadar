import { couponSchema, type Coupon } from "@/core/coupons";

/** Respostas paginadas são limitadas antes do parse; jamais registrar URL autenticada/payload da rede. */
export async function boundedJson(url: string, init: RequestInit = {}): Promise<unknown> {
  const response = await fetch(url, { ...init, redirect: "error", signal: AbortSignal.timeout(20_000) });
  if (!response.ok || !response.body) { await response.body?.cancel(); throw new Error(`affiliate_http_${response.status}`); }
  const reader = response.body.getReader(), decoder = new TextDecoder(); let bytes = 0, text = "";
  try {
    while (true) { const part = await reader.read(); if (part.done) break; bytes += part.value.byteLength; if (bytes > 2 * 1024 * 1024) throw new Error("affiliate_response_limit"); text += decoder.decode(part.value, { stream: true }); }
    return JSON.parse(text + decoder.decode());
  } finally { await reader.cancel(); reader.releaseLock(); }
}
const plain = (value: unknown, max = 240) => typeof value === "string" ? value.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim().slice(0, max) : "";
function utc(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  const stamp = Date.parse(/(?:Z|[+-]\d\d:\d\d)$/.test(value) ? value : `${value}Z`);
  return Number.isFinite(stamp) ? new Date(stamp).toISOString() : null;
}
const obj = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};

export function awinCoupon(value: unknown, checkedAt: string, publisher: string): Coupon | null {
  const row = obj(value), advertiser = obj(row.advertiser), voucher = obj(row.voucher), regions = obj(row.regions);
  if (row.promotionId == null || (row.endDate && !utc(row.endDate)) || (row.startDate && !utc(row.startDate))) return null;
  if (advertiser.joined !== true || !["promotion", "voucher"].includes(String(row.type))) return null;
  if (regions.all !== true && !(Array.isArray(regions.list) && regions.list.some(region => obj(region).countryCode === "BR"))) return null;
  const link = plain(row.urlTracking, 2048); let url: URL;
  try { url = new URL(link); } catch { return null; }
  if (!["www.awin1.com", "awin1.com"].includes(url.hostname) || (url.searchParams.get("awinaffid") ?? url.searchParams.get("a")) !== publisher) return null;
  const code = plain(voucher.code, 100) || null;
  if (row.type === "voucher" && !code) return null;
  const result = couponSchema.safeParse({ id: `awin-${row.promotionId}`, marca: plain(advertiser.name, 100), marcaLogo: null,
    titulo: plain(row.title), codigo: code, link, terminaEm: utc(row.endDate), startsAt: utc(row.startDate),
    destaque: voucher.exclusive === true, source: "awin", checkedAt, terms: plain(row.terms, 4000) });
  return result.success ? result.data : null;
}
export async function collectAwinCoupons(key: string, publisher: string, checkedAt: string): Promise<Coupon[]> {
  if (!/^\d{1,12}$/.test(publisher)) throw new Error("awin_publisher_invalid");
  const coupons: Coupon[] = [];
  for (let page = 1; page <= 10; page++) {
    const body = obj(await boundedJson(`https://api.awin.com/publisher/${publisher}/promotions`, {
      method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ filters: { membership: "joined", regionCodes: ["BR"], status: "active", type: "all" }, pagination: { page, pageSize: 100 } }),
    }));
    if (!Array.isArray(body.data) || body.data.length > 100) throw new Error("awin_promotions_schema");
    for (const row of body.data) { const coupon = awinCoupon(row, checkedAt, publisher); if (coupon && coupons.length < 160) coupons.push(coupon); }
    const total = Number(obj(body.pagination).total);
    if (!Number.isFinite(total) || page * 100 >= total) return coupons;
  }
  throw new Error("awin_promotions_page_limit");
}

export async function collectLomadeeCoupons(key: string, checkedAt: string): Promise<Coupon[]> {
  const headers = { "x-api-key": key };
  const brands = new Map<string, string>();
  for (let page = 1; page <= 4; page++) {
    const body = obj(await boundedJson(`https://api.lomadee.com.br/affiliate/brands?limit=20&page=${page}`, { headers }));
    if (!Array.isArray(body.data)) throw new Error("lomadee_brands_schema");
    for (const value of body.data) { const row = obj(value); if (row.id && row.name) brands.set(String(row.id), plain(row.name, 100)); }
    if (body.data.length < 20) break;
  }
  const coupons: Coupon[] = [];
  for (let page = 1; page <= 8; page++) {
    const body = obj(await boundedJson(`https://api.lomadee.com.br/affiliate/campaigns?status=onTime&limit=20&page=${page}`, { headers }));
    if (!Array.isArray(body.data)) throw new Error("lomadee_campaigns_schema");
    for (const value of body.data) {
      const row = obj(value), period = obj(row.period), brand = brands.get(String(row.organizationId));
      if (!brand || (row.status && row.status !== "onTime")) continue;
      const channels = Array.isArray(row.channels) ? row.channels.map(obj).filter(c => c.availableChannel !== false) : [];
      const link = channels.flatMap(c => Array.isArray(c.shortUrls) ? c.shortUrls : []).find(url => typeof url === "string" && /^https:\/\//.test(url));
      const parsed = couponSchema.safeParse({ id: `lomadee-${row.id}`, marca: brand, marcaLogo: null, titulo: plain(row.name), codigo: plain(row.code, 100) || null, link,
        terminaEm: utc(period.endAt), startsAt: utc(period.startAt), destaque: row.isHighlight === true, source: "lomadee", checkedAt, terms: plain(row.description, 4000) });
      if (parsed.success && coupons.length < 160) coupons.push(parsed.data);
    }
    const pages = Number(obj(body.meta ?? body.pagination).totalPages);
    if (body.data.length < 20 || (Number.isFinite(pages) && page >= pages)) return coupons;
  }
  throw new Error("lomadee_campaigns_page_limit");
}
