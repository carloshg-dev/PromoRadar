import { z } from "zod";
import { hasRecentPrice } from "@/core/offer-freshness";
import { verifiedBrlPrice } from "@/core/catalog-policy";
import { agruparComparacoes, type Comparacao } from "./comparison";

export const SNAPSHOT_BUCKET = "catalog-comparisons";
export const SNAPSHOT_MAX_BYTES = 512 * 1024;
export const SNAPSHOT_MAX_AGE = 48 * 60 * 60 * 1000;
export const snapshotIndexSchema = z.object({
  schema: z.literal(1), version: z.string().uuid(), generatedAt: z.string().datetime(),
});
export type SnapshotIndex = z.infer<typeof snapshotIndexSchema>;

const nullableNumber = z.number().finite().nullable();
const nullableText = z.string().nullable();
const productSchema = z.object({
  id: z.string().uuid(), titulo: z.string().max(2000), marca: nullableText,
  url: z.string().url(), imagemUrl: nullableText, precoAtual: z.number().positive().finite(),
  precoOriginal: nullableNumber, descontoPct: nullableNumber, promoScore: nullableNumber,
  precoMinHist: nullableNumber, precoMaxHist: nullableNumber, precoAvgHist: nullableNumber,
  emEstoque: z.literal(true), atualizadoEm: z.string().max(64), lojaNome: z.string(), lojaSlug: z.string(),
  categoriaNome: nullableText, categoriaSlug: nullableText, categoriaEmoji: nullableText,
});
const comparisonSchema = z.object({
  chave: z.string(), rotulo: z.string(), categoriaSlug: nullableText, categoriaNome: nullableText,
  categoriaEmoji: nullableText, ofertas: z.array(productSchema).min(2).max(256), lojas: z.number().int().min(2),
  menorPreco: z.number().positive(), maiorPreco: z.number().positive(), economia: z.number().nonnegative(),
  economiaPct: z.number().min(0).max(100), melhorScore: nullableNumber,
});
export const snapshotSchema = snapshotIndexSchema.extend({ comparacoes: z.array(comparisonSchema).max(60) });

export async function snapshotHash(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
}

export function snapshotScope(opts: { categoria?: string; categorias?: string[] }): string {
  const categories = opts.categorias?.length ? opts.categorias : opts.categoria && opts.categoria !== "all" ? [opts.categoria] : [];
  return [...new Set(categories)].sort().join(",") || "all";
}

export function validateSnapshotIndex(value: unknown, now = Date.now()): SnapshotIndex {
  const index = snapshotIndexSchema.parse(value);
  const age = now - Date.parse(index.generatedAt);
  if (age < -60_000 || age > SNAPSHOT_MAX_AGE) throw new Error("comparison_snapshot_expired");
  return index;
}

/** Uma oferta que envelheceu depois da geração nunca reaparece como preço atual. */
export function currentComparisons(comparisons: Comparacao[], now = Date.now()): Comparacao[] {
  return comparisons.flatMap(c => {
    const offers = c.ofertas.filter(p => hasRecentPrice(p.atualizadoEm, now) && verifiedBrlPrice(p.lojaSlug));
    return offers.length === c.ofertas.length ? [c] : agruparComparacoes(offers, 1);
  });
}
