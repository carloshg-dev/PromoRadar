import { createPublicClient } from "@/infrastructure/supabase/client";
import type { Produto, CategoriaSlug } from "@/core/domain/types";
import { assinatura, rotuloClasse } from "@/core/matching/match";
import { ehLinkMonetizado, redeAfiliada } from "@/lib/afiliados";

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
  const limite = f.limit ?? 60;
  // Pool maior que o limite pedido: dá margem pra achar monetizados pra promover
  // à frente sem re-buscar. Piso BAIXO (30) protege o egress do Supabase free — vitrine
  // pequena (3-5 itens) não precisa varrer 60 linhas pra achar afiliado no topo.
  const pool = Math.min(400, Math.max(limite * 6, 30));
  let q = sb.from("vw_ofertas").select(SELECT).order("promo_score", { ascending: false, nullsFirst: false });
  if (f.categorias && f.categorias.length) q = q.in("categoria_slug", f.categorias);
  else if (f.categoria && f.categoria !== "all") q = q.eq("categoria_slug", f.categoria);
  if (f.loja) q = q.eq("loja_slug", f.loja);
  if (f.minScore) q = q.gte("promo_score", f.minScore);
  if (f.busca) q = q.ilike("titulo", `%${f.busca}%`);
  q = q.limit(pool);
  const { data, error } = await q;
  if (error) throw error;
  const produtos = (data ?? []).map(map);
  // MONETIZADO PRIMEIRO: loja que paga comissão vira destaque mesmo com nota menor
  // — promo_score só desempata dentro do mesmo grupo (monetizado × não-monetizado).
  // Dentro de cada grupo, embaralha (Fisher-Yates) pra vitrine variar a cada refresh
  // sem ORDER BY random() no banco (regra: catálogo infinito e vivo).
  const monetizados = embaralhar(produtos.filter((p) => ehLinkMonetizado(p.url)));
  const outros = embaralhar(produtos.filter((p) => !ehLinkMonetizado(p.url)));
  return [...monetizados, ...outros].slice(0, limite);
}

/**
 * Seleciona até `n` produtos VARIADOS por categoria (rodízio round-robin) — evita
 * o feed/carrossel virar "só um tipo" (ex: só PC parts ou só conectores). Embaralha
 * antes pra a vitrine "passar aleatório" a cada revalidação.
 */
/** Fisher-Yates — base de toda vitrine rotativa. */
function embaralhar<T>(itens: T[]): T[] {
  const arr = [...itens];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i]!; arr[i] = arr[j]!; arr[j] = t;
  }
  return arr;
}

/**
 * REGRA DO DONO (02/07/2026): carrossel/balões/qualquer vitrine em loop mostram
 * TODAS as marcas afiliadas em ordem ALEATÓRIA e é PROIBIDA a mesma loja duas
 * vezes seguidas. Baldes por loja (pré-embaralhados) + a cada passo sorteia
 * entre as lojas ≠ anterior, pesando a fila maior (mantém a regra viável até o
 * fim). Só repete a vizinha se ela for a única com itens restantes.
 */
export function aleatorioSemLojaSeguida<T extends { lojaSlug: string }>(produtos: T[], n: number): T[] {
  const baldes = new Map<string, T[]>();
  for (const p of embaralhar(produtos)) {
    const b = baldes.get(p.lojaSlug);
    if (b) b.push(p); else baldes.set(p.lojaSlug, [p]);
  }
  const out: T[] = [];
  let ultima = "";
  while (out.length < n) {
    const cheias = [...baldes.entries()].filter(([, fila]) => fila.length);
    if (!cheias.length) break;
    const candidatas = cheias.filter(([slug]) => slug !== ultima);
    const pool = candidatas.length ? candidatas : cheias;
    const maior = Math.max(...pool.map(([, f]) => f.length));
    const topo = pool.filter(([, f]) => f.length === maior);
    const [slug, fila] = topo[Math.floor(Math.random() * topo.length)]!;
    out.push(fila.shift()!);
    ultima = slug;
  }
  return out;
}

/**
 * Pool BALANCEADO POR LOJA das marcas afiliadas — só itens com foto + preço.
 * Uma fatia recente POR loja monetizada (data-driven: lojas ativas cujo
 * adapter_key tem rede em REDE_POR_LOJA). Motivo: um lote de coleta recém-
 * gravado dominava o "mais recente" e a vitrine virava parede de UMA marca
 * (bug real: coleta Awin salvou a Olympikus por último → só Olympikus no ar).
 */
const POOL_POR_LOJA = 24;
async function poolAfiliadosPorLoja(
  sb: ReturnType<typeof createPublicClient>,
  categorias?: string[],
): Promise<Produto[]> {
  const { data: lojas } = await sb.from("lojas").select("slug,adapter_key").eq("ativo", true);
  const slugs = (lojas ?? [])
    .filter((l) => redeAfiliada(l.adapter_key as string))
    .map((l) => l.slug as string);
  if (!slugs.length) return [];
  const fatias = await Promise.all(slugs.map(async (slug) => {
    let q = sb
      .from("vw_ofertas")
      .select(SELECT)
      .eq("loja_slug", slug)
      .eq("em_estoque", true)
      .not("imagem_url", "is", null)
      .not("preco_atual", "is", null);
    // fatia por CATEGORIA (ex: carrossel de beleza) → garante variedade de LINHA
    if (categorias?.length) q = q.in("categoria_slug", categorias);
    const { data } = await q.order("atualizado_em", { ascending: false }).limit(POOL_POR_LOJA);
    return (data ?? []).map(map);
  }));
  return fatias.flat();
}

/** Carrossel de Beleza & Perfumes — pool BALANCEADO POR LOJA nas categorias de
 *  perfume/skincare (garante Sieno, L'Occitane, Shopee, AliExpress… lado a lado)
 *  + aleatório sem loja repetida em sequência. */
export async function achadosBelezaCarrossel(n = 24): Promise<Produto[]> {
  const sb = createPublicClient();
  const pool = await poolAfiliadosPorLoja(sb, [
    "perfumes-importados", "perfumes-arabes", "skincare", "cabelos", "maquiagem",
  ]);
  return aleatorioSemLojaSeguida(pool, n);
}

/**
 * Produtos de AFILIADO p/ o feed "Achados dos parceiros" da home — só o que
 * monetiza. Pool balanceado POR LOJA + aleatório SEM a mesma loja em sequência
 * (regra do dono 02/07).
 */
/**
 * BANDA DE PREÇO do carrossel "Achados dos parceiros" (regra do dono 03/07):
 * SÓ produtos de R$9 a R$120 rodam ali — o carrossel superior é de "achados"
 * de impulso, não de item caro (bolsa de R$1.999 assustava o usuário). É um
 * TETO RÍGIDO: nada acima de R$120 entra (sem fallback pra caro). Env-tunável.
 */
const VITRINE_PRECO_MIN = Number(process.env.VITRINE_PRECO_MIN) || 9;
const VITRINE_PRECO_MAX = Number(process.env.VITRINE_PRECO_MAX) || 120;

/**
 * Ordena o carrossel de achados: filtra pra banda R$9–R$120, embaralha (frescor:
 * não estagna nos mesmos itens), prioriza maior %desconto (achado = desconto
 * real primeiro; sem desconto fica variado no fim) e intercala SEM repetir loja
 * em sequência (anti-parede-de-marca). Sem fallback pra fora da banda — se
 * sobrar pouco, mostra menos (o loop do carrossel duplica a lista e roda igual).
 */
function vitrinePorDescontoEValor(pool: Produto[], n: number): Produto[] {
  const naBanda = pool.filter((p) => {
    const v = p.precoAtual ?? 0;
    return v >= VITRINE_PRECO_MIN && v <= VITRINE_PRECO_MAX;
  });
  const base = embaralhar(naBanda);
  const baldes = new Map<string, Produto[]>();
  for (const p of base) {
    const b = baldes.get(p.lojaSlug);
    if (b) b.push(p); else baldes.set(p.lojaSlug, [p]);
  }
  // cada balde: maior %desconto no topo (sort estável preserva o embaralho nos empates)
  for (const fila of baldes.values()) fila.sort((a, b) => (b.descontoPct ?? 0) - (a.descontoPct ?? 0));

  const out: Produto[] = [];
  let ultima = "";
  while (out.length < n) {
    const cheias = [...baldes.entries()].filter(([, f]) => f.length);
    if (!cheias.length) break;
    const cand = cheias.filter(([slug]) => slug !== ultima);
    const escolha = (cand.length ? cand : cheias)
      .sort((a, b) => (b[1][0]!.descontoPct ?? 0) - (a[1][0]!.descontoPct ?? 0))[0]!;
    out.push(escolha[1].shift()!);
    ultima = escolha[0];
  }
  return out;
}

export async function listarAfiliados(limit = 24): Promise<Produto[]> {
  const sb = createPublicClient();
  return vitrinePorDescontoEValor(await poolAfiliadosPorLoja(sb), limit);
}

/**
 * "Achados" de uma ou mais categorias p/ vitrines da home — pool RECENTE da
 * vertical (não top-score: o topo por nota dessas categorias era 100% uma loja
 * só) + sorteio sem loja repetida em sequência (regra do dono 02/07). Recência
 * garante que loja nova coletada entra na roda no mesmo dia.
 */
export async function achadosPorCategorias(slugs: CategoriaSlug[], n: number): Promise<Produto[]> {
  const sb = createPublicClient();
  const base = () =>
    sb.from("vw_ofertas")
      .select(SELECT)
      .in("categoria_slug", slugs)
      .eq("em_estoque", true)
      .not("imagem_url", "is", null)
      .not("preco_atual", "is", null);
  // DUAS fatias no pool: RECENTES (loja recém-coletada entra na roda no mesmo
  // dia) + TOP por nota (as consagradas não somem quando chega lote novo).
  // Uma fatia só — qualquer que fosse — virava parede de uma marca.
  const [recentes, top] = await Promise.all([
    base().order("atualizado_em", { ascending: false }).limit(60),
    base().order("promo_score", { ascending: false, nullsFirst: false }).limit(60),
  ]);
  if (recentes.error) throw recentes.error;
  if (top.error) throw top.error;
  const porId = new Map<string, Produto>();
  for (const r of [...(recentes.data ?? []), ...(top.data ?? [])]) {
    const p = map(r);
    porId.set(p.id, p);
  }
  return aleatorioSemLojaSeguida([...porId.values()], n);
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
  // Pool balanceado POR LOJA + aleatório sem loja repetida em sequência (regra do dono).
  const produtos = aleatorioSemLojaSeguida(await poolAfiliadosPorLoja(sb), limit);
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

/** Teto do pool p/ reordenar "monetizado primeiro" — cobre as páginas rasas (99% do tráfego). */
const POOL_ORDENACAO = 1000;

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

  // Páginas rasas: puxa o pool (top por nota) e reordena MONETIZADO PRIMEIRO — a loja que
  // te paga comissão vira destaque, mesmo com nota menor (a nota vira só desempate interno).
  // Assim o gamer que entra na Tech vê Amazon/Shopee/AliExpress no topo, não quem nos rejeitou.
  // Página funda de lista gigante (raríssimo): ranged puro por nota, sem custo de reordenar.
  const rasa = de < POOL_ORDENACAO;
  const { data, error, count } = await q.range(rasa ? 0 : de, rasa ? POOL_ORDENACAO - 1 : de + porPagina - 1);
  if (error) throw error;
  const total = count ?? 0;
  if (!rasa) return { produtos: (data ?? []).map(map), total };

  const pool = (data ?? []).map(map);
  pool.sort((a, b) => {
    const m = (ehLinkMonetizado(b.url) ? 1 : 0) - (ehLinkMonetizado(a.url) ? 1 : 0);
    return m !== 0 ? m : (b.promoScore ?? 0) - (a.promoScore ?? 0);
  });
  return { produtos: pool.slice(de, de + porPagina), total };
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

/**
 * Vitrine "Oferta em destaque" da home — pool AMPLO de produtos das lojas
 * MONETIZADAS (mesma base do feed de afiliados, balanceada por loja), sorteado
 * SEM loja repetida em sequência (regra do dono 02/07 — nada de parede de uma
 * marca). O looping em si roda no CLIENTE (FeaturedDealRotator); aqui só
 * entrega o pool já resolvido.
 *
 * Quando o item sorteado tem uma comparação REAL (2+ lojas vendendo a mesma
 * classe de modelo — ver core/matching), ela vem anexada e o card ativa o
 * comparador (barras por loja); sem casamento, `comparacao` fica null e o
 * card mostra só a melhor oferta — nunca finge uma comparação que não existe.
 */
export interface DestaqueItem {
  produto: Produto;
  comparacao: Comparacao | null;
  historico: Array<{ data: string; preco: number }>;
}

export async function ofertasEmDestaque(n = 8): Promise<DestaqueItem[]> {
  const sb = createPublicClient();
  const [pool, cmps] = await Promise.all([
    poolAfiliadosPorLoja(sb),
    listarComparacoes({ limit: 200 }),
  ]);

  // Comparações REAIS são raras entre lojas monetizadas hoje (a guilhotina de
  // não-afiliadas 02-03/07 cortou junto o overlap de catálogo que as gerava —
  // Kabum×Terabyte×Pichau etc. vendiam o mesmo hardware entre si). Um sorteio
  // puramente aleatório no pool geral quase nunca pescaria uma (testado: 1 em
  // 321 candidatos). Por isso GARANTE até metade das vagas pras comparações
  // que existem; o resto preenche com variedade normal das marcas monetizadas.
  type Candidato = { lojaSlug: string; produto: Produto; comparacao: Comparacao | null };
  const comComparacao: Candidato[] = cmps.slice(0, Math.ceil(n / 2)).map((c) => ({
    lojaSlug: c.ofertas[0]!.lojaSlug, produto: c.ofertas[0]!, comparacao: c,
  }));
  const usados = new Set(comComparacao.map((d) => d.produto.id));
  const semComparacao: Candidato[] = aleatorioSemLojaSeguida(
    pool.filter((p) => !usados.has(p.id)).map((produto) => ({ lojaSlug: produto.lojaSlug, produto, comparacao: null as Comparacao | null })),
    n - comComparacao.length,
  );
  // Interleave final sobre o conjunto combinado — a regra de "nunca a mesma
  // loja 2x seguidas" vale igual pros itens com e sem comparação.
  const escolhidos = aleatorioSemLojaSeguida([...comComparacao, ...semComparacao], n);

  return Promise.all(escolhidos.map(async ({ produto, comparacao }) => {
    const refId = comparacao ? comparacao.ofertas[0]!.id : produto.id;
    let historico: DestaqueItem["historico"] = [];
    try {
      const pts = await historicoPrecos(refId, 30);
      historico = pts.map((p) => ({
        data: new Date(p.coletado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        preco: Number(p.preco),
      }));
    } catch { /* segue sem gráfico */ }
    return { produto, comparacao, historico };
  }));
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
