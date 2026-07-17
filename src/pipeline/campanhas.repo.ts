import { createAdminClient } from "@/infrastructure/supabase/admin";

/**
 * NÚCLEO do pipeline de conteúdo — a tabela `campanhas` é a fonte única da
 * verdade do fluxo (nunca estado paralelo em arquivo/memória). Cada etapa lê o
 * status, faz seu trabalho e AVANÇA o status. Idempotente por natureza → seguro
 * pra um agente 24/7 (OpenClaw) reexecutar sem duplicar. Escrita = service_role.
 */

export type StatusCampanha =
  | "PENDING" | "CURATED" | "RENDERED" | "READY" | "PUBLISHED" | "FAILED";

export interface Campanha {
  id: string;
  produtoId: string | null;
  lojaSlug: string | null;
  status: StatusCampanha;
  scoreConteudo: number | null;
  headline: string | null;
  legenda: string | null;
  hashtags: string[];
  imagens: Record<string, string>;
  plataformas: string[];
  metadados: Record<string, unknown>;
  erro: string | null;
  criadoEm: string;
  publicadoEm: string | null;
}

function map(r: Record<string, unknown>): Campanha {
  return {
    id: r.id as string,
    produtoId: (r.produto_id as string) ?? null,
    lojaSlug: (r.loja_slug as string) ?? null,
    status: r.status as StatusCampanha,
    scoreConteudo: (r.score_conteudo as number) ?? null,
    headline: (r.headline as string) ?? null,
    legenda: (r.legenda as string) ?? null,
    hashtags: (r.hashtags as string[]) ?? [],
    imagens: (r.imagens as Record<string, string>) ?? {},
    plataformas: (r.plataformas as string[]) ?? [],
    metadados: (r.metadados as Record<string, unknown>) ?? {},
    erro: (r.erro as string) ?? null,
    criadoEm: r.criado_em as string,
    publicadoEm: (r.publicado_em as string) ?? null,
  };
}

export interface NovaCampanha {
  produtoId: string | null;
  lojaSlug: string | null;
  scoreConteudo?: number;
  headline?: string;
  legenda?: string;
  hashtags?: string[];
  plataformas?: string[];
  metadados?: Record<string, unknown>;
  status?: StatusCampanha;
}

export async function criarCampanha(c: NovaCampanha): Promise<Campanha> {
  const sb = createAdminClient();
  const { data, error } = await sb.from("campanhas").insert({
    produto_id: c.produtoId, loja_slug: c.lojaSlug, status: c.status ?? "CURATED",
    score_conteudo: c.scoreConteudo ?? null, headline: c.headline ?? null,
    legenda: c.legenda ?? null, hashtags: c.hashtags ?? [],
    plataformas: c.plataformas ?? [], metadados: c.metadados ?? {},
  }).select().single();
  if (error) throw error;
  return map(data);
}

/** Avança/atualiza uma campanha (status + patch opcional de campos). */
export async function atualizarCampanha(
  id: string, status: StatusCampanha,
  patch: Partial<{ imagens: Record<string, string>; erro: string | null; publicadoEm: string }> = {},
): Promise<void> {
  const sb = createAdminClient();
  const up: Record<string, unknown> = { status };
  if (patch.imagens) up.imagens = patch.imagens;
  if ("erro" in patch) up.erro = patch.erro;
  if (patch.publicadoEm) up.publicado_em = patch.publicadoEm;
  const { error } = await sb.from("campanhas").update(up).eq("id", id);
  if (error) throw error;
}

export async function listarPorStatus(status: StatusCampanha, limite = 20): Promise<Campanha[]> {
  const sb = createAdminClient();
  const { data, error } = await sb.from("campanhas").select("*")
    .eq("status", status).order("score_conteudo", { ascending: false, nullsFirst: false }).limit(limite);
  if (error) throw error;
  return (data ?? []).map(map);
}

/** Painel admin: campanhas recentes de TODOS os status, mais novas primeiro. */
export async function listarCampanhasRecentes(limite = 40): Promise<Campanha[]> {
  const sb = createAdminClient();
  const { data, error } = await sb.from("campanhas").select("*")
    .order("criado_em", { ascending: false }).limit(limite);
  if (error) throw error;
  return (data ?? []).map(map);
}

/** Anti-repetição: o produto já teve campanha nos últimos `dias`? */
export async function produtoTeveCampanhaRecente(produtoId: string, dias = 7): Promise<boolean> {
  const sb = createAdminClient();
  const desde = new Date(Date.now() - dias * 86_400_000).toISOString();
  const { count, error } = await sb.from("campanhas").select("id", { count: "exact", head: true })
    .eq("produto_id", produtoId).gte("criado_em", desde);
  if (error) throw error;
  return (count ?? 0) > 0;
}
