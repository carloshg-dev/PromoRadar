import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/infrastructure/supabase/admin";
import { papelAtual, podeGerirEquipe } from "@/infrastructure/auth/roles";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Limpeza de peças/acessórios que poluem as categorias de eletro/ferramentas
 * (ex: "Grade para Forno", "Mangueira da Lavadora", "Trempe"). É o mesmo sinal
 * usado no momento da coleta (PECA_ACESSORIO em scraping/core/vtex.ts) — aqui
 * limpamos o que JÁ foi salvo antes daquele filtro existir.
 *
 * Operação DESTRUTIVA: restrita a super_admin. Sempre faz um PREVIEW (GET) antes;
 * a remoção (DELETE) só roda com confirmação explícita do super admin no painel.
 */

// Categorias onde peças se infiltram (não tocamos em tech/fit/perfumes).
const SLUGS_ALVO = [
  "geladeiras", "fogoes", "maquinas-lavar", "tvs", "micro-ondas", "ar-condicionado",
  "furadeiras", "serras", "lixadeiras", "compressores", "chaves-soquetes", "ferramentas-manuais", "epi",
] as const;

// Trechos de título que denunciam peça/acessório (alinhado ao PECA_ACESSORIO da coleta).
const PADROES = [
  "para fog", "para forno", "para cooktop", "para geladeira", "para refriger",
  "para lava", "para maquina", "para máquina", "para furadeira", "para serra", "para lixadeira",
  "grade para", "trempe", "queimador", "válvula", "valvula", "mangueira", "refil",
  "prateleira", "gaveta para", "dobradi", "reposi", "puxador",
] as const;

const orFiltro = PADROES.map((p) => `titulo.ilike.%${p}%`).join(",");

async function idsCategoriasAlvo(sb: ReturnType<typeof createAdminClient>): Promise<string[]> {
  const { data } = await sb.from("categorias").select("id,slug").in("slug", SLUGS_ALVO as unknown as string[]);
  return (data ?? []).map((c) => c.id as string);
}

/** PREVIEW: quantos e quais itens seriam removidos (read-only). */
export async function GET() {
  if (!podeGerirEquipe((await papelAtual())?.papel)) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }
  const sb = createAdminClient();
  const ids = await idsCategoriasAlvo(sb);
  if (!ids.length) return NextResponse.json({ total: 0, amostra: [] });

  const { count } = await sb
    .from("produtos")
    .select("id", { count: "exact", head: true })
    .in("categoria_id", ids)
    .or(orFiltro);

  const { data: amostra } = await sb
    .from("produtos")
    .select("titulo,preco_atual")
    .in("categoria_id", ids)
    .or(orFiltro)
    .order("preco_atual", { ascending: true })
    .limit(30);

  return NextResponse.json({ total: count ?? 0, amostra: amostra ?? [] });
}

/** DELETE confirmado: remove de fato as peças. Só super_admin. */
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
  const ids = await idsCategoriasAlvo(sb);
  if (!ids.length) return NextResponse.json({ ok: true, removidos: 0 });

  const { data, error } = await sb
    .from("produtos")
    .delete()
    .in("categoria_id", ids)
    .or(orFiltro)
    .select("id");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, removidos: data?.length ?? 0 });
}
