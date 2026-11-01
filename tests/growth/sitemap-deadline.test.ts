import test, { after } from "node:test";
import assert from "node:assert/strict";
import { listarUrlsProdutos } from "../../src/infrastructure/repositories/produtos.repo";

const priorUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const priorKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://db.test";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "fake-anon-no-real-access";
after(() => {
  if (priorUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = priorUrl;
  if (priorKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = priorKey;
});

const oldPage = Array.from({ length: 1000 }, (_, index) => ({
  id: String(index).padStart(36, "0"), atualizado_em: "2020-01-01", em_estoque: true, preco_atual: 10,
}));

test("paginação do sitemap compartilha um prazo total sem criar um novo por página", async context => {
  let deadlines = 0, calls = 0;
  const controller = new AbortController();
  context.mock.method(AbortSignal, "timeout", (ms: number) => {
    deadlines++; assert.ok(ms > 5000 && ms <= 20_000); return controller.signal;
  });
  context.mock.method(globalThis, "fetch", async (url: unknown, init?: RequestInit) => {
    calls++; assert.equal(new URL(String(url)).hostname, "db.test");
    assert.equal(init?.signal, controller.signal);
    return Response.json(calls === 1 ? oldPage : [{ ...oldPage[0], atualizado_em: new Date(Date.now() - 1000).toISOString() }]);
  });
  assert.equal((await listarUrlsProdutos()).length, 1);
  assert.equal(calls, 2); assert.equal(deadlines, 1);
});

test("cancelamento do sitemap interrompe a paginação sem publicar uma lista vazia válida", async context => {
  const controller = new AbortController(); let calls = 0;
  context.mock.method(AbortSignal, "timeout", () => controller.signal);
  context.mock.method(globalThis, "fetch", async () => {
    calls++; controller.abort(new DOMException("deadline", "TimeoutError")); return Response.json(oldPage);
  });
  await assert.rejects(listarUrlsProdutos(), { name: "TimeoutError" });
  assert.equal(calls, 1);
});

test("erro SQL durante o sitemap continua sendo erro e não perde o estado de falha", async context => {
  context.mock.method(globalThis, "fetch", async () => Response.json({ code: "57014", message: "timeout" }, { status: 500 }));
  await assert.rejects(listarUrlsProdutos(), error => (error as { code?: string }).code === "57014");
});
