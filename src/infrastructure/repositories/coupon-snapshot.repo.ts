import "server-only";
import { COUPON_BUCKET, COUPON_OBJECT, COUPON_MAX_BYTES, publicCoupons } from "@/core/coupons";

/** Só um objeto pequeno já coletado; nenhuma central de afiliação é consultada na visita. */
export async function listarCuponsPublicos() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return { coupons: [], updatedAt: null };
  const response = await fetch(`${base}/storage/v1/object/authenticated/${COUPON_BUCKET}/${COUPON_OBJECT}`, {
    headers: { apikey: key, authorization: `Bearer ${key}` }, next: { revalidate: 300 }, signal: AbortSignal.timeout(4000),
  });
  if (response.status === 404) { await response.body?.cancel(); return { coupons: [], updatedAt: null }; }
  if (!response.ok || !response.body) { await response.body?.cancel(); throw new Error("coupons_unavailable"); }
  const reader = response.body.getReader(), decoder = new TextDecoder(); let bytes = 0, text = "";
  try {
    while (true) { const part = await reader.read(); if (part.done) break; bytes += part.value.byteLength; if (bytes > COUPON_MAX_BYTES) throw new Error("coupons_too_large"); text += decoder.decode(part.value, { stream: true }); }
    return publicCoupons(JSON.parse(text + decoder.decode()));
  } finally { await reader.cancel(); reader.releaseLock(); }
}
