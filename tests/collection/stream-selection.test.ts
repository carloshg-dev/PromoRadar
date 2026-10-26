import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { gzipSync } from "node:zlib";
import { CandidateSpool } from "../../src/infrastructure/shopee/candidate-spool";
import { selectTopByCategory } from "../../src/core/collection/top-by-category";
import { readCsvRows } from "../../src/infrastructure/scraping/core/csv-stream";
import { validFeedUrl } from "../../src/core/collection/feed-url";

test("destino de feed rejeita scripts, credenciais embutidas e campos sem limite", () => {
  assert.equal(validFeedUrl("https://store.test/product?id=1&affiliate=2"), true);
  for (const url of ["javascript:alert(1)", "data:image/png,abc", "https://user:password@store.test/p", "https://store.test/" + "a".repeat(9000), "not a URL"]) assert.equal(validFeedUrl(url), false);
});

test("CSV suporta BOM, aspas, vírgula e quebra de linha dentro do campo", async () => {
  const rows: Record<string, string>[] = [];
  await readCsvRows(Readable.from([Buffer.from('\uFEFFtitle,price\n"Fone, modelo\nAzul",99.90\n')]), (row) => { rows.push(row); }, { required: ["title", "price"] });
  assert.deepEqual(rows, [{ title: "Fone, modelo\nAzul", price: "99.90" }]);
});

test("gzip é reconhecido mesmo com assinatura em chunks de um byte", async () => {
  const rows: Record<string, string>[] = [];
  const compressed = gzipSync("title,price\nFone,99.90\n");
  await readCsvRows(Readable.from([...compressed].map((byte) => Buffer.from([byte]))), (row) => { rows.push(row); }, { required: ["title", "price"] });
  assert.equal(rows[0]?.title, "Fone");
});

test("schema inválido, linha quebrada, gzip corrompido e rede falha não viram feed completo", async () => {
  await assert.rejects(readCsvRows(Readable.from([Buffer.from("outro\nvalor\n")]), () => {}, { required: ["title"] }), /headers/);
  await assert.rejects(readCsvRows(Readable.from([Buffer.from("title,price\nFone\n")]), () => {}));
  await assert.rejects(readCsvRows(Readable.from([Buffer.from([0x1f, 0x8b, 0, 0])]), () => {}));
  await assert.rejects(readCsvRows(Readable.from((async function* () { yield Buffer.from("title,price\nFone,9\n"); throw new Error("offline"); })()), () => {}));
});

test("cota atingida cancela leitura em vez de carregar o restante do feed", async () => {
  let produced = 0, accepted = 0;
  const source = Readable.from((async function* () {
    yield Buffer.from("title,price\n");
    for (let i = 0; i < 50_000; i++) { produced++; yield Buffer.from(`Fone ${i},99\n`); }
  })(), { objectMode: false, highWaterMark: 128 });
  await readCsvRows(source, () => { accepted++; return accepted < 3; });
  assert.equal(accepted, 3);
  assert.ok(produced < 1000, `consumiu ${produced}`);
  assert.equal(source.destroyed, true);
});

test("linha excessiva falha com limite de memória explícito", async () => {
  const source = Readable.from((function* () { yield Buffer.from("title\n"); for (let i = 0; i < 18; i++) yield Buffer.alloc(65536, 97); })());
  await assert.rejects(readCsvRows(source, () => {}), /maximum size/);
});

test("seleção limitada coincide com ordenação integral, inclusive empates", () => {
  const items = Array.from({ length: 600 }, (_, i) => ({ id: i, category: ["a", "b", "c"][i % 3]!, score: i % 9, title: i % 2 ? "Água" : "Zinco" }));
  const compare = (a: typeof items[number], b: typeof items[number]) => b.score - a.score || a.title.localeCompare(b.title, "pt-BR");
  const result = selectTopByCategory(items, 13, ["a", "b", "c"], (item) => item.category, compare);
  const expected = ["a", "b", "c"].flatMap((category) => items.filter((item) => item.category === category).sort(compare).slice(0, 13));
  assert.deepEqual(result.items, expected);
  assert.equal(result.items.length, 39);
  assert.equal(result.stats.get("a")?.candidatos, 200);
});

test("deduplicação em disco preserva a última linha e a ordem de entrada do Map legado", async () => {
  const dir = await mkdtemp(join(tmpdir(), "promodetec-spool-test-"));
  const spool = new CandidateSpool<{ itemId: string; category: string; score: number }>(join(dir, "test.sqlite"));
  try {
    spool.add({ itemId: "1", category: "a", score: 90 });
    spool.add({ itemId: "2", category: "a", score: 70 });
    spool.add({ itemId: "1", category: "b", score: 60 });
    assert.throws(() => [...spool.items()], /not_sealed/);
    spool.seal();
    assert.equal(spool.size, 2);
    assert.deepEqual([...spool.items()], [{ itemId: "1", category: "b", score: 60 }, { itemId: "2", category: "a", score: 70 }]);
    assert.throws(() => spool.add({ itemId: "3", category: "a", score: 1 }), /sealed/);
  } finally { spool.close(); await rm(dir, { recursive: true, force: true }); }
});
