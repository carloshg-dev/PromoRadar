import { createAdminClient } from "@/infrastructure/supabase/admin";
import { movementAccumulator, type EventRow } from "@/core/analytics/summary";

const PAGE = 500;
const MAX_ROWS = 100_000;

/** Keyset e dobra por página: nunca mantém a série de eventos inteira na RAM. */
export async function foldAnalyticsPages<T extends { id: string | number }>(
  fetchPage: (after: string | null, limit: number) => Promise<T[]>,
  accept: (row: T) => void,
  maxRows = MAX_ROWS,
) {
  let after: string | null = null, scanned = 0;
  while (scanned < maxRows) {
    const page = await fetchPage(after, Math.min(PAGE, maxRows - scanned));
    if (!page.length) return { scanned, complete: true };
    const next = String(page[page.length - 1]!.id);
    if (next === after) throw new Error("analytics_cursor_not_advancing");
    for (const row of page) accept(row);
    scanned += page.length;
    after = next;
  }
  const extra = await fetchPage(after, 1);
  return { scanned, complete: extra.length === 0 };
}

export async function carregarMovimento(since: string, until = new Date().toISOString(), maxRows = MAX_ROWS) {
  const sb = createAdminClient();
  const accumulator = movementAccumulator();
  const events = await foldAnalyticsPages<EventRow>(async (after, limit) => {
    let query = sb.from("eventos").select("id,tipo,termo,produto_id,categoria_slug,dispositivo")
      .gte("criado_em", since).lt("criado_em", until).order("id").limit(limit);
    if (after) query = query.gt("id", after);
    const { data, error } = await query.abortSignal(AbortSignal.timeout(15_000));
    if (error) throw new Error("analytics_events_read_failed");
    return (data ?? []) as EventRow[];
  }, accumulator.add, maxRows);
  const [{ count: clicks, error: clicksError }, { count: registrations, error: registrationsError }] = await Promise.all([
    sb.from("cliques").select("id", { count: "exact", head: true }).gte("criado_em", since).lt("criado_em", until).abortSignal(AbortSignal.timeout(15_000)),
    sb.from("usuarios").select("id", { count: "exact", head: true }).gte("criado_em", since).lt("criado_em", until).abortSignal(AbortSignal.timeout(15_000)),
  ]);
  if (clicksError || registrationsError || clicks === null || registrations === null) throw new Error("analytics_totals_read_failed");
  return { ...accumulator.result(), since, until, complete: events.complete, redirectRequests: clicks, registrations };
}
