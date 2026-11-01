import test from "node:test";
import assert from "node:assert/strict";
import { publicCoupons, COUPON_MAX_AGE_MS } from "../../src/core/coupons";
import { awinCoupon, boundedJson } from "../../src/infrastructure/coupons/sources";
import { collectionQuery, collectionForTitle } from "../../src/core/shop-collections";
import { summarizeAwinTransactions, reportWindow } from "../../src/core/affiliate-report";

const now = Date.parse("2026-11-01T10:00:00Z"), checkedAt = new Date(now).toISOString();
const source = { promotionId: 1, type: "voucher", advertiser: { name: "Loja", joined: true }, regions: { list: [{ countryCode: "BR" }] }, title: "Cupom real", voucher: { code: "REAL" }, urlTracking: "https://www.awin1.com/cread.php?awinaffid=2936727&awinmid=1", startDate: "2026-10-30T00:00:00", endDate: "2026-11-02T00:00:00", terms: "Pedido mínimo de R$100" };
test("cupom exige afiliação, região, tracking próprio, código e datas válidas", () => {
  const coupon = awinCoupon(source, checkedAt, "2936727"); assert.ok(coupon); assert.equal(coupon.terminaEm, "2026-11-02T00:00:00.000Z");
  for (const bad of [{ ...source, advertiser: { ...source.advertiser, joined: false } }, { ...source, voucher: {} }, { ...source, regions: { list: [{ countryCode: "US" }] } }, { ...source, urlTracking: "https://www.awin1.com/cread.php?awinaffid=999" }, { ...source, endDate: "invalid" }]) assert.equal(awinCoupon(bad, checkedAt, "2936727"), null);
});
test("snapshot elimina códigos repetidos e campanhas expiradas sem inventar validade", () => {
  const coupon = awinCoupon(source, checkedAt, "2936727")!;
  const result = publicCoupons({ schema: 1, generatedAt: checkedAt, coupons: [coupon, { ...coupon, id: "duplicate" }, { ...coupon, id: "expired", codigo: "EXPIRED", terminaEm: new Date(now - 1).toISOString() }] }, now);
  assert.equal(result.coupons.length, 1); assert.equal(result.coupons[0]?.codigo, "REAL");
  assert.throws(() => publicCoupons({ schema: 1, generatedAt: new Date(now - COUPON_MAX_AGE_MS - 1).toISOString(), coupons: [coupon] }, now));
});
test("resposta excessiva é interrompida antes do parse e errors não expõem payload", async context => {
  context.mock.method(globalThis, "fetch", async () => new Response(new Uint8Array(2 * 1024 * 1024 + 1)));
  await assert.rejects(boundedJson("https://api.test/"), /affiliate_response_limit/);
});
test("coleções são fechadas e não aceitam expressão livre de PostgREST", () => {
  assert.equal(collectionForTitle("Pocky chocolate japonês"), "doces"); assert.equal(collectionForTitle("Organizador de cozinha"), "casa");
  assert.equal(collectionQuery("doces),or(id.gt.0"), null); assert.match(collectionQuery("doces")!, /titulo\.ilike\.\*chocolate\*/);
});
test("relatório separa comissões pendentes, aprovadas, recusadas e moedas", () => {
  const sale = { type: "Sale", saleAmount: { amount: 100, currency: "BRL" }, commissionAmount: { amount: 3.28, currency: "BRL" }, commissionStatus: "pending", basketProducts: [{ productName: "Chocolate", quantity: 2 }], orderRef: "private" };
  const result = summarizeAwinTransactions([sale, { ...sale, commissionStatus: "approved" }, { ...sale, commissionStatus: "declined" }, { ...sale, saleAmount: { amount: 100, currency: "USD" } }, { ...sale, type: "Lead" }]);
  assert.equal(result.statuses.pending?.commission, 328); assert.equal(result.statuses.approved?.transactions, 1); assert.equal(result.otherCurrency, 1); assert.equal(result.nonSale, 1);
  assert.deepEqual(result.topProducts, [["Chocolate", 4]]); assert.ok(!JSON.stringify(result).includes("private"));
});
test("janelas de relatório usam dias completos em Brasília na virada do mês", () => {
  assert.deepEqual(reportWindow(1, new Date("2026-11-01T10:00:00Z")), { since: "2026-10-31T03:00:00.000Z", until: "2026-11-01T03:00:00.000Z" });
  assert.deepEqual(reportWindow(7, new Date("2026-11-01T01:00:00Z")), { since: "2026-10-24T03:00:00.000Z", until: "2026-10-31T03:00:00.000Z" });
});
