import { createAdminClient } from "@/infrastructure/supabase/admin";
import { comObservabilidade } from "@/pipeline/monitor.service";
import { curar } from "@/pipeline/curadoria.service";
import { renderizar } from "@/pipeline/render.service";
import { publicar } from "@/pipeline/publisher.service";

/** Pré-voo: a tabela `campanhas` existe? Sem ela o pipeline não roda — mas em vez
 *  de estourar erro vermelho, avisa claro e sai LIMPO (o dono roda db/campanhas.sql). */
async function tabelaCampanhasExiste(): Promise<boolean> {
  const { error } = await createAdminClient().from("campanhas").select("id", { head: true, count: "exact" });
  if (error && /schema cache|does not exist|not find the table/i.test(error.message)) return false;
  return true;
}

/**
 * SERVIÇO SCHEDULER — orquestra o pipeline de conteúdo em sequência, cada etapa
 * sob observabilidade. É o ponto único que o GitHub Actions (hoje) ou o cron da
 * Oracle/OpenClaw (amanhã) chamam. Idempotente: reexecutar só avança o que ficou
 * pra trás (cada etapa filtra por status), nunca duplica.
 */
export async function rodarPipelineConteudo(opts: { n?: number; dryRun?: boolean } = {}): Promise<void> {
  if (!(await tabelaCampanhasExiste())) {
    console.log("⚠️  Tabela 'campanhas' não existe no Supabase. Rode db/campanhas.sql no SQL Editor e tente de novo. Pipeline pulado (sem erro).");
    return;
  }
  const criadas = await comObservabilidade("curadoria", () => curar(opts.n ?? 5));
  const render = await comObservabilidade("render", () => renderizar());
  const pub = await comObservabilidade("publisher", () => publicar(opts.dryRun ?? false));
  console.log(`\n✅ Pipeline: ${criadas} curadas → ${render.ok} renderizadas → ${pub.ok} publicadas`
    + (render.falhas + pub.falhas ? ` (${render.falhas + pub.falhas} falhas)` : ""));
}
