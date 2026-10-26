import type { Comparacao } from "@/core/matching/comparison";
import { SNAPSHOT_BUCKET, SNAPSHOT_MAX_BYTES, snapshotHash, snapshotScope, snapshotSchema, validateSnapshotIndex, currentComparisons } from "@/core/matching/snapshot";

async function readObject(path: string): Promise<unknown | null> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new Error("comparison_snapshot_configuration_missing");
  const response = await fetch(`${base}/storage/v1/object/authenticated/${SNAPSHOT_BUCKET}/${path}`, {
    headers: { apikey: key, authorization: `Bearer ${key}` },
    next: { revalidate: 300 }, signal: AbortSignal.timeout(5_000),
  });
  if (response.status === 404) { await response.body?.cancel(); return null; }
  if (!response.ok || !response.body) { await response.body?.cancel(); throw new Error("comparison_snapshot_read_failed"); }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0, text = "";
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > SNAPSHOT_MAX_BYTES) throw new Error("comparison_snapshot_too_large");
      text += decoder.decode(chunk.value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally { await reader.cancel(); reader.releaseLock(); }
}

async function readComparisons(kind: "lists" | "products", identity: string): Promise<Comparacao[]> {
  const index = validateSnapshotIndex(await readObject("v1/index.json"));
  const payload = await readObject(`v1/${index.version}/${kind}/${await snapshotHash(identity)}.json`);
  if (payload === null && kind === "products") return [];
  const snapshot = snapshotSchema.parse(payload);
  if (snapshot.version !== index.version || snapshot.generatedAt !== index.generatedAt) throw new Error("comparison_snapshot_version_mismatch");
  return currentComparisons(snapshot.comparacoes);
}

export function lerListaComparacoes(opts: { categoria?: string; categorias?: string[] }): Promise<Comparacao[]> {
  return readComparisons("lists", snapshotScope(opts));
}

export async function lerComparacao(category: string, signature: string): Promise<Comparacao | null> {
  const comparisons = await readComparisons("products", `${category}|${signature}`);
  const comparison = comparisons[0];
  if (comparison && (comparison.chave !== signature || comparison.categoriaSlug !== category)) throw new Error("comparison_snapshot_identity_mismatch");
  return comparison ?? null;
}
