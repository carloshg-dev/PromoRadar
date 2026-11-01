import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

test("ingestão reserva doces, casa e trabalho sem escrita nem duplicação do Top-N", async () => {
  const dir = await mkdtemp(join(tmpdir(), "promodetec-everyday-fixture-"));
  try {
    const file = join(dir, "fixture.csv");
    const header = "itemid,title,sale_price,price,image_link,product_link,shop_name,item_rating,shop_rating,discount_percentage,like,cb_option,global_category1,global_category2,global_category3\n";
    const titles = ["Produto comum A", "Produto comum B", "Chocolate japonês A", "Chocolate japonês B", "Chocolate japonês C", "Organizador de cozinha A", "Organizador de cozinha B", "Organizador de cozinha C", "Caneta de trabalho A", "Caneta de trabalho B", "Caneta de trabalho C"];
    const rows = titles.map((title, index) => `${index + 1},${title},25,${index < 2 ? 100 : 25},https://image.test/p.jpg,https://shopee.com.br/product/1/${index + 1},Laboratorio,${index < 2 ? 5 : 1},5,${index < 2 ? 75 : 0},${index < 2 ? 1000 : 0},0,Everyday,Others,Others\n`);
    await writeFile(file, header + rows.join(""));
    const result = spawnSync(process.execPath, ["--import", "tsx", "scripts/ingest-shopee-feed.ts", file, "--dry-run"], {
      env: { ...process.env, SHOPEE_FEED_URL: "", SHOPEE_DRY_RUN: "true", SHOPEE_TOP_N: "2", SHOPEE_AFFILIATE_ID: "123456", PISO_PRECO_BRL: "9", NEXT_PUBLIC_SUPABASE_URL: "https://db.invalid", SUPABASE_URL: "https://db.invalid", SUPABASE_SERVICE_ROLE_KEY: "fixture-no-real-access" },
      encoding: "utf8", timeout: 20000, maxBuffer: 128 * 1024,
    });
    assert.equal(result.status, 0, "dry_run_must_finish");
    assert.match(result.stdout, /DRY_RUN ativo/);
    assert.match(result.stdout, /ofertas-parceiros: mantidos=8, cortados=3/);
    assert.match(result.stdout, /Total de produtos lidos: 11/);
    assert.match(result.stdout, /Total upserted: 0/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
