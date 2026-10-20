import { createAdminClient } from "@/infrastructure/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

interface Store { id: string; slug: string; nome: string; adapter_key: string; ativo: boolean }

async function exact(query: PromiseLike<{ count: number | null; error: unknown }>) {
  const { count, error } = await query;
  if (error || count === null) throw new Error("catalog_count_unavailable");
  return count;
}

/** Contagens no banco, duas lojas por vez; nunca transfere o catálogo inteiro. */
export async function carregarSaudeCatalogo(since: string, db: SupabaseClient = createAdminClient()) {
  if (!Number.isFinite(Date.parse(since))) throw new Error("catalog_invalid_window");
  const startedAt = new Date().toISOString();
  const { data, error } = await db.from("lojas").select("id,slug,nome,adapter_key,ativo")
    .order("slug").limit(201).abortSignal(AbortSignal.timeout(15_000));
  if (error || !data || data.length > 200) throw new Error("catalog_store_inventory_unavailable");
  const stores = data as Store[];
  const readStore = async (store: Store) => {
    const base = () => db.from("produtos").select("id", { count: "exact", head: true })
      .eq("loja_id", store.id).eq("em_estoque", true).gt("preco_atual", 0);
    const available = await exact(base().abortSignal(AbortSignal.timeout(15_000)));
    const [oldSeen, noSeen, oldModified, latest] = available ? await Promise.all([
      exact(base().lt("visto_em", since).abortSignal(AbortSignal.timeout(15_000))),
      exact(base().is("visto_em", null).abortSignal(AbortSignal.timeout(15_000))),
      exact(base().lt("atualizado_em", since).abortSignal(AbortSignal.timeout(15_000))),
      db.from("produtos").select("visto_em,atualizado_em").eq("loja_id", store.id)
        .eq("em_estoque", true).gt("preco_atual", 0).order("visto_em", { ascending: false, nullsFirst: false })
        .limit(1).abortSignal(AbortSignal.timeout(15_000)),
    ]) : [0, 0, 0, { data: [], error: null }] as const;
    if (latest.error) throw new Error("catalog_latest_observation_unavailable");
    const observation = latest.data?.[0] as { visto_em: string | null; atualizado_em: string | null } | undefined;
    return { slug: store.slug, name: store.nome, adapter: store.adapter_key, active: store.ativo,
      available, lastSeenBeforeWindow: oldSeen, missingLastSeen: noSeen, lastModifiedBeforeWindow: oldModified,
      newestSeenAt: observation?.visto_em ?? null, correspondingModifiedAt: observation?.atualizado_em ?? null };
  };
  const byStore: Awaited<ReturnType<typeof readStore>>[] = [];
  for (let start = 0; start < stores.length; start += 2) byStore.push(...await Promise.all(stores.slice(start, start + 2).map(readStore)));
  const [publiclyAvailable, recentJobs] = await Promise.all([
    exact(db.from("vw_ofertas").select("id", { count: "exact", head: true }).eq("em_estoque", true).gt("preco_atual", 0).abortSignal(AbortSignal.timeout(15_000))),
    db.from("scrape_jobs").select("adapter_key,status,iniciado_em,finalizado_em,itens_coletados,itens_salvos,erros")
      .order("iniciado_em", { ascending: false }).limit(24).abortSignal(AbortSignal.timeout(15_000)),
  ]);
  if (recentJobs.error) throw new Error("catalog_job_history_unavailable");
  const sum = (active: boolean) => byStore.filter((store) => store.active === active).reduce((total, store) => ({
    available: total.available + store.available, lastSeenBeforeWindow: total.lastSeenBeforeWindow + store.lastSeenBeforeWindow,
    missingLastSeen: total.missingLastSeen + store.missingLastSeen, lastModifiedBeforeWindow: total.lastModifiedBeforeWindow + store.lastModifiedBeforeWindow,
  }), { available: 0, lastSeenBeforeWindow: 0, missingLastSeen: 0, lastModifiedBeforeWindow: 0 });
  return { startedAt, finishedAt: new Date().toISOString(), since, complete: true,
    publiclyAvailable, activeStores: sum(true), inactiveStores: sum(false), byStore,
    recentJobs: recentJobs.data ?? [],
    interpretation: "Last seen is the collector observation timestamp; last modified is a different field. Availability is cadastral, not checkout proof. Queries are observational, not an atomic snapshot. Job sample is the latest 24 records and does not cover every dedicated feed workflow." };
}
