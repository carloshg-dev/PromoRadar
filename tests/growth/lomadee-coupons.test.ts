import test from "node:test";
import assert from "node:assert/strict";
import { collectLomadeeCoupons } from "../../src/infrastructure/coupons/sources";
import { boundedJson } from "../../src/infrastructure/affiliates/http";
import { lomadeeComparatorChannel, lomadeeComparatorLink } from "../../src/infrastructure/lomadee/api";

const checkedAt = "2026-11-01T12:00:00.000Z";
const channels = [{ id: "owner-channel", availableChannel: { id: "comparator-type", name: "PriceComparator" }, shortUrls: ["https://lmdee.link/fixture"] }];
const brand = { id: "brand", name: "Loja real", network: { active: true }, channels };
const campaign = (id: string) => ({ id, name: "Oferta real", status: "onTime", organizationId: "brand", channels,
  code: "REAL", period: { startAt: "2026-10-01T00:00:00Z", endAt: "2026-12-01T00:00:00Z" } });

test("Lomadee percorre as sete páginas de marcas e dezessete de campanhas sem descartar cupons", async context => {
  let brandPages = 0, campaignPages = 0;
  context.mock.method(globalThis, "fetch", async (input: unknown) => {
    const url = new URL(String(input)), page = Number(url.searchParams.get("page"));
    assert.equal(url.searchParams.get("limit"), "20");
    if (url.pathname.endsWith("brands")) {
      brandPages++;
      return Response.json({ data: page === 7 ? [brand] : [{ ...brand, id: `other-${page}` }], pagination: { page, totalPages: 7 } });
    }
    campaignPages++;
    return Response.json({ data: [campaign(String(page))], meta: { page, totalPages: 17 } });
  });
  const result = await collectLomadeeCoupons("fixture-key", checkedAt);
  assert.equal(result.status, "ok"); assert.equal(brandPages, 7); assert.equal(campaignPages, 17);
  assert.equal(result.coupons.length, 17); assert.equal(result.coupons.at(-1)?.id, "lomadee-17");
});

test("limite e falha tardia conservam cupons válidos, mas mantêm status parcial", async context => {
  for (const failure of ["limit", "http", "repeated_page"]) {
    context.mock.method(globalThis, "fetch", async (input: unknown) => {
      const url = new URL(String(input)), page = Number(url.searchParams.get("page"));
      if (url.pathname.endsWith("brands")) return Response.json({ data: [brand], pagination: { page, totalPages: 1 } });
      if (failure === "http" && page === 3) return new Response("", { status: 500 });
      return Response.json({ data: [campaign(String(page))], meta: { page: failure === "repeated_page" ? 1 : page, totalPages: 40 } });
    });
    const result = await collectLomadeeCoupons("fixture-key", checkedAt);
    assert.notEqual(result.status, "ok");
    assert.equal(result.coupons.length, failure === "limit" ? 25 : failure === "http" ? 2 : 1);
    context.mock.restoreAll();
  }
});

test("marca bloqueada, canal de outro tipo e validade inválida não viram oferta pública", async context => {
  const inactive = { ...brand, id: "inactive", network: { active: false } };
  context.mock.method(globalThis, "fetch", async (input: unknown) => String(input).includes("/brands?")
    ? Response.json({ data: [brand, inactive], pagination: { page: 1, totalPages: 1 } })
    : Response.json({ data: [campaign("valid"), { ...campaign("bad-date"), period: { endAt: "nonsense" } },
      { ...campaign("future"), period: { startAt: "2027-01-01T00:00:00Z" } }, { ...campaign("inactive"), organizationId: "inactive" },
      { ...campaign("social"), channels: [{ availableChannel: { name: "Social" }, shortUrls: ["https://lmdee.link/social"] }] }], meta: { page: 1, totalPages: 1 } }));
  assert.deepEqual((await collectLomadeeCoupons("fixture-key", checkedAt)).coupons.map(c => c.id), ["lomadee-valid"]);
  assert.equal(lomadeeComparatorLink(channels, "different"), null);
  assert.equal(lomadeeComparatorLink(channels, "comparator-type"), "https://lmdee.link/fixture");
  assert.equal(lomadeeComparatorLink(channels, "owner-channel"), "https://lmdee.link/fixture");
});

test("tipo legado resolve uma única instância da conta; propósito errado e ambiguidade continuam bloqueados", () => {
  assert.deepEqual(lomadeeComparatorChannel(channels, "comparator-type"), { id: "owner-channel", link: "https://lmdee.link/fixture", matchedBy: "legacy_type_id" });
  assert.equal(lomadeeComparatorChannel(channels, "owner-channel")?.matchedBy, "channel_id");
  assert.equal(lomadeeComparatorChannel([{ ...channels[0], id: "other-channel" }], "owner-channel"), null);
  assert.equal(lomadeeComparatorChannel([...channels, { ...channels[0], id: "second-channel" }], "comparator-type"), null);
  assert.equal(lomadeeComparatorChannel([{ ...channels[0], availableChannel: { id: "comparator-type", name: "Social" } }], "comparator-type"), null);
});

test("leitura paginada preserva o cancelamento do orçamento compartilhado", async context => {
  const controller = new AbortController(); controller.abort();
  context.mock.method(globalThis, "fetch", async (_url: unknown, init?: RequestInit) => {
    assert.equal(init?.signal?.aborted, true); throw new Error("fixture_aborted");
  });
  await assert.rejects(boundedJson("https://fixture.test", { signal: controller.signal }), /fixture_aborted/);
});
