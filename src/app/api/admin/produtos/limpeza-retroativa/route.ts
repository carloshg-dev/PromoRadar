import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/infrastructure/supabase/admin";
import { papelAtual, podeGerirEquipe } from "@/infrastructure/auth/roles";
import { contemTermoProibido } from "@/core/blacklist-nicho";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * LIMPEZA RETROATIVA — aplica a MESMA blacklist de nicho (src/core/blacklist-nicho)
 * ao catálogo ATUAL, removendo o lixo B2B (fibra óptica / OLT / ONU) que entrou
 * ANTES do filtro existir. Como reusa a mesma função word-boundary da ingestão,
 * nunca apaga fonte/carregador B2C por engano (o "bivolt" está a salvo).
 *
 * Espelha o padrão seguro do /api/admin/limpar-pecas: destrutiva → só super_admin,
 * GET = prévia (não toca no banco), POST = apaga com confirmação explícita.
 */
async function escanearLixo(sb: ReturnType<typeof createAdminClient>): Promise<{ id: string; titulo: string }[]> {
  const lixo: { id: string; titulo: string }[] = [];
  // pagina o catálogo inteiro (PostgREST limita ~1000/req); teto folgado p/ crescimento.
  for (let de = 0; de < 40000; de += 1000) {
    const { data, error } = await sb.from("produtos").select("id,titulo").range(de, de + 999);
    if (error) throw error;
    const lote = data ?? [];
    for (const p of lote) {
      if (contemTermoProibido(p.titulo as string)) lixo.push({ id: p.id as string, titulo: p.titulo as string });
    }
    if (lote.length < 1000) break;
  }
  return lixo;
}

/** PRÉVIA (read-only): quantos e quais itens a blacklist pegaria hoje. */
export async function GET() {
  if (!podeGerirEquipe((await papelAtual())?.papel)) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const sb = createAdminClient();
  const lixo = await escanearLixo(sb);
  return NextResponse.json({ total: lixo.length, amostra: lixo.slice(0, 30).map((p) => p.titulo) });
}

/** DELETE confirmado: remove de fato o lixo B2B. Só super_admin. */
export async function POST(req: NextRequest) {
  if (!podeGerirEquipe((await papelAtual())?.papel)) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  let body: { confirmar?: boolean } = {};
  try { body = await req.json(); } catch { /* corpo vazio */ }
  if (body.confirmar !== true) {
    return NextResponse.json({ error: "confirmação ausente" }, { status: 400 });
  }

  const sb = createAdminClient();
  const lixo = await escanearLixo(sb);
  if (!lixo.length) return NextResponse.json({ ok: true, removidos: 0 });

  const ids = lixo.map((p) => p.id);
  let removidos = 0;
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await sb.from("produtos").delete().in("id", ids.slice(i, i + 200)).select("id");
    if (error) return NextResponse.json({ ok: false, error: error.message, removidos }, { status: 500 });
    removidos += data?.length ?? 0;
  }
  return NextResponse.json({ ok: true, removidos });
}
