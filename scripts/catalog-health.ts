import { config } from "dotenv";
config({ path: ".env.local", quiet: true } as Parameters<typeof config>[0]);
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { carregarSaudeCatalogo } from "../src/infrastructure/repositories/catalog-health.repo";

async function main() {
  const args = process.argv.slice(2);
  const daysAt = args.indexOf("--days");
  const days = daysAt < 0 ? 7 : Number(args[daysAt + 1]);
  if (!Number.isInteger(days) || days < 1 || days > 31) throw new Error("catalog_invalid_days");
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const report = await carregarSaudeCatalogo(since);
  const outputAt = args.indexOf("--output");
  if (outputAt >= 0) {
    const output = args[outputAt + 1];
    if (!output) throw new Error("catalog_missing_output_path");
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, JSON.stringify(report, null, 2) + "\n");
  }
  console.log(JSON.stringify({ startedAt: report.startedAt, finishedAt: report.finishedAt,
    since, publiclyAvailable: report.publiclyAvailable, activeStores: report.activeStores,
    inactiveStores: report.inactiveStores, stores: report.byStore.length,
    oldestActive: report.byStore.filter((store) => store.active && store.available)
      .sort((a, b) => b.lastSeenBeforeWindow - a.lastSeenBeforeWindow).slice(0, 8), complete: report.complete }, null, 2));
}

main().catch(() => { console.error("catalog_health_failed: leitura incompleta; não interpretar como catálogo vazio"); process.exitCode = 1; });
