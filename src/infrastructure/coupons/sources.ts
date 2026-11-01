import { activeCoupon, couponSchema, type Coupon } from "@/core/coupons";
import { affiliateError, boundedJson } from "@/infrastructure/affiliates/http";
import { lomadeeBrands, lomadeeComparatorLink, lomadeePage } from "@/infrastructure/lomadee/api";
export { boundedJson } from "@/infrastructure/affiliates/http";
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

export async function collectLomadeeCoupons(key: string, checkedAt: string) {
  const signal = AbortSignal.timeout(180_000);
  const brandResult = await lomadeeBrands(key, signal);
  const brands = new Map<string, string>();
  for (const row of brandResult.brands) {
    if (row.id && row.name && obj(row.network).active === true && lomadeeComparatorLink(row.channels)) brands.set(String(row.id), plain(row.name, 100));
  }
  const coupons: Coupon[] = [];
  let campaignPages = 0, reportedPages: number | null = null;
  const result = (status: string) => ({ coupons, status, brands: brands.size, brandStatus: brandResult.status, brandPages: brandResult.pagesRead, campaignPages, reportedPages, selectionLimit: 160 });
  if (!brands.size && brandResult.status !== "ok") return result(brandResult.status);
  const seen = new Set<string>();
  try {
    for (let page = 1; page <= 25; page++) {
      const body = await lomadeePage("campaigns", page, key, signal);
      campaignPages++; reportedPages = body.reportedPages;
      for (const row of body.rows) {
        const period = obj(row.period), brand = brands.get(String(row.organizationId));
        if (!row.id || !brand || row.status !== "onTime" || (period.startAt && !utc(period.startAt)) || (period.endAt && !utc(period.endAt))) continue;
        const parsed = couponSchema.safeParse({ id: `lomadee-${row.id}`, marca: brand, marcaLogo: null, titulo: plain(row.name), codigo: plain(row.code, 100) || null,
          link: lomadeeComparatorLink(row.channels), terminaEm: utc(period.endAt), startsAt: utc(period.startAt), destaque: row.isHighlight === true, source: "lomadee", checkedAt, terms: plain(row.description, 4000) });
        if (parsed.success && activeCoupon(parsed.data, Date.parse(checkedAt)) && !seen.has(parsed.data.id)) {
          seen.add(parsed.data.id);
          if (coupons.length < 160) coupons.push(parsed.data);
        }
      }
      if (body.done) return result(brandResult.status);
    }
    return result("lomadee_campaigns_page_limit");
  } catch (error) { return result(affiliateError(error)); }
}
