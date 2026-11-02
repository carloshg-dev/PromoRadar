/**
 * PONTO DE ENTRADA do pipeline de conteúdo (Curadoria→Render→Publisher).
 * Chamado pelo GitHub Actions (hoje) / cron da Oracle (amanhã) / OpenClaw.
 *
 *   npx tsx scripts/pipeline-conteudo.ts            # roda tudo (publica de verdade)
 *   npx tsx scripts/pipeline-conteudo.ts --dry-run  # gera rascunhos locais, sem escrever no banco
 */
import { config } from "dotenv"; config({ path: ".env.local" });

async function main() {
  if (process.argv.includes("--dry-run")) {
    const { prepararRascunhos } = await import("../src/pipeline/draft.service");
    console.log(JSON.stringify(await prepararRascunhos()));
    return;
  }
  const { rodarPipelineConteudo } = await import("../src/pipeline/scheduler");
  await rodarPipelineConteudo();
}
main().catch(() => { console.error("content_pipeline_failed: consulte os códigos sanitizados de etapa"); process.exitCode = 1; });
