import type { SupabaseClient } from "@supabase/supabase-js";

interface Row { loja_id: string; sku_loja: string; visto_em: string }
export interface ShopeePersistenceStats { upserted: number; batchErrors: number; stale: number | null; lidos?: number }
const BATCH = 250;

/** Snapshot curado: falha parcial nunca autoriza a retirada das ofertas antigas. */
export async function persistShopeeFeed<T extends Row>(db: SupabaseClient, rows: T[], lojaId: string, runStartedAt: string, stats: ShopeePersistenceStats) {
  if (!rows.length || !Number.isFinite(Date.parse(runStartedAt)) || rows.some((row) => row.loja_id !== lojaId || row.visto_em !== runStartedAt || !row.sku_loja.startsWith("shopee-"))) throw new Error("shopee_invalid_snapshot");
  const { data: job, error: jobError } = await db.from("scrape_jobs").insert({ adapter_key: "shopee", status: "running", iniciado_em: runStartedAt })
    .select("id").abortSignal(AbortSignal.timeout(15_000)).single();
  if (jobError || !job) throw new Error("shopee_job_create_failed");
  try {
    const { data: prior, error: priorError } = await db.from("scrape_jobs").select("itens_salvos,iniciado_em")
      .eq("adapter_key", "shopee").eq("status", "success").order("iniciado_em", { ascending: false })
      .limit(1).abortSignal(AbortSignal.timeout(15_000)).maybeSingle();
    if (priorError) throw new Error("shopee_baseline_read_failed");
    if (prior?.iniciado_em && Date.parse(prior.iniciado_em as string) > Date.parse(runStartedAt)) throw new Error("shopee_run_superseded");
    let baseline = prior?.itens_salvos as number | undefined;
    if (baseline === undefined) {
      // Bootstrap legado: a última coorte, não todo o estoque acumulado por sweeps falhos.
      const { data: last, error } = await db.from("produtos").select("visto_em").eq("loja_id", lojaId)
        .like("sku_loja", "shopee-%").order("visto_em", { ascending: false, nullsFirst: false }).limit(1)
        .abortSignal(AbortSignal.timeout(15_000)).maybeSingle();
      if (error) throw new Error("shopee_baseline_read_failed");
      if (last?.visto_em) {
        if (Date.parse(last.visto_em as string) > Date.parse(runStartedAt)) throw new Error("shopee_run_superseded");
        const { count, error: countError } = await db.from("produtos").select("id", { count: "exact", head: true })
          .eq("loja_id", lojaId).like("sku_loja", "shopee-%").eq("visto_em", last.visto_em)
          .abortSignal(AbortSignal.timeout(15_000));
        if (countError || count === null) throw new Error("shopee_baseline_read_failed");
        baseline = count;
      }
    }
    if (baseline !== undefined && (!Number.isFinite(baseline) || baseline < 0 || rows.length < baseline / 2)) throw new Error("shopee_abnormal_volume_drop");
    for (let start = 0; start < rows.length; start += BATCH) {
      const batch = rows.slice(start, start + BATCH);
      const { error } = await db.from("produtos").upsert(batch, { onConflict: "loja_id,sku_loja" }).abortSignal(AbortSignal.timeout(15_000));
      if (error) { stats.batchErrors++; throw new Error("shopee_upsert_failed"); }
      stats.upserted += batch.length;
    }
    let after: string | null = null;
    stats.stale = 0;
    while (true) {
      let query = db.from("produtos").select("id").eq("loja_id", lojaId).eq("em_estoque", true)
        .like("sku_loja", "shopee-%").lt("visto_em", runStartedAt).order("id").limit(BATCH);
      if (after) query = query.gt("id", after);
      const { data: old, error } = await query.abortSignal(AbortSignal.timeout(15_000));
      if (error) throw new Error("shopee_stale_read_failed");
      if (!old?.length) break;
      const cursor = String(old[old.length - 1]!.id);
      if (cursor === after) throw new Error("shopee_stale_cursor_not_advancing");
      const { count, error: writeError } = await db.from("produtos").update({ em_estoque: false }, { count: "exact" })
        .in("id", old.map((row) => row.id)).eq("loja_id", lojaId).eq("em_estoque", true)
        .like("sku_loja", "shopee-%").lt("visto_em", runStartedAt).abortSignal(AbortSignal.timeout(15_000));
      if (writeError || count === null) throw new Error("shopee_stale_write_failed");
      stats.stale += count;
      after = cursor;
    }
    const { error } = await db.from("scrape_jobs").update({ status: "success", finalizado_em: new Date().toISOString(),
      itens_coletados: stats.lidos ?? rows.length, itens_salvos: stats.upserted, erros: 0 }).eq("id", job.id).abortSignal(AbortSignal.timeout(15_000));
    if (error) throw new Error("shopee_job_finalize_failed");
  } catch (error) {
    await db.from("scrape_jobs").update({ status: stats.upserted ? "partial" : "failed", finalizado_em: new Date().toISOString(),
      itens_coletados: stats.lidos ?? rows.length, itens_salvos: stats.upserted, erros: 1 }).eq("id", job.id).abortSignal(AbortSignal.timeout(15_000));
    throw error;
  }
}
