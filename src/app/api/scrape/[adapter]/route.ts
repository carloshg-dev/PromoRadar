import { NextRequest, NextResponse } from "next/server";
import { executarColeta } from "@/services/collection.service";
import { papelAtual, podeColetar } from "@/infrastructure/auth/roles";
import type { AdapterKey } from "@/core/domain/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const VALID: AdapterKey[] = ["kabum", "mercadolivre", "pichau", "terabyte", "amazon", "growth", "soldiers", "maxtitanium", "integralmedica", "darklab", "havan", "americanas", "ferramentasgerais", "lojadomecanico", "lomadee", "awin"];

/**
 * Coleta manual de um adapter. Restrito: staff com permissão de coleta
 * (sessão) ou automação portando o CRON_SECRET. Sem isso, qualquer pessoa
 * na internet poderia queimar cota de Firecrawl/limites da Vercel.
 */
export async function POST(req: NextRequest, ctx: { params: { adapter: string } }) {
  const secret = process.env.CRON_SECRET;
  const bearer = req.headers.get("authorization")?.replace("Bearer ", "");
  const porSecret = Boolean(secret && bearer === secret);
  if (!porSecret && !podeColetar((await papelAtual())?.papel)) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }

  const key = ctx.params.adapter as AdapterKey;
  if (!VALID.includes(key)) {
    return NextResponse.json({ error: "adapter inválido" }, { status: 400 });
  }
  try {
    const r = await executarColeta([key]);
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
