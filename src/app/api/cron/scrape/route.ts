import { NextRequest, NextResponse } from "next/server";
import { executarColeta } from "@/services/collection.service";
import { coletarNoticias } from "@/infrastructure/news/news.service";
import type { AdapterKey } from "@/core/domain/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Cron (10:00 e 20:00 UTC = 07:00 e 17:00 BRT). Coleta as fontes RÁPIDAS, que
 * cabem no limite de 60s do serverless (Hobby): notícias (RSS) + Kabum (API) +
 * Mercado Livre (API de catálogo). Tudo HTTP/API, sem browser/Firecrawl.
 *
 * As lojas de BROWSER (Terabyte/Amazon/Pichau) NÃO entram aqui — elas estouram
 * os 60s. Rodam 1x/dia no GitHub Actions (via Firecrawl), ver `.github/workflows`.
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

  // Notícias primeiro (rápido): garante atualização mesmo se a coleta demorar.
  let noticias = null;
  try { noticias = await coletarNoticias(); } catch { /* notícias não bloqueiam */ }

  // Kabum + ML raso (20/categoria, cabe nos 60s) 2x/dia para frescor; o mergulho
  // fundo do ML (50/categoria) roda 1x/dia no GitHub Actions. Upsert deduplica.
  const keys: AdapterKey[] = ["kabum", "mercadolivre"];
  try {
    const ofertas = await executarColeta(keys);
    return NextResponse.json({ ok: true, keys, ofertas, noticias });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message, noticias }, { status: 500 });
  }
}
