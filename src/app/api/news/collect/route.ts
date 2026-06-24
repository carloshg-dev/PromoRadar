import { NextRequest, NextResponse } from "next/server";
import { coletarNoticias } from "@/infrastructure/news/news.service";
import { papelAtual, podeColetar } from "@/infrastructure/auth/roles";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Coleta manual de notícias. Restrito a staff (sessão) ou CRON_SECRET.
 * Sem GET: crawler indexando a URL não pode disparar coleta.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const bearer = req.headers.get("authorization")?.replace("Bearer ", "");
  const porSecret = Boolean(secret && bearer === secret);
  if (!porSecret && !podeColetar((await papelAtual())?.papel)) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  try {
    const r = await coletarNoticias();
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
