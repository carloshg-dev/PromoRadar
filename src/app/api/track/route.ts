import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/infrastructure/supabase/admin";
import { batchSchema, isAutomatedRequest, sameRequestOrigin } from "@/core/analytics/events";

export const dynamic = "force-dynamic";
const MAX_BYTES = 8_192;

async function readBody(req: Request): Promise<unknown> {
  if (Number(req.headers.get("content-length")) > MAX_BYTES) throw new Error("size");
  const reader = req.body?.getReader();
  if (!reader) throw new Error("empty");
  const decoder = new TextDecoder();
  let bytes = 0, body = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BYTES) { await reader.cancel(); throw new Error("size"); }
      body += decoder.decode(value, { stream: true });
    }
    return JSON.parse(body + decoder.decode());
  } finally { reader.releaseLock(); }
}

export async function POST(req: NextRequest) {
  const empty = () => new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  if (process.env.PROMODETEC_ANALYTICS_DISABLED === "1" || req.headers.get("sec-gpc") === "1" || req.headers.get("dnt") === "1") return empty();
  const ua = req.headers.get("user-agent") ?? "";
  if (isAutomatedRequest(ua, req.headers.get("purpose") ?? req.headers.get("sec-purpose") ?? "")) return empty();
  if (!sameRequestOrigin(req) || req.headers.get("sec-fetch-site") === "cross-site") return empty();
  let body: unknown;
  try { body = await readBody(req); } catch { return empty(); }
  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) return empty();
  const device = /mobile|android|iphone|ipad/i.test(ua) ? "mobile" : "desktop";
  const browser = /edg/i.test(ua) ? "edge" : /chrome|crios/i.test(ua) ? "chrome" : /firefox|fxios/i.test(ua) ? "firefox" : /safari/i.test(ua) ? "safari" : "outro";
  const country = req.headers.get("cf-ipcountry") ?? req.headers.get("x-vercel-ip-country");
  const rows = parsed.data.events.map((event) => ({
    tipo: event.tipo, termo: event.termo ?? null, produto_id: event.produtoId ?? null,
    loja_slug: event.lojaSlug ?? null, categoria_slug: event.categoriaSlug ?? null,
    origem: event.origem ?? null, dispositivo: device, navegador: browser,
    pais: country && /^[A-Z]{2}$/.test(country) ? country : null,
  }));
  try {
    const { error } = await createAdminClient().from("eventos").insert(rows).abortSignal(AbortSignal.timeout(3_000));
    if (error) throw error;
  } catch {
    console.warn("analytics_write_failed");
    return NextResponse.json({ error: "measurement_unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  return empty();
}
