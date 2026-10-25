import { config } from "dotenv";
import { mkdir, writeFile } from "node:fs/promises";
import { createAdminClient } from "../src/infrastructure/supabase/admin";
import { comparisonProductBatches } from "../src/infrastructure/repositories/comparison-source.repo";
import { buildComparisonSnapshots } from "../src/services/comparison-snapshot.service";
import { SNAPSHOT_BUCKET, SNAPSHOT_MAX_BYTES } from "../src/core/matching/snapshot";
import { VERTICAIS } from "../src/lib/navigation";

config({ path: process.env.PROMODETEC_ENV_FILE ?? ".env.local" });
const publish = process.argv.includes("--publish");
const sb = createAdminClient();
const categories = [...new Set(VERTICAIS.flatMap(v => v.categorias.map(c => c.slug)))];
async function main() {
  if (publish) {
    const { data, error } = await sb.storage.getBucket(SNAPSHOT_BUCKET);
    if (error) {
      if (!/not found/i.test(error.message)) throw new Error("comparison_bucket_read_failed");
      const created = await sb.storage.createBucket(SNAPSHOT_BUCKET, { public: false, fileSizeLimit: SNAPSHOT_MAX_BYTES, allowedMimeTypes: ["application/json"] });
      if (created.error) throw new Error("comparison_bucket_creation_failed");
    } else if (data.public) throw new Error("comparison_bucket_must_be_private");
  }
  const receipt = await buildComparisonSnapshots({
    categories, verticals: VERTICAIS, batches: comparisonProductBatches,
    write: async (path, body) => {
      if (!publish) return;
      const { error } = await sb.storage.from(SNAPSHOT_BUCKET).upload(path, Buffer.from(body), {
        contentType: "application/json", cacheControl: path === "v1/index.json" ? "0" : "31536000", upsert: path === "v1/index.json",
      });
      if (error) throw new Error("comparison_snapshot_write_failed");
    },
  });
  await mkdir("reports", { recursive: true });
  await writeFile("reports/comparison-snapshots.json", JSON.stringify({ ...receipt, published: publish }, null, 2));
  console.log(JSON.stringify({ ...receipt, published: publish }));
}
void main().catch(error => {
  console.error(error instanceof Error && /^comparison_/.test(error.message) ? error.message : "comparison_generation_failed");
  process.exitCode = 1;
});
