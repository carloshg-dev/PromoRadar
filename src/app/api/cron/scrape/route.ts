import { NextRequest, NextResponse } from "next/server";
import { coletarNoticias } from "@/infrastructure/news/news.service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Cron (10:00 e 20:00 UTC = 07:00 e 17:00 BRT) — atualiza as NOTÍCIAS (RSS).
 *
 * A coleta de PRODUTOS saiu daqui: o ML (única fonte HTTP rápida que restava)
 * foi silenciado em 04/07 — a API oficial dele responde 401 "access not
 * granted" (bloqueada por política de tráfego). As lojas monetizadas rodam
 * 1x/dia no GitHub Actions (Awin/Lomadee/Carrefour/Amazon). Se um dia o ML
 * voltar via Firecrawl, religar a coleta aqui.
 */
export async function GET(req: NextRequest) {
  // Falha FECHADO: sem CRON_SECRET configurado, ninguém entra. E só via
  // header (a Vercel envia "Authorization: Bearer <CRON_SECRET>") — secret
  // em query string vazaria nos logs de acesso.
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const noticias = await coletarNoticias();
    return NextResponse.json({ ok: true, noticias });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
