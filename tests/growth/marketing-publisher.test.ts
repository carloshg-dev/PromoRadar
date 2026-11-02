import assert from "node:assert/strict";
import test, { after } from "node:test";
import { publicar } from "../../src/pipeline/publisher.service";
import { curar } from "../../src/pipeline/curadoria.service";

const names = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "TELEGRAM_BOT_TOKEN", "TELEGRAM_FEED_CHAT_ID", "DISCORD_DEALS_WEBHOOK_URL"] as const;
const prior = names.map(name => process.env[name]);
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://db.test";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-no-real-access";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-no-real-access";
after(() => names.forEach((name, i) => { if (prior[i] === undefined) delete process.env[name]; else process.env[name] = prior[i]; }));

const campaign = (id: string, metadata: Record<string, unknown>, image = true) => ({
  id, status: "READY", metadados: metadata, imagens: image ? { feed: "/not-read-in-preview.png" } : {}, plataformas: ["telegram"],
});
const current = { precoAtual: 49.9, atualizadoEm: new Date(Date.now() - 1000).toISOString() };

test("publisher dry-run não envia nem muda status, incluindo campanhas inválidas", async context => {
  const messages: string[] = [];
  context.mock.method(console, "log", (...args: unknown[]) => messages.push(args.join(" ")));
  context.mock.method(globalThis, "fetch", async (input: unknown, init?: RequestInit) => {
    const url = new URL(String(input));
    assert.equal(url.hostname, "db.test"); assert.equal(url.pathname, "/rest/v1/campanhas");
    assert.equal(init?.method ?? "GET", "GET");
    return Response.json([
      campaign("valid", current), campaign("expensive", { ...current, precoAtual: 100.01 }),
      campaign("stale", { ...current, atualizadoEm: new Date(Date.now() - 8 * 86400000).toISOString() }),
      campaign("legacy", { precoAtual: 19.9 }), campaign("no-image", current, false),
    ]);
  });
  assert.deepEqual(await publicar(true), { ok: 1, falhas: 4 });
  assert.equal(messages.length, 1); assert.match(messages[0]!, /status permanece READY/);
});

test("publisher configurado bloqueia preços antigos ou acima do orçamento antes do envio", async context => {
  process.env.TELEGRAM_BOT_TOKEN = "test-bot-not-a-token";
  process.env.TELEGRAM_FEED_CHAT_ID = "test-authorized-destination";
  delete process.env.DISCORD_DEALS_WEBHOOK_URL;
  const changes: unknown[] = [];
  context.mock.method(globalThis, "fetch", async (input: unknown, init?: RequestInit) => {
    const url = new URL(String(input));
    assert.equal(url.hostname, "db.test"); assert.equal(url.pathname, "/rest/v1/campanhas");
    if (init?.method === "PATCH") {
      changes.push(JSON.parse(String(init.body)));
      return new Response(null, { status: 204 });
    }
    assert.equal(init?.method ?? "GET", "GET");
    return Response.json([campaign("legacy", { precoAtual: 39 }), campaign("expensive", { ...current, precoAtual: 6000 })]);
  });
  assert.deepEqual(await publicar(), { ok: 0, falhas: 2 });
  assert.deepEqual(changes, Array(2).fill({ status: "FAILED", erro: "campaign_price_not_current_or_outside_budget" }));
});

test("curadoria procura alternativas sem repetir produto e respeita quantidade e teto", async context => {
  const created: Record<string, unknown>[] = [];
  context.mock.method(globalThis, "fetch", async (input: unknown, init?: RequestInit) => {
    const url = new URL(String(input)); assert.equal(url.hostname, "db.test");
    if (url.pathname === "/rest/v1/vw_ofertas") {
      assert.equal(url.searchParams.get("limit"), "400");
      return Response.json(Array.from({ length: 9 }, (_, index) => ({ id: String(index), titulo: "Produto útil", loja_slug: "amazon", loja_nome: "Amazon", url: "https://www.amazon.com.br/dp/B0TEST?tag=test-20", imagem_url: "https://cdn.test/product.jpg", preco_atual: index === 8 ? 150 : 50, atualizado_em: current.atualizadoEm, em_estoque: true })));
    }
    assert.equal(url.pathname, "/rest/v1/campanhas");
    if (init?.method === "HEAD") {
      const recent = ["eq.0", "eq.1"].includes(url.searchParams.get("produto_id") ?? "");
      return new Response(null, { headers: { "content-range": `*/${recent ? 1 : 0}` } });
    }
    assert.equal(init?.method, "POST");
    const row = JSON.parse(String(init.body)); created.push(row);
    return Response.json({ id: `campaign-${created.length}`, ...row }, { status: 201 });
  });
  assert.equal(await curar(2), 2);
  assert.deepEqual(created.map(row => row.produto_id), ["2", "3"]);
  assert.ok(created.every(row => (row.metadados as typeof current).precoAtual <= 100));
  assert.ok(created.every(row => JSON.stringify(row.plataformas) === '["telegram"]'));
});
