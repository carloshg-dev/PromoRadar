import { z } from "zod";

export const COUPON_OBJECT = "coupons/v1/current.json";
export const COUPON_BUCKET = "catalog-comparisons";
export const COUPON_MAX_BYTES = 512 * 1024;
export const COUPON_MAX_AGE_MS = 12 * 60 * 60 * 1000;
const httpsUrl = z.string().max(2048).url().refine(value => { const u = new URL(value); return u.protocol === "https:" && !u.username && !u.password; });
export const couponSchema = z.object({
  id: z.string().min(1).max(120), marca: z.string().min(1).max(100), marcaLogo: httpsUrl.nullable(),
  titulo: z.string().min(1).max(240), codigo: z.string().min(1).max(100).nullable(), link: httpsUrl,
  terminaEm: z.string().datetime().nullable(), destaque: z.boolean(),
  source: z.enum(["awin", "lomadee"]), checkedAt: z.string().datetime(),
  startsAt: z.string().datetime().nullable(), terms: z.string().max(4000),
});
export type Coupon = z.infer<typeof couponSchema>;
export const couponSnapshotSchema = z.object({ schema: z.literal(1), generatedAt: z.string().datetime(), coupons: z.array(couponSchema).max(200) });
export function activeCoupon(coupon: Coupon, now = Date.now()): boolean {
  const checked = Date.parse(coupon.checkedAt);
  return checked <= now + 60_000 && now - checked <= COUPON_MAX_AGE_MS
    && (!coupon.startsAt || Date.parse(coupon.startsAt) <= now)
    && (!coupon.terminaEm || Date.parse(coupon.terminaEm) > now);
}
export function publicCoupons(value: unknown, now = Date.now()) {
  const parsed = couponSnapshotSchema.parse(value);
  const generated = Date.parse(parsed.generatedAt);
  if (generated > now + 60_000 || now - generated > COUPON_MAX_AGE_MS) throw new Error("coupon_snapshot_expired");
  const seen = new Set<string>();
  return { updatedAt: parsed.generatedAt, coupons: parsed.coupons.filter(c => {
    const identity = `${c.marca.toLowerCase()}:${c.codigo?.toLowerCase() ?? c.link}`;
    if (!activeCoupon(c, now) || seen.has(identity)) return false;
    seen.add(identity); return true;
  }) };
}
