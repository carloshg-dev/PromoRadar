import { comObservabilidade } from "@/pipeline/monitor.service";
import { curar } from "@/pipeline/curadoria.service";
import { renderizar } from "@/pipeline/render.service";
import { publicar } from "@/pipeline/publisher.service";

/**
 * SERVIÇO SCHEDULER — orquestra o pipeline de conteúdo em sequência, cada etapa
 * sob observabilidade. É o ponto único que o GitHub Actions (hoje) ou o cron da
 * Oracle/OpenClaw (amanhã) chamam. Idempotente: reexecutar só avança o que ficou
 * pra trás (cada etapa filtra por status), nunca duplica.
 */
export async function rodarPipelineConteudo(opts: { n?: number; dryRun?: boolean } = {}): Promise<void> {
  const criadas = await comObservabilidade("curadoria", () => curar(opts.n ?? 5));
  const render = await comObservabilidade("render", () => renderizar());
  const pub = await comObservabilidade("publisher", () => publicar(opts.dryRun ?? false));
  console.log(`\n✅ Pipeline: ${criadas} curadas → ${render.ok} renderizadas → ${pub.ok} publicadas`
    + (render.falhas + pub.falhas ? ` (${render.falhas + pub.falhas} falhas)` : ""));
}
