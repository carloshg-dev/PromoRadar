import { appendFile, mkdir, mkdtemp, opendir, rm } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import type { Produto, CategoriaSlug } from "@/core/domain/types";
import { assinatura } from "@/core/matching/match";
import { agruparComparacoes, type Comparacao } from "@/core/matching/comparison";
import { SNAPSHOT_MAX_BYTES, snapshotHash, snapshotScope, snapshotSchema } from "@/core/matching/snapshot";
import { hasRecentPrice } from "@/core/offer-freshness";

interface SnapshotBuildOptions {
  categories: readonly string[];
  verticals: readonly { categorias: readonly { slug: string }[] }[];
  batches: (category: string, now: number) => AsyncIterable<Produto[]>;
  write: (path: string, body: string) => Promise<void>;
  now?: number;
}

/** Só Node/Actions. O disco agrupa classes; RAM contém um lote e uma oferta por loja. */
export async function buildComparisonSnapshots(options: SnapshotBuildOptions) {
  const now = options.now ?? Date.now();
  const index = { schema: 1 as const, version: randomUUID(), generatedAt: new Date(now).toISOString() };
  const temporaryRoot = resolve(tmpdir());
  const directory = await mkdtemp(join(temporaryRoot, "promodetec-comparisons-"));
  if (dirname(directory) !== temporaryRoot) throw new Error("comparison_unsafe_temporary_path");
  const scopes = new Map<string, Comparacao[]>();
  let rows = 0, comparisons = 0, maxGroupStores = 0;
  if (options.categories.length > 50) throw new Error("comparison_category_limit");
  const keep = (scope: string, comparison: Comparacao) => {
    const top = scopes.get(scope) ?? [];
    top.push(comparison);
    top.sort((a, b) => b.lojas - a.lojas || b.economia - a.economia || a.chave.localeCompare(b.chave));
    top.length = Math.min(top.length, 60);
    scopes.set(scope, top);
  };
  const writeSnapshot = async (kind: string, identity: string, items: Comparacao[]) => {
    const body = JSON.stringify(snapshotSchema.parse({ ...index, comparacoes: items }));
    if (Buffer.byteLength(body) > SNAPSHOT_MAX_BYTES) throw new Error("comparison_snapshot_too_large");
    await options.write(`v1/${index.version}/${kind}/${await snapshotHash(identity)}.json`, body);
  };
  try {
    for (const category of options.categories) {
      const folder = join(directory, category);
      if (!/^[a-z0-9-]+$/.test(category)) throw new Error("comparison_invalid_category");
      await mkdir(folder);
      for await (const batch of options.batches(category, now)) {
        if (batch.length > 250) throw new Error("comparison_batch_limit");
        const files = new Map<string, string[]>();
        for (const product of batch) {
          if (product.categoriaSlug !== category) throw new Error("comparison_category_mismatch");
          if (!product.emEstoque || !(product.precoAtual! > 0) || !hasRecentPrice(product.atualizadoEm, now)) continue;
          rows++;
          const signature = assinatura(product.titulo, category as CategoriaSlug, product.marca);
          if (!signature) continue;
          const key = await snapshotHash(signature);
          const lines = files.get(key) ?? [];
          lines.push(JSON.stringify(product) + "\n"); files.set(key, lines);
        }
        for (const [key, lines] of files) await appendFile(join(folder, key), lines.join(""));
      }
      const files = await opendir(folder);
      for await (const file of files) {
        const perStore = new Map<string, Produto>();
        const input = createReadStream(join(folder, file.name), { highWaterMark: 64 * 1024 });
        const lines = createInterface({ input, crlfDelay: Infinity });
        try {
          for await (const line of lines) {
            const product = JSON.parse(line) as Produto;
            const current = perStore.get(product.lojaSlug);
            if (!current || product.precoAtual! < current.precoAtual!) perStore.set(product.lojaSlug, product);
            if (perStore.size > 256) throw new Error("comparison_store_limit");
          }
        } finally { lines.close(); input.destroy(); }
        maxGroupStores = Math.max(maxGroupStores, perStore.size);
        const comparison = agruparComparacoes([...perStore.values()], 1)[0];
        if (!comparison) continue;
        comparisons++;
        await writeSnapshot("products", `${category}|${comparison.chave}`, [comparison]);
        const targets = new Set([snapshotScope({ categoria: category }), "all"]);
        for (const vertical of options.verticals) {
          if (vertical.categorias.some(c => c.slug === category)) targets.add(snapshotScope({ categorias: vertical.categorias.map(c => c.slug) }));
        }
        for (const scope of targets) keep(scope, comparison);
      }
    }
    if (!rows) throw new Error("comparison_empty_catalog");
    for (const category of options.categories) {
      const scope = snapshotScope({ categoria: category });
      if (!scopes.has(scope)) scopes.set(scope, []);
    }
    for (const vertical of options.verticals) {
      const scope = snapshotScope({ categorias: vertical.categorias.map(c => c.slug) });
      if (!scopes.has(scope)) scopes.set(scope, []);
    }
    if (!scopes.has("all")) scopes.set("all", []);
    for (const [scope, items] of scopes) await writeSnapshot("lists", scope, items);
    // O manifesto permite reter/limpar somente gerações comprovadamente completas.
    await options.write(`v1/${index.version}/index.json`, JSON.stringify(index));
    // O ponteiro só muda após TODAS as leituras e gravações válidas; falhas preservam a versão anterior.
    await options.write("v1/index.json", JSON.stringify(index));
    return { ...index, rows, comparisons, scopes: scopes.size, maxBatch: 250, maxGroupStores };
  } finally { await rm(directory, { recursive: true, force: true }); }
}
