import { z } from "zod";
import { snapshotIndexSchema, validateSnapshotIndex, type SnapshotIndex } from "@/core/matching/snapshot";

export const RETENTION_DAYS = 7;
export const RETENTION_BATCH = 100;
const MAX_ENTRIES = 100_000;
const uuid = z.string().uuid();
const hashFile = /^[a-f0-9]{64}\.json$/;
const candidatePath = /^v1\/([a-f0-9-]{36})\/(index\.json|(?:lists|products)\/[a-f0-9]{64}\.json)$/;

export interface RetentionObject {
  name: string;
  id: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  metadata?: { size?: unknown } | null;
}
export interface RetentionStorage {
  readJson(path: string): Promise<unknown | null>;
  list(prefix: string, offset: number, limit: number): Promise<RetentionObject[]>;
  remove(paths: string[]): Promise<void>;
}
export interface RetentionPlan {
  active: SnapshotIndex;
  protectedVersions: string[];
  versions: number;
  legacyVersions: number;
  candidateVersions: number;
  candidateObjects: number;
  candidateBytes: number;
}

async function* entries(storage: RetentionStorage, prefix: string) {
  let previous = "";
  for (let offset = 0; offset < MAX_ENTRIES; offset += RETENTION_BATCH) {
    const batch = await storage.list(prefix, offset, RETENTION_BATCH);
    if (batch.length > RETENTION_BATCH) throw new Error("comparison_retention_batch_limit");
    for (const item of batch) {
      if (!item.name || item.name <= previous || item.name.length > 128 || /[/\\]/.test(item.name)) throw new Error("comparison_retention_invalid_listing");
      previous = item.name;
      yield item;
    }
    if (batch.length < RETENTION_BATCH) return;
  }
  throw new Error("comparison_retention_scan_limit");
}

async function* versions(storage: RetentionStorage) {
  for await (const item of entries(storage, "v1")) {
    if (item.name === "index.json" && item.id) continue;
    if (item.id !== null || !uuid.safeParse(item.name).success) throw new Error("comparison_retention_unknown_version");
    yield item.name;
  }
}

async function manifest(storage: RetentionStorage, version: string, now: number) {
  const value = await storage.readJson(`v1/${version}/index.json`);
  if (value === null) return null; // Gerações legadas/parciais exigem revisão separada.
  const index = snapshotIndexSchema.parse(value);
  if (index.version !== version || Date.parse(index.generatedAt) > now + 60_000) throw new Error("comparison_retention_invalid_manifest");
  return index;
}

async function* objects(storage: RetentionStorage, version: string) {
  const prefix = `v1/${version}`;
  let marker: (RetentionObject & { path: string }) | undefined;
  for await (const item of entries(storage, prefix)) {
    if (item.name === "index.json" && item.id) marker = { ...item, path: `${prefix}/index.json` };
    else if (item.id === null && (item.name === "lists" || item.name === "products")) {
      for await (const file of entries(storage, `${prefix}/${item.name}`)) {
        if (!file.id || !hashFile.test(file.name)) throw new Error("comparison_retention_unknown_object");
        yield { ...file, path: `${prefix}/${item.name}/${file.name}` };
      }
    } else throw new Error("comparison_retention_unknown_object");
  }
  if (!marker) throw new Error("comparison_retention_manifest_missing");
  // O marcador fica por último para permitir repetir uma remoção interrompida.
  yield marker;
}

/** Duas passagens paginadas: RAM guarda três manifestos; caminhos são enviados ao spool do runner. */
export async function planComparisonRetention(storage: RetentionStorage, writePath: (path: string) => Promise<void>, now = Date.now()): Promise<RetentionPlan> {
  const active = validateSnapshotIndex(await storage.readJson("v1/index.json"), now);
  const newest: SnapshotIndex[] = [];
  let count = 0, legacyVersions = 0, activeFound = false;
  for await (const version of versions(storage)) {
    count++;
    activeFound ||= version === active.version;
    const index = await manifest(storage, version, now);
    if (!index) { legacyVersions++; continue; }
    newest.push(index);
    newest.sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt) || a.version.localeCompare(b.version));
    newest.length = Math.min(newest.length, 3);
  }
  if (!activeFound) throw new Error("comparison_retention_active_missing");
  const protectedVersions = [...new Set([active.version, ...newest.map(i => i.version)])];
  const plan: RetentionPlan = { active, protectedVersions, versions: count, legacyVersions, candidateVersions: 0, candidateObjects: 0, candidateBytes: 0 };
  const cutoff = now - RETENTION_DAYS * 86_400_000;
  for await (const version of versions(storage)) {
    if (protectedVersions.includes(version)) continue;
    const index = await manifest(storage, version, now);
    if (!index || Date.parse(index.generatedAt) >= cutoff) continue;
    plan.candidateVersions++;
    for await (const object of objects(storage, version)) {
      const dates = [Date.parse(object.created_at ?? ""), Date.parse(object.updated_at ?? "")];
      const size = object.metadata?.size;
      if (dates.some(date => !Number.isFinite(date) || date >= cutoff) || typeof size !== "number" || !Number.isSafeInteger(size) || size < 0) throw new Error("comparison_retention_unsafe_object_metadata");
      if (++plan.candidateObjects > MAX_ENTRIES) throw new Error("comparison_retention_object_limit");
      plan.candidateBytes += size;
      if (!Number.isSafeInteger(plan.candidateBytes)) throw new Error("comparison_retention_size_limit");
      await writePath(object.path);
    }
  }
  return plan;
}

/** Só recebe spool integralmente validado. Writers/rollback devem compartilhar a exclusão do workflow. */
export async function applyComparisonRetention(storage: RetentionStorage, paths: AsyncIterable<string>, plan: RetentionPlan, now = Date.now()) {
  let batch: string[] = [], removedObjects = 0;
  let previousKey = "";
  const flush = async () => {
    if (!batch.length) return;
    for (const version of new Set(batch.map(path => path.split("/")[1]!))) {
      const index = await manifest(storage, version, now);
      if (!index || Date.parse(index.generatedAt) >= now - RETENTION_DAYS * 86_400_000) throw new Error("comparison_retention_ineligible_version");
    }
    const active = validateSnapshotIndex(await storage.readJson("v1/index.json"), now);
    if (active.version !== plan.active.version || active.generatedAt !== plan.active.generatedAt) throw new Error("comparison_retention_active_changed");
    await storage.remove(batch);
    removedObjects += batch.length;
    batch = [];
  };
  for await (const path of paths) {
    const match = candidatePath.exec(path);
    const version = match?.[1];
    if (!version || !uuid.safeParse(version).success || plan.protectedVersions.includes(version) || version === plan.active.version) throw new Error("comparison_retention_protected_path");
    const orderKey = path.replace(/\/index\.json$/, "/zindex.json");
    if (orderKey <= previousKey) throw new Error("comparison_retention_invalid_spool_order");
    previousKey = orderKey;
    if (removedObjects + batch.length >= plan.candidateObjects) throw new Error("comparison_retention_plan_mismatch");
    batch.push(path);
    if (batch.length === RETENTION_BATCH) await flush();
  }
  if (removedObjects + batch.length !== plan.candidateObjects) throw new Error("comparison_retention_plan_mismatch");
  await flush();
  return { removedObjects };
}
