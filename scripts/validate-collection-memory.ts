import assert from "node:assert/strict";
import { createWriteStream } from "node:fs";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

async function main() {
  const dir = await mkdtemp(join(tmpdir(), "promodetec-memory-fixture-"));
  const results: { rows: number; kept: number; maxRssMiB: number; seconds: number }[] = [];
  try {
    for (const count of [20_000, 200_000]) {
      const file = join(dir, "fixture.csv");
      await pipeline(Readable.from((function* () {
        yield "itemid,title,sale_price,price,image_link,product_link,shop_name,item_rating,shop_rating,discount_percentage,like,cb_option,global_category1,global_category2,global_category3\n";
        for (let id = 1; id <= count; id++) yield `${id},Fone Bluetooth ${id},99.90,149.90,https://image.test/p.jpg,https://shopee.com.br/product/1/${id},Laboratorio,4.8,4.8,33,100,0,Electronics,Audio,Headphones\n`;
      })(), { objectMode: false }), createWriteStream(file));
      const started = performance.now();
      const child = spawn(process.execPath, ["--max-old-space-size=192", "--import", "tsx", "scripts/ingest-shopee-feed.ts", file, "--dry-run"], {
        env: { ...process.env, SHOPEE_FEED_URL: "", SHOPEE_DRY_RUN: "true", SHOPEE_TOP_N: "400", SHOPEE_AFFILIATE_ID: "123456",
          SUPABASE_URL: "https://db.invalid", NEXT_PUBLIC_SUPABASE_URL: "https://db.invalid", SUPABASE_SERVICE_ROLE_KEY: "fixture-no-real-access" },
        stdio: ["ignore", "pipe", "pipe"],
      });
      const completion = new Promise<number | null>((resolve, reject) => { child.on("error", reject); child.on("close", resolve); });
      let read = -1, kept = -1, upserted = -1, rss = -1, dryRun = false;
      for await (const line of createInterface({ input: child.stdout, crlfDelay: Infinity })) {
        if (line.includes("DRY_RUN ativo")) dryRun = true;
        const n = /Total de produtos lidos: (\d+)/.exec(line); if (n) read = Number(n[1]);
        const selected = /Top-N por categoria:.*mantidos=(\d+)/.exec(line); if (selected) kept = Number(selected[1]);
        const writes = /Total upserted: (\d+)/.exec(line); if (writes) upserted = Number(writes[1]);
        const memory = /Pico de RSS do processo: ([\d.]+) MiB/.exec(line); if (memory) rss = Number(memory[1]);
      }
      child.stderr.resume();
      assert.equal(await completion, 0, "fixture ingestion failed");
      assert.equal(dryRun, true); assert.equal(read, count); assert.equal(kept, 400); assert.equal(upserted, 0);
      assert.ok(rss > 0);
      results.push({ rows: count, kept, maxRssMiB: rss, seconds: Math.round((performance.now() - started) / 10) / 100 });
      console.log(JSON.stringify(results.at(-1)));
    }
    const args = process.argv.slice(2), outputAt = args.indexOf("--output");
    const output = outputAt < 0 ? "reports/collection-memory.json" : args[outputAt + 1];
    if (!output) throw new Error("memory_report_path_missing");
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, JSON.stringify({ generatedAt: new Date().toISOString(), node: process.version, platform: process.platform,
      heapLimitMiB: 192, mode: "Synthetic CSV only, explicit dry-run and invalid database endpoint", results,
      interpretation: "Measured peak RSS includes runtime, parser, SQLite and bounded selection; not a production benchmark or a before/after claim." }, null, 2) + "\n");
  } finally { await rm(dir, { recursive: true, force: true }); }
}

main().catch(() => { console.error("collection_memory_validation_failed"); process.exitCode = 1; });
