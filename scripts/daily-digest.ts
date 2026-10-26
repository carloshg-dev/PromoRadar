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
import { carregarMovimento } from "@/infrastructure/repositories/analytics.repo";

async function main() {
  const sb = createAdminClient();
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const movimento = await carregarMovimento(desde);
  if (!movimento.complete || movimento.rankingLimited) throw new Error("Resumo incompleto; não enviar totais parciais como completos");
  const buscas = movimento.counts.busca ?? 0;
  const produtosVistos = movimento.counts.ver_produto ?? 0;
  const novosUsuarios = movimento.registrations;

  await notificarResumoDiario({
    eventos: movimento.totalEventos,
    buscas,
    produtosVistos,
    novosUsuarios: novosUsuarios ?? 0,
    topBuscas: movimento.topBuscas,
    topCategorias: movimento.topCategorias,
    semResultado: movimento.counts.busca_sem_resultado ?? 0,
    salvos: movimento.counts.salvar_produto ?? 0,
    compartilhamentos: movimento.counts.compartilhar_produto ?? 0,
    saidas: movimento.counts.saida_loja ?? 0,
    redirects: movimento.redirectRequests,
  });
  console.log(`✅ Resumo diário enviado: ${movimento.totalEventos} ações · ${buscas} buscas · ${produtosVistos} views · ${novosUsuarios} novos usuários`);

  // 💰 Lista real de afiliação — UMA vez, aqui: o digest roda por ÚLTIMO (via `needs`
  // no scrape.yml), então o retrato é o FINAL (Kabum/Dufrio já coletados). Antes cada
  // job enviava a sua, parcial e conflitante.
  const { data: ls, error: lojasError } = await sb.from("lojas").select("id, adapter_key, nome").eq("ativo", true);
  if (lojasError) throw new Error("affiliate_catalog_read_failed");
  const linhas = await Promise.all((ls ?? []).map(async (l) => {
    const { count, error } = await sb.from("produtos").select("id", { count: "exact", head: true })
      .eq("loja_id", l.id as string).eq("em_estoque", true);
    if (error || count === null) throw new Error("affiliate_catalog_count_failed");
    return { loja: (l.nome as string) || (l.adapter_key as string), rede: redeAfiliada(l.adapter_key as string), produtos: count ?? 0 };
  }));
  await notificarAfiliacao(linhas.filter((l) => l.produtos > 0));
  console.log(`✅ Lista de afiliação enviada: ${linhas.filter((l) => l.produtos > 0 && l.rede).length} lojas monetizadas`);
}

main().catch(() => { console.error("digest_failed: não foi possível confirmar todos os dados do resumo"); process.exit(1); });
