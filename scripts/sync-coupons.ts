import { config } from "dotenv";
config({ path: ".env.local", quiet: true } as Parameters<typeof config>[0]);
import { mkdir, writeFile } from "node:fs/promises";
import { createAdminClient } from "../src/infrastructure/supabase/admin";
import { collectAwinCoupons, collectLomadeeCoupons } from "../src/infrastructure/coupons/sources";
import { COUPON_BUCKET, COUPON_OBJECT, COUPON_MAX_BYTES, activeCoupon, couponSnapshotSchema, type Coupon } from "../src/core/coupons";

async function main() {
  const checkedAt = new Date().toISOString(), coupons: Coupon[] = [], sources: { source: string; status: string; count: number }[] = [];
  for (const [source, key, collect] of [
    ["awin", process.env.AWIN_API_KEY, async (key: string) => ({ coupons: await collectAwinCoupons(key, process.env.AWIN_PUBLISHER_ID || "2936727", checkedAt), status: "ok" })],
    ["lomadee", process.env.LOMADEE_API_KEY, (key: string) => collectLomadeeCoupons(key, checkedAt)],
  ] as const) {
    if (!key) { sources.push({ source, status: "not_configured", count: 0 }); continue; }
    try { const { coupons: rows, ...coverage } = await collect(key); coupons.push(...rows); sources.push({ source, ...coverage, count: rows.length }); }
    catch (error) { const code = error instanceof Error && /^[a-z0-9_]+$/.test(error.message) ? error.message : "read_failed"; sources.push({ source, status: code, count: 0 }); }
  }
  if (!sources.some(s => s.status === "ok") && !coupons.length) throw new Error("all_coupon_sources_unavailable");
  const seen = new Set<string>();
  const rows = coupons.filter(c => { const identity = `${c.marca.toLowerCase()}:${c.codigo ?? c.link}`; if (!activeCoupon(c) || seen.has(identity)) return false; seen.add(identity); return true; }).slice(0, 200);
  const snapshot = couponSnapshotSchema.parse({ schema: 1, generatedAt: checkedAt, coupons: rows });
  const body = Buffer.from(JSON.stringify(snapshot));
  if (body.byteLength > COUPON_MAX_BYTES) throw new Error("coupon_snapshot_limit");
  const publish = process.argv.includes("--publish");
  if (publish) {
    const sb = createAdminClient();
    if (new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname !== "sksjukjkxkptresysbno.supabase.co") throw new Error("coupon_project_mismatch");
    const bucket = await sb.storage.getBucket(COUPON_BUCKET);
    if (bucket.error || bucket.data.public) throw new Error("coupon_private_bucket_required");
    const result = await sb.storage.from(COUPON_BUCKET).upload(COUPON_OBJECT, body, { contentType: "application/json", cacheControl: "300", upsert: true });
    if (result.error) throw new Error("coupon_snapshot_publish_failed");
  }
  await mkdir("reports", { recursive: true });
  const receipt = { checkedAt, published: publish, bytes: body.byteLength, coupons: rows.length, codes: rows.filter(c => c.codigo).length, sources, limitations: ["Cupons podem depender de valor mínimo, público, app e estoque; condições exibidas", "Shopee e Amazon não foram conectadas a uma API de cupons: nenhum código é inventado"] };
  await writeFile("reports/coupon-sync.json", JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify(receipt));
  if (sources.some(source => source.status !== "ok")) process.exitCode = 1;
}
main().catch(error => { console.error(error instanceof Error && /^[a-z0-9_]+$/.test(error.message) ? error.message : "coupon_sync_failed"); process.exitCode = 1; });
