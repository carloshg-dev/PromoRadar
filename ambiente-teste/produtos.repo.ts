import { createPublicClient } from "@/infrastructure/supabase/client";
import type { Produto, CategoriaSlug } from "@/core/domain/types";
import { assinatura, rotuloClasse } from "@/core/matching/match";

const SELECT = `id,titulo,marca,url,imagem_url,preco_atual,preco_original,desconto_pct,
  promo_score,preco_min_hist,preco_max_hist,preco_avg_hist,em_estoque,atualizado_em,
  loja_nome,loja_slug,loja_logo,categoria_nome,categoria_slug,categoria_emoji`;

function map(r: Record<string, unknown>): Produto {
  return {
    id: r.id as string,
    titulo: r.titulo as string,
    marca: (r.marca as string) ?? null,
    url: r.url as string,
    imagemUrl: (r.imagem_url as string) ?? null,
    precoAtual: (r.preco_atual as number) ?? null,
    precoOriginal: (r.preco_original as number) ?? null,
    descontoPct: (r.desconto_pct as number) ?? null,
    promoScore: (r.promo_score as number) ?? null,
    precoMinHist: (r.preco_min_hist as number) ?? null,
    precoMaxHist: (r.preco_max_hist as number) ?? null,
    precoAvgHist: (r.preco_avg_hist as number) ?? null,
    emEstoque: Boolean(r.em_estoque),
    atualizadoEm: r.atualizado_em as string,
    lojaNome: r.loja_nome as string,
    lojaSlug: r.loja_slug as string,
    categoriaNome: (r.categoria_nome as string) ?? null,
    categoriaSlug: (r.categoria_slug as string) ?? null,
    categoriaEmoji: (r.categoria_emoji as string) ?? null,
  };
}

export interface OfertaFiltro {
  categoria?: string;
  /** filtro por várias categorias (ex: todas as de uma vertical). Tem prioridade sobre `categoria`. */
  categorias?: string[];
  loja?: string;
  busca?: string;
  minScore?: number;
  limit?: number;
}

export async function listarOfertas(f: OfertaFiltro = {}): Promise<Produto[]> {
  const sb = createPublicClient();
  let q = sb.from("vw_ofertas").select(SELECT).order("promo_score", { ascending: false, nullsFirst: false });
  if (f.categorias && f.categorias.length) q = q.in("categoria_slug", f.categorias);
  else if (f.categoria && f.categoria !== "all") q = q.eq("categoria_slug", f.categoria);
  if (f.loja) q = q.eq("loja_slug", f.loja);
  if (f.minScore) q = q.gte("promo_score", f.minScore);
  if (f.busca) q = q.ilike("titulo", `%${f.busca}%`);
  q = q.limit(f.limit ?? 60);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(map);
}

/**
 * Produtos de AFILIADO p/ o feed "Achados dos parceiros" da home — só o que
 * monetiza: Amazon (tag promodetec-20) + Lomadee (lmdee.link). Embaralha p/ o
 * feed "passar aleatório" a cada revalidação. Independe de categoria (soltos).
 */
export async function listarAfiliados(limit = 24): Promise<Produto[]> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("vw_ofertas")
    .select(SELECT)
    .or("loja_slug.eq.amazon,loja_slug.eq.aliexpress,url.ilike.%lmdee.link%,url.ilike.%awin1.com%")
    .eq("em_estoque", true)
    .order("atualizado_em", { ascending: false })
    .limit(160);
  if (error) throw error;
  const todos = (data ?? []).map(map);
  for (let i = todos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = todos[i]!;
    todos[i] = todos[j]!;
    todos[j] = tmp;
  }
  return todos.slice(0, limit);
}

export interface ProdutoRodizio extends Produto {
  historicoPrecos: PontoHistorico[];
}

type PontoHistoricoRow = PontoHistorico & {
  produto_id: string;
};

/**
 * Vitrine sazonal/rodizio: busca um pool pequeno de afiliados e carrega somente
 * os pontos historicos dos produtos selecionados. Mantem a home data-driven sem
 * puxar catalogo grande para memoria.
 */
export async function listarAfiliadosRodizio(limit = 9, historicoPorProduto = 12): Promise<ProdutoRodizio[]> {
  const sb = createPublicClient();
  const poolSize = Math.min(Math.max(limit * 4, limit), 48);
  const { data, error } = await sb
    .from("vw_ofertas")
    .select(SELECT)
    .or("loja_slug.eq.amazon,loja_slug.eq.aliexpress,url.ilike.%lmdee.link%,url.ilike.%awin1.com%,url.ilike.%shopee.com.br%")
    .eq("em_estoque", true)
    .not("preco_atual", "is", null)
    .order("atualizado_em", { ascending: false })
    .limit(poolSize);
  if (error) throw error;

  const pool = (data ?? []).map(map);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }

  const produtos = pool.slice(0, limit);
  if (!produtos.length) return [];

  const ids = produtos.map((produto) => produto.id);
  const historicoLimit = Math.min(ids.length * historicoPorProduto * 4, 300);
  const { data: historico, error: historicoError } = await sb
    .from("historico_precos")
    .select("produto_id,preco,coletado_em")
    .in("produto_id", ids)
    .order("coletado_em", { ascending: false })
    .limit(historicoLimit);
  if (historicoError) throw historicoError;

  const porProduto = new Map<string, PontoHistorico[]>();
  for (const row of (historico ?? []) as PontoHistoricoRow[]) {
    const lista = porProduto.get(row.produto_id);
    const ponto = { preco: row.preco, coletado_em: row.coletado_em };
    if (lista) lista.push(ponto);
    else porProduto.set(row.produto_id, [ponto]);
  }

  return produtos.map((produto) => ({
    ...produto,
    historicoPrecos: (porProduto.get(produto.id) ?? [])
      .sort((a, b) => new Date(a.coletado_em).getTime() - new Date(b.coletado_em).getTime())
      .slice(-historicoPorProduto),
  }));
}

/** Página de ofertas com total — para paginação real nas listas (/ofertas, /categoria). */
export interface PaginaOfertas { produtos: Produto[]; total: number }

export async function listarOfertasPaginado(f: OfertaFiltro & { pagina?: number } = {}): Promise<PaginaOfertas> {
  const sb = createPublicClient();
  const porPagina = f.limit ?? 60;
  const pagina = Math.max(1, f.pagina ?? 1);
  const de = (pagina - 1) * porPagina;
  let q = sb
    .from("vw_ofertas")
    .select(SELECT, { count: "exact" })
    .order("promo_score", { ascending: false, nullsFirst: false })
    .order("atualizado_em", { ascending: false }); // desempate estável entre páginas
  if (f.categoria && f.categoria !== "all") q = q.eq("categoria_slug", f.categoria);
  if (f.loja) q = q.eq("loja_slug", f.loja);
  if (f.minScore) q = q.gte("promo_score", f.minScore);
  if (f.busca) q = q.ilike("titulo", `%${f.busca}%`);
  const { data, error, count } = await q.range(de, de + porPagina - 1);
  if (error) throw error;
  return { produtos: (data ?? []).map(map), total: count ?? 0 };
}

/** Comparação de uma classe de produto entre lojas (matching por assinatura de modelo). */
export interface Comparacao {
  chave: string;
  rotulo: string;
  categoriaSlug: string | null;
  categoriaNome: string | null;
  categoriaEmoji: string | null;
  ofertas: Produto[]; // 1 por loja (a mais barata), ordenadas por preço asc
  lojas: number;
  menorPreco: number;
  maiorPreco: number;
  economia: number;
  economiaPct: number;
  melhorScore: number | null;
}

/**
 * Tamanho de página seguro p/ o teto de linhas do PostgREST (Supabase limita a
 * resposta da API a ~1000 linhas por requisição, independentemente do `.limit()`).
 * Buscar comparações de uma vertical inteira (ex: Tech ~2,4k itens) exige PAGINAR —
 * senão o agrupamento só enxerga as 1000 de maior score e classes perdem lojas
 * (era o bug do "Todas": subcategoria mostrava 5 lojas, "Todas" só 2).
 */
const PAGINA_COMPARAR = 1000;
const MAX_COMPARAR = 8000; // teto de segurança (catálogo in-stock ~5k hoje)

/**
 * Busca COMPLETA (paginada) das ofertas in-stock de uma/várias categorias, para
 * alimentar o agrupamento de comparações sem o teto de linhas do PostgREST.
 * Ordena por (promo_score desc, id) — o `id` é o desempate estável que mantém a
 * paginação por range consistente entre páginas.
 */
async function ofertasParaComparar(opts: { categoria?: string; categorias?: string[] }): Promise<Produto[]> {
  const sb = createPublicClient();
  const temFiltro = Boolean((opts.categorias && opts.categorias.length) || (opts.categoria && opts.categoria !== "all"));
  // Comparador por vertical/categoria → completude (pagina tudo). Catálogo inteiro
  // sem filtro (ex: destaque da home) → a melhor oferta é sempre de score alto, então
  // 2 páginas bastam e a home não paga 5 idas ao banco a cada regeneração.
  const teto = temFiltro ? MAX_COMPARAR : 2 * PAGINA_COMPARAR;
  const todas: Produto[] = [];
  for (let de = 0; de < teto; de += PAGINA_COMPARAR) {
    let q = sb
      .from("vw_ofertas")
      .select(SELECT)
      .eq("em_estoque", true)
      .not("preco_atual", "is", null)
      .order("promo_score", { ascending: false, nullsFirst: false })
      .order("id", { ascending: true });
    if (opts.categorias && opts.categorias.length) q = q.in("categoria_slug", opts.categorias);
    else if (opts.categoria && opts.categoria !== "all") q = q.eq("categoria_slug", opts.categoria);
    const { data, error } = await q.range(de, de + PAGINA_COMPARAR - 1);
    if (error) throw error;
    const lote = (data ?? []).map(map);
    todas.push(...lote);
    if (lote.length < PAGINA_COMPARAR) break; // última página
  }
  return todas;
}

/**
 * Agrupa os produtos em catálogo por classe de modelo (ver core/matching) e
 * devolve só as classes presentes em ≥2 lojas — i.e., comparações úteis de preço.
 */
export async function listarComparacoes(opts: { categoria?: string; categorias?: string[]; limit?: number } = {}): Promise<Comparacao[]> {
  const produtos = await ofertasParaComparar({ categoria: opts.categoria, categorias: opts.categorias });

  const grupos = new Map<string, Produto[]>();
  for (const p of produtos) {
    if (p.precoAtual == null || !p.emEstoque) continue;
    const sig = assinatura(p.titulo, p.categoriaSlug as CategoriaSlug | null, p.marca);
    if (!sig) continue;
    const arr = grupos.get(sig);
    if (arr) arr.push(p);
    else grupos.set(sig, [p]);
  }

  const out: Comparacao[] = [];
  for (const [chave, itens] of grupos) {
    // a oferta mais barata de cada loja
    const porLoja = new Map<string, Produto>();
    for (const p of itens) {
      const cur = porLoja.get(p.lojaSlug);
      if (!cur || (p.precoAtual as number) < (cur.precoAtual ?? Infinity)) porLoja.set(p.lojaSlug, p);
    }
    if (porLoja.size < 2) continue;

    let ofertas = [...porLoja.values()].sort((a, b) => (a.precoAtual as number) - (b.precoAtual as number));
    // Filtro de outlier: descarta ofertas > 3× o menor preço da classe. Diferença
    // dessa magnitude no mesmo modelo é quase sempre mismatch (ex: um PC montado
    // do catálogo do ML caindo na classe de um componente).
    const menorDoGrupo = ofertas[0]!.precoAtual as number;
    ofertas = ofertas.filter((o) => (o.precoAtual as number) <= menorDoGrupo * 3);
    if (ofertas.length < 2) continue;
    const precos = ofertas.map((o) => o.precoAtual as number);
    const menor = Math.min(...precos);
    const maior = Math.max(...precos);
    const ref = ofertas[0]!;
    const scores = ofertas.map((o) => o.promoScore ?? 0);
    out.push({
      chave,
      rotulo: rotuloClasse(ref.titulo, ref.categoriaSlug as CategoriaSlug | null, ref.marca),
      categoriaSlug: ref.categoriaSlug,
      categoriaNome: ref.categoriaNome,
      categoriaEmoji: ref.categoriaEmoji,
      ofertas,
      lojas: ofertas.length,
      menorPreco: menor,
      maiorPreco: maior,
      economia: maior - menor,
      economiaPct: maior > 0 ? Math.round((1 - menor / maior) * 100) : 0,
      melhorScore: Math.max(...scores) || null,
    });
  }

  out.sort((a, b) => b.lojas - a.lojas || b.economia - a.economia);
  return out.slice(0, opts.limit ?? 60);
}

/** Oferta em destaque para a home: a melhor comparação + o histórico do item mais barato. */
export interface Destaque {
  comparacao: Comparacao;
  historico: Array<{ data: string; preco: number }>;
}

export async function ofertaDestaque(): Promise<Destaque | null> {
  const cmps = await listarComparacoes({ limit: 40 });
  if (!cmps.length) return null;
  // DINÂMICO: pega os melhores por PromoScore (não sempre o mesmo produto) e
  // EMBARALHA o topo → alterna a cada revalidação; o usuário sempre vê algo novo.
  const topo = [...cmps].sort((a, b) => (b.melhorScore ?? 0) - (a.melhorScore ?? 0)).slice(0, 10);
  for (let i = topo.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = topo[i]!; topo[i] = topo[j]!; topo[j] = t;
  }
  // Entre os candidatos, prefere o que tiver histórico (pra a linha do gráfico aparecer).
  let comparacao = topo[0]!;
  let pontos: PontoHistorico[] = [];
  for (const c of topo) {
    try {
      const h = await historicoPrecos(c.ofertas[0]!.id);
      if (h.length > pontos.length) { comparacao = c; pontos = h; }
      if (pontos.length >= 4) break; // bom o suficiente
    } catch { /* ignora */ }
  }
  const historico = pontos.map((p) => ({
    data: new Date(p.coletado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    preco: Number(p.preco),
  }));
  return { comparacao, historico };
}

export async function obterProduto(id: string): Promise<Produto | null> {
  const sb = createPublicClient();
  const { data, error } = await sb.from("vw_ofertas").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? map(data) : null;
}

/** A comparação entre lojas da classe de modelo deste produto (ou null se só há 1 loja). */
export async function comparacaoDeProduto(p: Produto): Promise<Comparacao | null> {
  if (!p.categoriaSlug) return null;
  const sig = assinatura(p.titulo, p.categoriaSlug as CategoriaSlug, p.marca);
  if (!sig) return null;
  const cmps = await listarComparacoes({ categoria: p.categoriaSlug, limit: 1000 });
  return cmps.find((c) => c.chave === sig) ?? null;
}

/** Outras ofertas da mesma categoria (para a seção "relacionados"), exceto o próprio. */
export async function relacionados(categoriaSlug: string, excluirId: string, limit = 8): Promise<Produto[]> {
  const lista = await listarOfertas({ categoria: categoriaSlug, limit: limit + 6 });
  return lista.filter((x) => x.id !== excluirId).slice(0, limit);
}

export interface PontoHistorico { preco: number; coletado_em: string }

export async function historicoPrecos(produtoId: string, limit = 120): Promise<PontoHistorico[]> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("historico_precos")
    .select("preco,coletado_em")
    .eq("produto_id", produtoId)
    .order("coletado_em", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as PontoHistorico[];
}

export interface Noticia {
  id: string; fonte: string; titulo: string; resumo: string | null;
  url: string; imagem_url: string | null; publicado_em: string | null; tags: string[];
}

export async function listarNoticias(limit = 30): Promise<Noticia[]> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("noticias")
    .select("id,fonte,titulo,resumo,url,imagem_url,publicado_em,tags")
    .order("publicado_em", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Noticia[];
}
