/**
 * PONTO DE ENTRADA do pipeline de conteúdo (Curadoria→Render→Publisher).
 * Chamado pelo GitHub Actions (hoje) / cron da Oracle (amanhã) / OpenClaw.
 *
 *   npx tsx scripts/pipeline-conteudo.ts            # roda tudo (publica de verdade)
 *   npx tsx scripts/pipeline-conteudo.ts --dry-run  # cura + renderiza, NÃO publica
 */
import { config } from "dotenv"; config({ path: ".env.local" });

async function main() {
  const { rodarPipelineConteudo } = await import("../src/pipeline/scheduler");
  await rodarPipelineConteudo({ dryRun: process.argv.includes("--dry-run") });
}
main().then(() => process.exit(0)).catch((e) => { console.error("FALHOU:", e.message, e.stack); process.exit(1); });
