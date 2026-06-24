import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/infrastructure/supabase/admin";

export const dynamic = "force-dynamic";

const TIPOS = new Set(["busca", "ver_produto", "abrir_comparacao", "ver_categoria"]);

/** Detecta dispositivo e navegador a partir do user-agent (grosso, suficiente p/ analytics). */
function uaInfo(ua: string): { dispositivo: string; navegador: string; bot: boolean } {
  const bot = /bot|crawl|spider|preview|lighthouse|headless|monitor/i.test(ua);
  const dispositivo = /mobile|android|iphone|ipad/i.test(ua) ? "mobile" : "desktop";
  const navegador =
    /edg/i.test(ua) ? "edge"
    : /chrome|crios/i.test(ua) ? "chrome"
    : /firefox|fxios/i.test(ua) ? "firefox"
    : /safari/i.test(ua) ? "safari"
    : "outro";
  return { dispositivo, navegador, bot };
}

/**
 * Coletor de eventos de analytics (write-only). Chamado pelo cliente via
 * sendBeacon/fetch. Geo e device vêm dos headers (servidor), não confiáveis do
 * cliente. Bots são ignorados. Sem leitura pública — só o painel admin lê.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return new NextResponse(null, { status: 204 }); }

  const tipo = String(body.tipo ?? "");
  if (!TIPOS.has(tipo)) return new NextResponse(null, { status: 204 });

  const ua = req.headers.get("user-agent") ?? "";
  const { dispositivo, navegador, bot } = uaInfo(ua);
  if (bot) return new NextResponse(null, { status: 204 }); // não conta robô

  const refererRaw = req.headers.get("referer") ?? "";
  let referer: string | null = null;
  try { referer = refererRaw ? new URL(refererRaw).host : null; } catch { referer = null; }

  const str = (v: unknown, max = 200) => (typeof v === "string" && v ? v.slice(0, max) : null);

  try {
    const sb = createAdminClient();
    await sb.from("eventos").insert({
      tipo,
      termo: str(body.termo, 120),
      produto_id: str(body.produtoId, 40),
      loja_slug: str(body.lojaSlug, 40),
      categoria_slug: str(body.categoriaSlug, 40),
      origem: str(body.origem, 60),
      referer,
      dispositivo,
      navegador,
      cidade: req.headers.get("x-vercel-ip-city") ?? null,
      pais: req.headers.get("x-vercel-ip-country") ?? null,
    });
  } catch { /* analytics nunca quebra a navegação */ }

  return new NextResponse(null, { status: 204 });
}
