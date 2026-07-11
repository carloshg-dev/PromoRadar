/**
 * Resumo diário de movimento do site → Telegram + Discord do DONO.
 * Uso:  npm run digest      (roda 1x/dia, no job "completa" do GitHub Actions)
 *
 * Lê a tabela `eventos` (analytics próprio) das últimas 24h + novos cadastros e
 * envia um resumo profissional. Custo zero (só Supabase + webhooks).
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createAdminClient } from "@/infrastructure/supabase/admin";
import { notificarResumoDiario, notificarAfiliacao } from "@/infrastructure/notify/owner";
import { redeAfiliada } from "@/lib/afiliados";

function topN(rows: Array<Record<string, unknown>>, pred: (e: Record<string, unknown>) => string | null, n: number): Array<[string, number]> {
  const m = new Map<string, number>();
  for (const e of rows) { const k = pred(e); if (k) m.set(k, (m.get(k) ?? 0) + 1); }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

async function main() {
  const sb = createAdminClient();
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: ev } = await sb
    .from("eventos")
    .select("tipo,termo,categoria_slug")
    .gte("criado_em", desde)
    .limit(20000);
  const eventos = ev ?? [];

  const { count: novosUsuarios } = await sb
    .from("usuarios").select("id", { count: "exact", head: true }).gte("criado_em", desde);

  const buscas = eventos.filter((e) => e.tipo === "busca").length;
  const produtosVistos = eventos.filter((e) => e.tipo === "ver_produto").length;
  const topBuscas = topN(eventos, (e) => (e.tipo === "busca" ? (e.termo as string | null) : null), 6);
  const topCategorias = topN(eventos, (e) => (e.tipo === "ver_categoria" ? (e.categoria_slug as string | null) : null), 6);

  await notificarResumoDiario({
    eventos: eventos.length,
    buscas,
    produtosVistos,
    novosUsuarios: novosUsuarios ?? 0,
    topBuscas,
    topCategorias,
  });
  console.log(`✅ Resumo diário enviado: ${eventos.length} eventos · ${buscas} buscas · ${produtosVistos} views · ${novosUsuarios ?? 0} novos usuários`);

  // 💰 Lista real de afiliação — UMA vez, aqui: o digest roda por ÚLTIMO (via `needs`
  // no scrape.yml), então o retrato é o FINAL (Kabum/Dufrio já coletados). Antes cada
  // job enviava a sua, parcial e conflitante.
  const { data: ls } = await sb.from("lojas").select("id, adapter_key, nome").eq("ativo", true);
  const linhas = await Promise.all((ls ?? []).map(async (l) => {
    const { count } = await sb.from("produtos").select("id", { count: "exact", head: true })
      .eq("loja_id", l.id as string).eq("em_estoque", true);
    return { loja: (l.nome as string) || (l.adapter_key as string), rede: redeAfiliada(l.adapter_key as string), produtos: count ?? 0 };
  }));
  await notificarAfiliacao(linhas.filter((l) => l.produtos > 0));
  console.log(`✅ Lista de afiliação enviada: ${linhas.filter((l) => l.produtos > 0 && l.rede).length} lojas monetizadas`);
}

main().catch((e) => { console.error("❌", e); process.exit(1); });
