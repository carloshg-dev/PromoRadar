import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { applyComparisonRetention, planComparisonRetention, RETENTION_BATCH, type RetentionObject, type RetentionStorage } from "../../src/services/comparison-retention.service";

const now = Date.parse("2026-10-25T18:00:00.000Z");
const day = 86_400_000;
function fixture() {
  const json = new Map<string, unknown>();
  const listing = new Map<string, RetentionObject[]>([["v1", []]]);
  const removed: string[][] = [];
  const calls: { prefix: string; offset: number; limit: number }[] = [];
  const add = (age: number, fileCount = 1, legacy = false) => {
    const index = { schema: 1 as const, version: randomUUID(), generatedAt: new Date(now - age * day).toISOString() };
    const prefix = `v1/${index.version}`;
    listing.get("v1")!.push({ name: index.version, id: null });
    const file = (name: string): RetentionObject => ({ name, id: randomUUID(), created_at: index.generatedAt, updated_at: index.generatedAt, metadata: { size: 100 } });
    if (!legacy) json.set(`${prefix}/index.json`, index);
    listing.set(prefix, [...(legacy ? [] : [file("index.json")]), { name: "lists", id: null }]);
    listing.set(`${prefix}/lists`, Array.from({ length: fileCount }, (_, i) => file(i.toString(16).padStart(64, "0") + ".json")));
    return index;
  };
  const active = add(0);
  json.set("v1/index.json", active);
  listing.get("v1")!.push({ name: "index.json", id: randomUUID() });
  const storage: RetentionStorage = {
    readJson: async path => json.get(path) ?? null,
    list: async (prefix, offset, limit) => {
      calls.push({ prefix, offset, limit });
      return [...(listing.get(prefix) ?? [])].sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0).slice(offset, offset + limit);
    },
    remove: async paths => { removed.push([...paths]); },
  };
  return { json, listing, removed, calls, add, active, storage };
}
async function* stream(paths: string[]) { for (const path of paths) yield path; }

test("simulação preserva ativo, três mais recentes, legados e versões com menos de sete dias", async () => {
  const f = fixture();
  const second = f.add(1), third = f.add(2), recent = f.add(6), old = f.add(8), legacy = f.add(20, 1, true);
  const paths: string[] = [];
  const plan = await planComparisonRetention(f.storage, async p => { paths.push(p); }, now);
  assert.deepEqual(new Set(plan.protectedVersions), new Set([f.active.version, second.version, third.version]));
  assert.equal(plan.candidateVersions, 1); assert.equal(plan.candidateObjects, 2); assert.equal(plan.candidateBytes, 200);
  assert.equal(plan.legacyVersions, 1); assert.equal(plan.versions, 6);
  assert.ok(paths.every(p => p.startsWith(`v1/${old.version}/`)));
  assert.ok(!paths.some(p => p.includes(recent.version) || p.includes(legacy.version)));
  assert.equal(paths.at(-1), `v1/${old.version}/index.json`);
  assert.deepEqual(f.removed, []);
});

test("mantém três gerações completas mesmo antigas, além do ativo legado", async () => {
  const f = fixture();
  f.json.delete(`v1/${f.active.version}/index.json`);
  const preserved = [f.add(8), f.add(9), f.add(10)];
  const expired = f.add(11);
  const paths: string[] = [];
  const plan = await planComparisonRetention(f.storage, async p => { paths.push(p); }, now);
  assert.equal(plan.protectedVersions.length, 4);
  for (const index of preserved) assert.ok(plan.protectedVersions.includes(index.version));
  assert.ok(paths.every(p => p.includes(expired.version)));
});

test("paginação e remoção usam lotes de 100, nunca carregam uma lista completa no adapter", async () => {
  const f = fixture(); f.add(1); f.add(2);
  const old = f.add(8, 201), paths: string[] = [];
  const plan = await planComparisonRetention(f.storage, async p => { paths.push(p); }, now);
  const result = await applyComparisonRetention(f.storage, stream(paths), plan, now);
  assert.equal(result.removedObjects, 202);
  assert.deepEqual(f.removed.map(p => p.length), [100, 100, 2]);
  assert.ok(f.calls.every(c => c.limit === RETENTION_BATCH));
  assert.deepEqual(f.calls.filter(c => c.prefix === `v1/${old.version}/lists`).map(c => c.offset), [0, 100, 200]);
});

test("índice expirado, manifesto futuro ou divergente e listagem incompleta impedem remoção", async () => {
  for (const failure of ["expired", "future", "identity", "missing-active", "unknown-path", "repeated-page"]) {
    const f = fixture(); f.add(1); f.add(2); const old = f.add(8);
    if (failure === "expired") f.json.set("v1/index.json", { ...f.active, generatedAt: new Date(now - 3 * day).toISOString() });
    if (failure === "future") f.json.set(`v1/${old.version}/index.json`, { ...old, generatedAt: new Date(now + day).toISOString() });
    if (failure === "identity") f.json.set(`v1/${old.version}/index.json`, { ...old, version: randomUUID() });
    if (failure === "missing-active") f.listing.set("v1", f.listing.get("v1")!.filter(i => i.name !== f.active.version));
    if (failure === "unknown-path") f.listing.get(`v1/${old.version}`)!.push({ name: "private-backup", id: null });
    if (failure === "repeated-page") f.storage.list = async () => Array.from({ length: 100 }, () => ({ name: f.active.version, id: null }));
    await assert.rejects(planComparisonRetention(f.storage, async () => {}, now), Error, failure);
    assert.deepEqual(f.removed, [], failure);
  }
});

test("arquivos alterados recentemente ou sem metadados seguros interrompem o planejamento", async () => {
  for (const metadata of [{ updated_at: new Date(now).toISOString() }, { metadata: { size: -1 } }, { created_at: null }]) {
    const f = fixture(); f.add(1); f.add(2); const old = f.add(8);
    Object.assign(f.listing.get(`v1/${old.version}/lists`)![0]!, metadata);
    await assert.rejects(planComparisonRetention(f.storage, async () => {}, now), /unsafe_object_metadata/);
    assert.deepEqual(f.removed, []);
  }
});

test("erro de leitura após itens válidos não autoriza execução de um plano parcial", async () => {
  const f = fixture(); f.add(1); f.add(2); const old = f.add(8, 101);
  const list = f.storage.list;
  f.storage.list = async (prefix, offset, limit) => { if (prefix === `v1/${old.version}/lists` && offset === 100) throw new Error("network"); return list(prefix, offset, limit); };
  const paths: string[] = [];
  await assert.rejects(async () => {
    const plan = await planComparisonRetention(f.storage, async p => { paths.push(p); }, now);
    await applyComparisonRetention(f.storage, stream(paths), plan, now);
  }, /network/);
  assert.equal(paths.length, 100); assert.deepEqual(f.removed, []);
});

test("mudança do índice interrompe antes do primeiro lote e entre lotes", async () => {
  for (const changeAfter of [0, 1]) {
    const f = fixture(); f.add(1); f.add(2); f.add(8, 101);
    const paths: string[] = [], plan = await planComparisonRetention(f.storage, async p => { paths.push(p); }, now);
    const change = () => f.json.set("v1/index.json", { ...f.active, version: randomUUID() });
    if (!changeAfter) change();
    const remove = f.storage.remove;
    f.storage.remove = async batch => { await remove(batch); if (f.removed.length === changeAfter) change(); };
    await assert.rejects(applyComparisonRetention(f.storage, stream(paths), plan, now), /active_changed/);
    assert.equal(f.removed.length, changeAfter);
  }
});

test("spool não pode conter índice global, ativo, rollback ou travessia de diretório", async () => {
  const f = fixture(), rollback = f.add(1); f.add(2); const old = f.add(8);
  const plan = await planComparisonRetention(f.storage, async () => {}, now);
  for (const path of ["v1/index.json", `v1/${f.active.version}/index.json`, `v1/${rollback.version}/index.json`, `v1/${old.version}/../index.json`]) {
    await assert.rejects(applyComparisonRetention(f.storage, stream([path]), plan, now), /protected_path/);
  }
  assert.deepEqual(f.removed, []);
});

test("falha na remoção propaga erro, sem declarar sucesso nem prosseguir", async () => {
  const f = fixture(); f.add(1); f.add(2); f.add(8, 201);
  const paths: string[] = [], plan = await planComparisonRetention(f.storage, async p => { paths.push(p); }, now);
  let attempts = 0;
  f.storage.remove = async () => { attempts++; throw new Error("delete_failed"); };
  await assert.rejects(applyComparisonRetention(f.storage, stream(paths), plan, now), /delete_failed/);
  assert.equal(attempts, 1);
});

test("manifesto precisa continuar elegível na aplicação e o spool não pode duplicar objetos", async () => {
  for (const failure of ["missing", "recent", "duplicate"]) {
    const f = fixture(); f.add(1); f.add(2); const old = f.add(8);
    const paths: string[] = [], plan = await planComparisonRetention(f.storage, async p => { paths.push(p); }, now);
    if (failure === "missing") f.json.delete(`v1/${old.version}/index.json`);
    if (failure === "recent") f.json.set(`v1/${old.version}/index.json`, { ...old, generatedAt: new Date(now).toISOString() });
    await assert.rejects(applyComparisonRetention(f.storage, stream(failure === "duplicate" ? [paths[0]!, paths[0]!] : paths), plan, now), /ineligible_version|invalid_spool_order/);
    assert.deepEqual(f.removed, []);
  }
});
