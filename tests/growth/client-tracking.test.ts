import test, { after } from "node:test";
import assert from "node:assert/strict";
import { track } from "../../src/components/analytics/track";

const globals = ["window", "document", "navigator", "localStorage"] as const;
const descriptors = new Map(globals.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
const oldEnvironment = process.env.NODE_ENV;
const events = new EventTarget();
let consent = "rejected", blocked = false, dnt = "0", beaconAccepted = true;
const sent: string[] = [];
const storage = { getItem() { if (blocked) throw new Error("storage_blocked"); return consent; } };
Object.defineProperties(globalThis, {
  window: { configurable: true, value: { addEventListener: events.addEventListener.bind(events), location: { hostname: "site.test" } } },
  document: { configurable: true, value: { addEventListener() {}, visibilityState: "visible" } },
  localStorage: { configurable: true, value: storage },
  navigator: { configurable: true, value: { get doNotTrack() { return dnt; }, sendBeacon(_url: string, blob: Blob) { void blob.text().then((value) => sent.push(value)); return beaconAccepted; } } },
});
Object.assign(process.env, { NODE_ENV: "production" });
after(() => {
  for (const key of globals) { const descriptor = descriptors.get(key); if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }
  if (oldEnvironment === undefined) Reflect.deleteProperty(process.env, "NODE_ENV"); else Object.assign(process.env, { NODE_ENV: oldEnvironment });
});
const tick = () => new Promise((resolve) => setImmediate(resolve));

test("tracking fica desligado sem consentimento, com DNT ou armazenamento bloqueado", async () => {
  track("visita", { origem: "/" });
  consent = "accepted"; dnt = "1"; track("visita", { origem: "/" });
  dnt = "0"; blocked = true; track("visita", { origem: "/" });
  blocked = false;
  events.dispatchEvent(new Event("pagehide"));
  await tick();
  assert.equal(sent.length, 0);
});

test("eventos de uma interação vão em um lote com privacidade", async () => {
  track("busca", { termo: "fone bluetooth", origem: "atalho" });
  track("busca_sem_resultado", { termo: "fone bluetooth", origem: "atalho" });
  events.dispatchEvent(new Event("pagehide"));
  await tick();
  assert.equal(sent.length, 1);
  assert.equal(JSON.parse(sent[0]!).events.length, 2);
  assert.equal(JSON.parse(sent[0]!).consent, "accepted");
});

test("revogar consentimento descarta o lote pendente", async () => {
  track("visita", { origem: "/" });
  consent = "rejected";
  events.dispatchEvent(new Event("pd-consent-change"));
  events.dispatchEvent(new Event("pagehide"));
  await tick();
  assert.equal(sent.length, 1);
});

test("falha do sendBeacon usa fetch e lotes ficam abaixo do teto do servidor", async (context) => {
  consent = "accepted"; beaconAccepted = false;
  const bodies: string[] = [];
  context.mock.method(globalThis, "fetch", async (_url: unknown, init?: RequestInit) => { bodies.push(String(init?.body)); return new Response(null, { status: 204 }); });
  for (let index = 0; index < 25; index++) track("busca", { termo: "á".repeat(80), origem: "ofertas-verificadas", categoriaSlug: "categoria".repeat(6), lojaSlug: "lojaloja".repeat(7) });
  events.dispatchEvent(new Event("pagehide"));
  await tick();
  assert.ok(bodies.length >= 2);
  assert.ok(bodies.every((body) => new TextEncoder().encode(body).byteLength < 8192));
  assert.equal(bodies.reduce((count, body) => count + JSON.parse(body).events.length, 0), 25);
});
