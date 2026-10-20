import test from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { carregarSaudeCatalogo } from "../../src/infrastructure/repositories/catalog-health.repo";

test("saúde distingue última observação de alteração e separa lojas inativas", async (context) => {
  context.mock.method(globalThis, "fetch", async (url: unknown, init?: RequestInit) => {
    const query = new URL(String(url));
    if (query.pathname.endsWith("/lojas")) return Response.json([{ id: "active", slug: "a", nome: "A", adapter_key: "awin", ativo: true }, { id: "inactive", slug: "b", nome: "B", adapter_key: "awin", ativo: false }]);
    if (query.pathname.endsWith("/scrape_jobs")) return Response.json([]);
    if (init?.method === "HEAD") {
      const count = query.pathname.endsWith("/vw_ofertas") ? 5 : query.searchParams.get("loja_id") === "eq.inactive" ? 0 : query.searchParams.has("atualizado_em") ? 0 : query.searchParams.get("visto_em") === "is.null" ? 1 : query.searchParams.has("visto_em") ? 2 : 5;
      return new Response(null, { headers: { "content-range": `*/${count}` } });
    }
    assert.equal(query.searchParams.get("limit"), "1");
    return Response.json([{ visto_em: "2026-10-19", atualizado_em: "2026-10-19" }]);
  });
  const result = await carregarSaudeCatalogo("2026-10-12", createClient("https://db.test", "fake-key", { auth: { persistSession: false } }));
  assert.equal(result.activeStores.available, 5);
  assert.equal(result.activeStores.lastSeenBeforeWindow, 2);
  assert.equal(result.activeStores.lastModifiedBeforeWindow, 0);
  assert.equal(result.activeStores.missingLastSeen, 1);
  assert.equal(result.inactiveStores.available, 0);
});

test("falha de leitura não é convertida em zero produtos", async (context) => {
  context.mock.method(globalThis, "fetch", async () => Response.json({ code: "42501", message: "denied" }, { status: 403 }));
  await assert.rejects(carregarSaudeCatalogo("2026-10-12", createClient("https://db.test", "fake-key", { auth: { persistSession: false } })), /inventory_unavailable/);
});
