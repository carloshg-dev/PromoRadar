import { config } from "dotenv";
config({ path: ".env.local", quiet: true } as Parameters<typeof config>[0]);
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { carregarMovimento } from "../src/infrastructure/repositories/analytics.repo";

async function main() {
  const args = process.argv.slice(2);
  const daysIndex = args.indexOf("--days");
  const days = daysIndex >= 0 ? Number(args[daysIndex + 1]) : 7;
  if (!Number.isInteger(days) || days < 1 || days > 31) throw new Error("Use --days entre 1 e 31");
  const until = new Date().toISOString();
  const since = new Date(Date.parse(until) - days * 86_400_000).toISOString();
  const summary = await carregarMovimento(since, until);
  if (!summary.complete) throw new Error("Relatório excedeu o limite de 100 mil eventos; agregação SQL necessária");
  const report = { generatedAt: until, windowDays: days, ...summary,
    interpretation: "Contagens de ações, sem usuários únicos. Redirects não são vendas. Receita requer os relatórios das redes. A medição com consentimento pode ser menor que o tráfego total." };
  const outputIndex = args.indexOf("--output");
  if (outputIndex >= 0) {
    const output = args[outputIndex + 1];
    if (!output) throw new Error("Informe o arquivo depois de --output");
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, JSON.stringify(report, null, 2) + "\n", "utf8");
  }
  console.log(JSON.stringify(report, null, 2));
}

main().catch(() => { console.error("growth_report_failed: confira acesso de leitura, período e limites; nenhum dado foi alterado"); process.exitCode = 1; });
