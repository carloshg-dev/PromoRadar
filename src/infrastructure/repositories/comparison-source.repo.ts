import { createPublicClient } from "@/infrastructure/supabase/client";
import { recentPriceSince } from "@/core/offer-freshness";
import { SELECT_PRODUTO, mapProduto } from "./produto-row";

/** Somente runner Node: paginação por cursor, sem acumular catálogo na RAM. */
export async function* comparisonProductBatches(category: string, now: number) {
  const sb = createPublicClient();
  let cursor = "", count = 0;
  for (;;) {
    let query = sb.from("vw_ofertas").select(SELECT_PRODUTO).eq("categoria_slug", category)
      .eq("em_estoque", true).gt("preco_atual", 0)
      .gte("atualizado_em", recentPriceSince(now)).lte("atualizado_em", new Date(now).toISOString())
      .order("id", { ascending: true }).limit(250).abortSignal(AbortSignal.timeout(20_000));
    if (cursor) query = query.gt("id", cursor);
    const { data, error } = await query;
    if (error) throw new Error(`comparison_source_failed:${category}`);
    const batch = (data ?? []).map(mapProduto);
    if (!batch.length) return;
    count += batch.length;
    if (count > 100_000) throw new Error("comparison_source_safety_limit");
    const next = batch.at(-1)!.id;
    if (next <= cursor) throw new Error("comparison_source_cursor_not_advancing");
    yield batch;
    cursor = next;
  }
}
