import test from "node:test";
import assert from "node:assert/strict";
import { batchSchema, eventSchema, isAutomatedRequest, publicPage, safeSearchTerm, safeOrigin } from "../../src/core/analytics/events";
import { movementAccumulator } from "../../src/core/analytics/summary";
import { parseRadar, toggleRadar, RADAR_LIMIT } from "../../src/core/radar";
import { hasSessionCookie, protectedPath } from "../../src/core/auth-policy";
import { productMetadata, productStructuredData, safeJsonLd } from "../../src/lib/product-seo";
import { foldAnalyticsPages } from "../../src/infrastructure/repositories/analytics.repo";
import type { Produto } from "../../src/core/domain/types";
import { searchTerm, titlePattern, pageNumber } from "../../src/core/search";
import { config as middlewareConfig } from "../../middleware";
import { hasRecentPrice, recentPriceSince } from "../../src/core/offer-freshness";

const id = "12345678-1234-4234-8234-123456789abc";

test("coletor exige consentimento, allowlist, UUID e lote limitado", () => {
  assert.equal(batchSchema.safeParse({ consent: "rejected", events: [{ tipo: "busca" }] }).success, false);
  assert.equal(batchSchema.safeParse({ consent: "accepted", events: Array(21).fill({ tipo: "visita" }) }).success, false);
  assert.equal(eventSchema.safeParse({ tipo: "login", produtoId: id }).success, false);
  assert.equal(eventSchema.safeParse({ tipo: "saida_loja", produtoId: "qualquer-texto" }).success, false);
  const parsed = eventSchema.parse({ tipo: "salvar_produto", produtoId: id, email: "private@example.com", origem: "produto" });
  assert.equal("email" in parsed, false);
  assert.equal(parsed.produtoId, id);
});

test("busca não persiste contatos, URL ou segredo digitado", () => {
  for (const term of ["nome@example.com", "https://example.com", "(13) 99999-1234", "123.456.789-01", "senha privada", "token de acesso"]) assert.equal(safeSearchTerm(term), undefined);
  assert.equal(safeSearchTerm("  fone   bluetooth  "), "fone bluetooth");
  assert.equal(safeOrigin("https://site.test/token"), undefined);
  assert.equal(safeOrigin("texto-livre-privado"), undefined);
  assert.equal(safeOrigin("ofertas-verificadas"), "ofertas-verificadas");
  assert.equal(safeOrigin(`/produto/${id}`), "/produto/:id");
});

test("busca trata coringas como texto e página inválida não produz offset excessivo", () => {
  assert.equal(searchTerm(["fone"]), "");
  assert.equal(searchTerm("  fone   bluetooth  "), "fone bluetooth");
  assert.equal(searchTerm("x".repeat(1000)).length, 80);
  assert.equal(titlePattern("50%_\\"), "%50\\%\\_\\\\%");
  for (const value of ["NaN", "Infinity", "-9", undefined]) assert.equal(pageNumber(value), 1);
  assert.equal(pageNumber("999999999"), 1000);
  assert.equal(pageNumber("2.9"), 2);
});

test("middleware ignora assets, prefetch de imagens e endpoints públicos de medição", () => {
  const matcher = new RegExp(`^${middlewareConfig.matcher[0]}$`);
  for (const path of ["/favicon.ico", "/sitemap.xml", "/robots.txt", "/logo.svg", "/_next/static/app.js", "/_next/image", "/api/track", "/api/search", `/r/${id}`]) assert.equal(matcher.test(path), false, path);
  for (const path of ["/admin", "/ofertas", `/produto/${id}`]) assert.equal(matcher.test(path), true, path);
});

test("tráfego técnico e rotas privadas não entram como audiência", () => {
  for (const ua of ["Googlebot", "Slackbot-LinkExpanding", "HeadlessChrome", "curl/8", ""]) assert.equal(isAutomatedRequest(ua), true);
  assert.equal(isAutomatedRequest("Mozilla/5.0 Chrome/140", "prefetch"), true);
  assert.equal(isAutomatedRequest("Mozilla/5.0 Chrome/140"), false);
  assert.equal(publicPage("/admin"), null);
  assert.equal(publicPage("/auth/callback"), null);
  assert.equal(publicPage("/ofertas?busca=email@example.com"), null);
  assert.equal(publicPage(`/produto/${id}`), "/produto/:id");
});

test("rotas protegidas exigem identidade e cookies técnicos não fingem uma sessão", () => {
  assert.equal(protectedPath("/admin/produtos"), true);
  assert.equal(protectedPath("/admin-qualquer"), false);
  assert.equal(protectedPath("/"), false);
  assert.equal(hasSessionCookie([{ name: "pd-consent", value: "accepted" }]), false);
  assert.equal(hasSessionCookie([{ name: "sb-project-auth-token.0", value: "opaque" }]), true);
  assert.equal(hasSessionCookie([{ name: "sb-project-auth-token", value: "" }]), false);
});

test("radar recupera JSON inválido, rejeita links e limita armazenamento", () => {
  assert.deepEqual(parseRadar("{broken"), []);
  assert.deepEqual(parseRadar(JSON.stringify([{ id: "javascript:alert(1)", titulo: "x" }])), []);
  assert.equal(parseRadar(JSON.stringify([{ id, titulo: "Fone" }, { id, titulo: "Duplicado" }])).length, 1);
  const saved = toggleRadar([], { id, titulo: "Fone" });
  assert.equal(saved.action, "saved");
  assert.equal(toggleRadar(saved.items, { id, titulo: "Fone" }).action, "removed");
  const full = Array.from({ length: RADAR_LIMIT }, (_, i) => ({ id: String(i), titulo: "Teste" }));
  assert.equal(toggleRadar(full, { id, titulo: "Fone" }).action, "full");
});

test("paginação não confunde resposta curta do Supabase com fim dos dados", async () => {
  let accepted = 0, calls = 0;
  const result = await foldAnalyticsPages(async (after, limit) => {
    calls++;
    const start = Number(after ?? 0);
    return Array.from({ length: Math.min(37, limit, 1253 - start) }, (_, i) => ({ id: start + i + 1 }));
  }, () => accepted++);
  assert.equal(result.complete, true);
  assert.equal(accepted, 1253);
  assert.ok(calls > 30);
});

test("relatório falha em cursor parado e explicita teto de leitura", async () => {
  const limited = await foldAnalyticsPages(async (after, limit) => Array.from({ length: limit }, (_, i) => ({ id: Number(after ?? 0) + i + 1 })), () => {}, 1234);
  assert.deepEqual(limited, { scanned: 1234, complete: false });
  await assert.rejects(foldAnalyticsPages(async () => [{ id: 1 }], () => {}), /cursor_not_advancing/);
});

test("agregação mantém totais completos com diversidade de termos limitada", () => {
  const acc = movementAccumulator();
  for (let i = 0; i < 1700; i++) acc.add({ id: i, tipo: "busca", termo: `produto ${i}`, produto_id: null, categoria_slug: null, dispositivo: "mobile" });
  acc.add({ id: 1701, tipo: "__proto__", termo: "private@example.com", produto_id: null, categoria_slug: null, dispositivo: "desktop" });
  const result = acc.result();
  assert.equal(result.totalEventos, 1701);
  assert.equal(result.counts.busca, 1700);
  assert.equal(result.counts.outros, 1);
  assert.equal(result.rankingLimited, true);
  assert.ok(result.topBuscas.length <= 8);
});

const product: Produto = { id, titulo: 'Fone </script><script>alert(1)</script>', marca: "Marca", url: "https://loja.example/product", imagemUrl: null,
  precoAtual: 149.9, precoOriginal: 179.9, descontoPct: 16, promoScore: 90, precoMinHist: 129.9, precoMaxHist: 199.9, precoAvgHist: 170,
  emEstoque: true, atualizadoEm: "2026-10-19T03:00:00Z", lojaNome: "Loja", lojaSlug: "loja", categoriaNome: "Fones", categoriaSlug: "fones-bluetooth", categoriaEmoji: null };

test("SEO aponta para o produto, usa preço real e serializa dados sem injeção", () => {
  const now = Date.parse("2026-10-20T03:00:00Z");
  const metadata = productMetadata(product);
  assert.ok(String(metadata.alternates?.canonical).endsWith(`/produto/${id}`));
  const structured = productStructuredData(product, now) as [{ offers?: { price: number; priceCurrency: string } }];
  assert.equal(structured[0].offers?.price, 149.9);
  assert.equal(structured[0].offers?.priceCurrency, "BRL");
  assert.equal(safeJsonLd(structured).includes("</script>"), false);
  assert.equal("offers" in (productStructuredData({ ...product, precoAtual: null })[0] as object), false);
  assert.equal(JSON.stringify(structured).includes("aggregateRating"), false);
  assert.equal("offers" in (productStructuredData({ ...product, atualizadoEm: "2026-06-01" }, now)[0] as object), false);
});

test("preço recente tem janela explícita e rejeita timestamp inválido ou futuro", () => {
  const now = Date.parse("2026-10-20T03:00:00Z");
  assert.equal(recentPriceSince(now), "2026-10-13T03:00:00.000Z");
  assert.equal(hasRecentPrice("2026-10-13T03:00:00Z", now), true);
  assert.equal(hasRecentPrice("2026-10-13T02:59:59Z", now), false);
  assert.equal(hasRecentPrice("inválido", now), false);
  assert.equal(hasRecentPrice("2026-10-21T03:00:00Z", now), false);
});
