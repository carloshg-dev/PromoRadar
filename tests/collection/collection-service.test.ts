import test, { after } from "node:test";
import assert from "node:assert/strict";
import { executarColeta } from "../../src/services/collection.service";

const envNames = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "AWIN_DATAFEED_URL"];
const prior = Object.fromEntries(envNames.map((name) => [name, process.env[name]]));
Object.assign(process.env, { NEXT_PUBLIC_SUPABASE_URL: "https://db.test", SUPABASE_SERVICE_ROLE_KEY: "test-key", AWIN_DATAFEED_URL: "https://feed.test/list" });
after(() => { for (const name of envNames) { if (prior[name] === undefined) delete process.env[name]; else process.env[name] = prior[name]; } });
const store = "12345678-1234-4234-8234-123456789abc", job = "12345678-1234-4234-8234-123456789abd";

test("falha parcial Awin chega ao job e bloqueia desativação de lojas por volume", async (context) => {
  let bulkMaintenance = 0, persisted = 0;
  let finalStatus = "";
  context.mock.method(globalThis, "fetch", async (url: unknown, init?: RequestInit) => {
    const query = new URL(String(url));
    if (query.hostname === "feed.test") {
      if (query.pathname === "/list") return new Response(["good", "bad"].map((path, i) => ["18879", "", "", "", "", String(i), "", "", "", "", "", "", `https://feed.test/${path}`].join(",")).join("\n") + "\n");
      if (query.pathname === "/bad") return new Response(null, { status: 503 });
      return new Response("product_name,aw_deep_link,merchant_image_url,search_price,currency,aw_product_id\nFone Bluetooth,https://www.awin1.com/cread.php?x=1,https://image.test/p.jpg,99.90,BRL,1\n");
    }
    if (query.hostname !== "db.test") throw new Error("unexpected_external_request");
    if (query.pathname.endsWith("/scrape_jobs")) {
      if (init?.method === "POST") return Response.json({ id: job }, { status: 201 });
      finalStatus = JSON.parse(String(init?.body)).status;
      return new Response(null, { status: 204 });
    }
    if (query.pathname.endsWith("/scrape_logs")) return new Response(null, { status: 201 });
    if (query.pathname.endsWith("/categorias")) return Response.json([{ id: job, slug: "ofertas-parceiros" }]);
    if (query.pathname.endsWith("/lojas")) {
      if (init?.method === "PATCH" || query.searchParams.get("ativo") === "eq.true") bulkMaintenance++;
      return Response.json(query.searchParams.get("ativo") === "eq.false" ? [] : [{ id: store, slug: "aliexpress", nome: "AliExpress", adapter_key: "awin" }]);
    }
    if (query.pathname.endsWith("/produtos")) {
      if (init?.method === "POST") { persisted++; return new Response(null, { status: 201 }); }
      if (init?.method === "PATCH" || init?.method === "HEAD") bulkMaintenance++;
      return Response.json([]);
    }
    throw new Error("unexpected_database_request");
  });
  const result = await executarColeta(["awin"]);
  assert.equal(result.salvos, 1);
  assert.equal(result.erros, 1);
  assert.equal(result.porAdapter.awin?.erros, 1);
  assert.equal(persisted, 1);
  assert.equal(finalStatus, "partial");
  assert.equal(bulkMaintenance, 0);
});

test("loja com poucos itens não sofre baixa de estoque nem desativação por volume", async context => {
  let persisted = 0;
  context.mock.method(globalThis, "fetch", async (url: unknown, init?: RequestInit) => {
    const query = new URL(String(url));
    if (query.hostname === "feed.test") return new Response(query.pathname === "/list"
      ? ["18879", "", "", "", "", "1", "", "", "", "", "", "", "https://feed.test/good"].join(",") + "\n"
      : "product_name,aw_deep_link,merchant_image_url,search_price,currency,aw_product_id\nFone Bluetooth,https://www.awin1.com/cread.php?x=1,https://image.test/p.jpg,99.90,BRL,1\n");
    assert.equal(query.hostname, "db.test");
    if (query.pathname.endsWith("/scrape_jobs")) return init?.method === "POST" ? Response.json({ id: job }, { status: 201 }) : new Response(null, { status: 204 });
    if (query.pathname.endsWith("/scrape_logs")) return new Response(null, { status: 201 });
    if (query.pathname.endsWith("/categorias")) return Response.json([{ id: job, slug: "ofertas-parceiros" }]);
    if (query.pathname.endsWith("/lojas")) {
      assert.notEqual(init?.method, "PATCH", "volume não autoriza desativar uma loja");
      return Response.json(query.searchParams.get("ativo") === "eq.false" ? [] : [{ id: store, slug: "aliexpress", nome: "AliExpress", adapter_key: "awin" }]);
    }
    if (query.pathname.endsWith("/produtos")) {
      assert.notEqual(init?.method, "PATCH", "volume não autoriza inventar falta de estoque");
      if (init?.method === "HEAD") return new Response(null, { headers: { "content-range": "*/5" } });
      if (init?.method === "POST") { persisted++; return new Response(null, { status: 201 }); }
      return Response.json([]);
    }
    throw new Error("unexpected_database_request");
  });
  const result = await executarColeta(["awin"]);
  assert.equal(result.salvos, 1);
  assert.equal(result.erros, 0);
  assert.equal(persisted, 1);
});
