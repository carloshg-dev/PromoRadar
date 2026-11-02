import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { persistShopeeFeed, type ShopeePersistenceStats } from "../../src/services/shopee-persistence.service";

const store = "12345678-1234-4234-8234-123456789abc";
const started = "2026-10-20T03:00:00Z";
const rows = (n: number) => Array.from({ length: n }, (_, i) => ({ loja_id: store, sku_loja: `shopee-${i}`, visto_em: started, preco_atual: 99, em_estoque: true }));
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const freshStats = (): ShopeePersistenceStats => ({ upserted: 0, batchErrors: 0, stale: null });

function database(context: TestContext, options: { baseline?: number; legacyBaseline?: number; priorStartedAt?: string; failBatch?: number; failSweep?: boolean; failFinalize?: boolean; oldCount?: number } = {}) {
  let batches = 0, sweeps = 0;
  const statuses: string[] = [];
  const db = createClient("https://db.test", "test-key-without-real-access", { auth: { persistSession: false } });
  context.mock.method(globalThis, "fetch", async (url: unknown, init?: RequestInit) => {
    const query = new URL(String(url));
    assert.equal(query.hostname, "db.test");
    if (query.pathname.endsWith("/scrape_jobs")) {
      if (init?.method === "POST") return Response.json({ id: uuid(900) }, { status: 201 });
      if (init?.method === "PATCH") {
        const status = JSON.parse(String(init.body)).status;
        statuses.push(status);
        if (options.failFinalize && status === "success") return Response.json({ code: "57014", message: "timeout" }, { status: 500 });
        return new Response(null, { status: 204 });
      }
      return Response.json(options.legacyBaseline === undefined ? [{ itens_salvos: options.baseline ?? 600, iniciado_em: options.priorStartedAt }] : []);
    }
    assert.ok(query.pathname.endsWith("/produtos"));
    if (init?.method === "POST") {
      batches++;
      assert.ok(JSON.parse(String(init.body)).length <= 250);
      return batches === options.failBatch ? Response.json({ code: "57014", message: "timeout" }, { status: 500 }) : new Response(null, { status: 201 });
    }
    assert.equal(query.searchParams.get("loja_id"), `eq.${store}`);
    assert.equal(query.searchParams.get("sku_loja"), "like.shopee-%");
    if (options.legacyBaseline !== undefined && query.searchParams.get("select") === "visto_em") return Response.json([{ visto_em: "2026-10-19T03:00:00Z" }]);
    if (init?.method === "HEAD") {
      assert.equal(query.searchParams.get("visto_em"), "eq.2026-10-19T03:00:00Z");
      return new Response(null, { status: 200, headers: { "content-range": `*/${options.legacyBaseline}` } });
    }
    assert.equal(query.searchParams.get("visto_em"), `lt.${started}`);
    assert.equal(query.searchParams.get("em_estoque"), "eq.true");
    if (init?.method === "PATCH") {
      sweeps++;
      const ids = query.searchParams.get("id")!.slice(4, -1).split(",");
      assert.ok(ids.length <= 250);
      return options.failSweep ? Response.json({ code: "57014", message: "timeout" }, { status: 500 }) : new Response(null, { status: 204, headers: { "content-range": `*/${ids.length}` } });
    }
    const after = query.searchParams.get("id")?.slice(3) ?? "";
    const old = Array.from({ length: options.oldCount ?? 0 }, (_, i) => ({ id: uuid(i + 1) })).filter((row) => row.id > after).slice(0, 250);
    return Response.json(old);
  });
  return { db, statuses, batches: () => batches, sweeps: () => sweeps };
}

test("lote com falha interrompe a rodada e não inicia stale sweep", async (context) => {
  const logged: string[] = [];
  context.mock.method(console, "error", (...args: unknown[]) => { logged.push(args.join(" ")); });
  const mock = database(context, { failBatch: 2 });
  const stats = freshStats();
  await assert.rejects(persistShopeeFeed(mock.db, rows(600), store, started, stats), /upsert_failed/);
  assert.equal(stats.upserted, 250);
  assert.equal(stats.batchErrors, 1);
  assert.equal(mock.sweeps(), 0);
  assert.deepEqual(mock.statuses, ["partial"]);
  assert.deepEqual(logged, ["[Shopee] database_error phase=upsert code=57014 batchSize=250"]);
});

test("queda anormal de volume falha antes de alterar produtos", async (context) => {
  const mock = database(context, { baseline: 1000 });
  await assert.rejects(persistShopeeFeed(mock.db, rows(100), store, started, freshStats()), /volume_drop/);
  assert.equal(mock.batches(), 0);
  assert.equal(mock.sweeps(), 0);
  assert.deepEqual(mock.statuses, ["failed"]);
});

test("sweep usa lotes e cursor estável; restringe loja, origem automática e observações antigas", async (context) => {
  const mock = database(context, { oldCount: 503 });
  const stats = freshStats();
  await persistShopeeFeed(mock.db, rows(600), store, started, stats);
  assert.equal(mock.batches(), 3);
  assert.equal(mock.sweeps(), 3);
  assert.equal(stats.stale, 503);
  assert.equal(stats.upserted, 600);
  assert.deepEqual(mock.statuses, ["success"]);
});

test("timeout no sweep torna a rodada parcial e nunca verde", async (context) => {
  const mock = database(context, { oldCount: 1, failSweep: true });
  await assert.rejects(persistShopeeFeed(mock.db, rows(600), store, started, freshStats()), /stale_write_failed/);
  assert.deepEqual(mock.statuses, ["partial"]);
});

test("snapshot vazio, de outra loja ou manual é recusado antes de qualquer acesso", async (context) => {
  context.mock.method(globalThis, "fetch", async () => { throw new Error("network_forbidden"); });
  const db = createClient("https://db.test", "fake-key", { auth: { persistSession: false } });
  for (const invalid of [[], [{ ...rows(1)[0]!, sku_loja: "manual:1" }], [{ ...rows(1)[0]!, loja_id: uuid(100) }]]) {
    await assert.rejects(persistShopeeFeed(db, invalid, store, started, freshStats()), /invalid_snapshot/);
  }
});

test("bootstrap legado usa a última coorte para não comparar com o estoque acumulado", async (context) => {
  const mock = database(context, { legacyBaseline: 7955 });
  const stats = freshStats();
  await persistShopeeFeed(mock.db, rows(4000), store, started, stats);
  assert.equal(stats.upserted, 4000);
  assert.deepEqual(mock.statuses, ["success"]);
});

test("rodada ultrapassada por uma execução mais recente não altera produtos", async (context) => {
  const mock = database(context, { priorStartedAt: "2026-10-20T04:00:00Z" });
  await assert.rejects(persistShopeeFeed(mock.db, rows(600), store, started, freshStats()), /run_superseded/);
  assert.equal(mock.batches(), 0);
  assert.equal(mock.sweeps(), 0);
  assert.deepEqual(mock.statuses, ["failed"]);
});

test("falha ao confirmar o checkpoint final também impede conclusão verde", async (context) => {
  const mock = database(context, { failFinalize: true });
  await assert.rejects(persistShopeeFeed(mock.db, rows(600), store, started, freshStats()), /job_finalize_failed/);
  assert.deepEqual(mock.statuses, ["success", "partial"]);
});
