import { config } from "dotenv";
import { appendFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { z } from "zod";
import { createAdminClient } from "../src/infrastructure/supabase/admin";
import { SNAPSHOT_BUCKET, SNAPSHOT_MAX_BYTES } from "../src/core/matching/snapshot";
import { applyComparisonRetention, planComparisonRetention, RETENTION_DAYS, type RetentionStorage } from "../src/services/comparison-retention.service";

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log("Simulação: npm run cache:comparisons:retention\nApós revisão humana: npm run cache:comparisons:retention -- --apply --expected-version=<UUID ativo>\nNunca executar em paralelo com geração ou rollback do índice.");
    return;
  }
  if (args.some(a => a !== "--apply" && !a.startsWith("--expected-version="))) throw new Error("comparison_retention_invalid_arguments");
  const apply = args.includes("--apply");
  const expectedVersion = args.find(a => a.startsWith("--expected-version="))?.slice("--expected-version=".length);
  if (apply && !z.string().uuid().safeParse(expectedVersion).success) throw new Error("comparison_retention_expected_version_required");
  config({ path: process.env.PROMODETEC_ENV_FILE ?? ".env.local" });
  const sb = createAdminClient();
  const bucket = await sb.storage.getBucket(SNAPSHOT_BUCKET);
  if (bucket.error || !bucket.data || bucket.data.public || !Number(bucket.data.file_size_limit) || Number(bucket.data.file_size_limit) > SNAPSHOT_MAX_BYTES) throw new Error("comparison_retention_unsafe_bucket");
  const files = sb.storage.from(SNAPSHOT_BUCKET);
  const storage: RetentionStorage = {
    readJson: async path => {
      const { data, error } = await files.download(path, {}, { signal: AbortSignal.timeout(15_000) });
      if (error) {
        if (String("statusCode" in error ? error.statusCode : "") === "404" || error.message === "Object not found") return null;
        throw new Error("comparison_retention_read_failed");
      }
      if (!data || data.size > 1024) throw new Error("comparison_retention_manifest_size");
      return JSON.parse(await data.text());
    },
    list: async (prefix, offset, limit) => {
      const { data, error } = await files.list(prefix, { offset, limit, sortBy: { column: "name", order: "asc" } }, { signal: AbortSignal.timeout(15_000) });
      if (error || !data) throw new Error("comparison_retention_list_failed");
      return data;
    },
    remove: async paths => { const { error } = await files.remove(paths); if (error) throw new Error("comparison_retention_remove_failed"); },
  };
  const temporaryRoot = resolve(tmpdir());
  const folder = await mkdtemp(join(temporaryRoot, "promodetec-retention-"));
  if (dirname(folder) !== temporaryRoot) throw new Error("comparison_retention_unsafe_temporary_path");
  try {
    const spool = join(folder, "paths.ndjson");
    await writeFile(spool, "", { flag: "wx", mode: 0o600 });
    const plan = await planComparisonRetention(storage, path => appendFile(spool, JSON.stringify(path) + "\n"));
    if (apply && plan.active.version !== expectedVersion) throw new Error("comparison_retention_expected_version_changed");
    let removedObjects = 0;
    if (apply) {
      const input = createReadStream(spool, { highWaterMark: 64 * 1024 });
      const lines = createInterface({ input, crlfDelay: Infinity });
      try {
        const paths = async function* () { for await (const line of lines) yield z.string().max(256).parse(JSON.parse(line)); };
        ({ removedObjects } = await applyComparisonRetention(storage, paths(), plan));
      } finally { lines.close(); input.destroy(); }
    }
    const receipt = { ...plan, retentionDays: RETENTION_DAYS, dryRun: !apply, removedObjects, checkedAt: new Date().toISOString() };
    await mkdir("reports", { recursive: true });
    await writeFile("reports/comparison-retention.json", JSON.stringify(receipt, null, 2));
    console.log(JSON.stringify(receipt));
  } finally { await rm(folder, { recursive: true, force: true }); }
}
void main().catch(error => {
  console.error(error instanceof Error && /^comparison_retention_/.test(error.message) ? error.message : "comparison_retention_failed");
  process.exitCode = 1;
});
