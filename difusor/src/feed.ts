import { createClient } from "@supabase/supabase-js";
import { config } from "./config";

/**
 * Leitura SOMENTE-LEITURA da view vw_ofertas (a mesma fonte do site). Usa a anon
 * key: nenhuma escrita, nenhuma migracao, nenhuma tabela nova. O Difusor so CONSOME.
 */
const sb = createClient(config.supabaseUrl, config.supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export interface Oferta {
  id: string;
  titulo: string;
  url: string;
  imagemUrl: string | null;
  precoAtual: number | null;
  precoOriginal: number | null;
  descontoPct: number | null;
  promoScore: number | null;
  lojaNome: string;
  categoriaEmoji: string | null;
  categoriaNome: string | null;
  atualizadoEm: string;
}

// Colunas reais da vw_ofertas (ver src/infrastructure/repositories/produtos.repo.ts no site).
const SELECT =
  "id,titulo,url,imagem_url,preco_atual,preco_original,desconto_pct,promo_score,em_estoque,loja_nome,categoria_emoji,categoria_nome,atualizado_em";

/** Le o balde das melhores ofertas elegiveis: in-stock, com desconto real, melhor score primeiro. */
export async function buscarMelhoresOfertas(): Promise<Oferta[]> {
  let q = sb
    .from("vw_ofertas")
    .select(SELECT)
    .eq("em_estoque", true)
    .not("preco_atual", "is", null)
    .gte("desconto_pct", config.minDesconto)
    .order("promo_score", { ascending: false, nullsFirst: false })
    .order("atualizado_em", { ascending: false })
    .limit(config.pool);
  if (config.minScore > 0) q = q.gte("promo_score", config.minScore);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    titulo: (r.titulo as string) ?? "",
    url: (r.url as string) ?? "",
    imagemUrl: (r.imagem_url as string) ?? null,
    precoAtual: (r.preco_atual as number) ?? null,
    precoOriginal: (r.preco_original as number) ?? null,
    descontoPct: (r.desconto_pct as number) ?? null,
    promoScore: (r.promo_score as number) ?? null,
    lojaNome: (r.loja_nome as string) ?? "",
    categoriaEmoji: (r.categoria_emoji as string) ?? null,
    categoriaNome: (r.categoria_nome as string) ?? null,
    atualizadoEm: (r.atualizado_em as string) ?? "",
  }));
}
