import { NextRequest, NextResponse } from "next/server";
import { papelAtual, podeColetar } from "@/infrastructure/auth/roles";
import { analisarUrl } from "@/lib/analise-produto";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

/**
 * "Analisar" (cadastro inteligente, painel v4.0 Fatia 2) — recebe a URL colada,
 * lê a página de destino e devolve o melhor palpite pra cada campo do formulário.
 * Não grava nada no banco (isso é o POST /api/admin/produtos, separado) — o admin
 * ainda confirma/edita antes de salvar.
 */
export async function POST(req: NextRequest) {
  if (!podeColetar((await papelAtual())?.papel)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: { url?: string } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Corpo inválido." }, { status: 400 }); }

  const url = (body.url ?? "").trim();
  if (!/^https?:\/\/.+/i.test(url)) {
    return NextResponse.json({ error: "Cole uma URL válida (com https://)." }, { status: 400 });
  }

  const sugestao = await analisarUrl(url);
  return NextResponse.json({ ok: true, sugestao });
}
