import { createPublicClient, createCachedPublicClient } from "@/infrastructure/supabase/client";
import type { Produto, CategoriaSlug } from "@/core/domain/types";
import { assinatura } from "@/core/matching/match";
import { agruparComparacoes, type Comparacao } from "@/core/matching/comparison";
import { lerListaComparacoes, lerComparacao } from "./comparison-snapshot.repo";
export type { Comparacao } from "@/core/matching/comparison";
import { ehLinkMonetizado, redeAfiliada } from "@/lib/afiliados";
import { scoreConteudo, legendaPersuasiva } from "@/core/curadoria";
import { titlePattern } from "@/core/search";
import { permitidoNaHome } from "@/core/home-catalog";
import { limitedFetch } from "@/infrastructure/supabase/limited-fetch";
import { SELECT_PRODUTO as SELECT, mapProduto as map } from "./produto-row";
import { recentPriceSince, hasRecentPrice } from "@/core/offer-freshness";
import { catalogPriceLimit, DEFAULT_CATALOG_PRICE_LIMIT, GENERIC_IMAGE_PATTERNS, UNVERIFIED_BRL_STORES, validProductImage, verifiedBrlPrice } from "@/core/catalog-policy";

export interface LeituraVitrine {
  agora: number;
  signal: AbortSignal;
  pools: Map<string, Promise<Produto[]>>;
  client: ReturnType<typeof createPublicClient>;
}

/** Contexto por render: compartilha pools e cancela também as leituras encadeadas. */
export function criarLeituraVitrine(): LeituraVitrine {
  return { agora: Date.now(), signal: AbortSignal.timeout(8_000), pools: new Map(), client: createPublicClient(limitedFetch((input, init) => fetch(input, init))) };
}

function consultaVitrine(sb: ReturnType<typeof createPublicClient>, leitura: LeituraVitrine) {
  // Predicados de preço/data na view causaram 57014 no prerender; validação no pool limitado.
  return sb.from("vw_ofertas").select(SELECT).eq("em_estoque", true)
    .not("imagem_url", "is", null).not("preco_atual", "is", null).abortSignal(leitura.signal);
}

export interface AchadoDoDia extends Produto {
  scoreConteudo: number;
  legenda: string;
}

/**
 * TOP N do dia (Máquina de Conteúdo v4.0). Traz um POOL de candidatos já filtrado
 * e indexado (em_estoque + imagem + desconto + monetizado), pontua por conteúdo em
 * memória (scoreConteudo) e escolhe com VARIEDADE de categoria (máx 1 por nicho).
 * NUNCA carrega os milhares — a query retorna ~120 linhas no pior caso.
 */
export async function top5DoDia(n = 5, minDesconto = 15): Promise<AchadoDoDia[]> {
  const now = Date.now();
  // Mesma elegibilidade das vitrines; predicados permitem o índice parcial de leitura.
  // FILTRO DE CONTEÚDO (em memória): monetizado (post tem que pagar), com imagem,
  // preço de conteúdo (≥R$20, sem cacareco) e desconto na BANDA CRÍVEL 20-78% —
  // corta a âncora falsa da Shopee (90% off) que envenena a seleção.
  const pool = (await listarOfertas({ limit: 400 })).filter((p) =>
    p.emEstoque && validProductImage(p.imagemUrl) && verifiedBrlPrice(p.lojaSlug) && ehLinkMonetizado(p.url) &&
    hasRecentPrice(p.atualizadoEm, now) && (p.precoAtual ?? 0) >= 20 && (p.precoAtual ?? Infinity) <= DEFAULT_CATALOG_PRICE_LIMIT &&
    (p.descontoPct ?? 0) >= minDesconto && (p.descontoPct ?? 0) <= 78);
  const ranqueado = pool
    .map((o) => ({ o, sc: scoreConteudo(o) }))
    .sort((a, b) => b.sc - a.sc);

  // Seleção: 1 LOJA e 1 CATEGORIA por achado (variedade real; evita 2 "notebooks"
  // que na verdade são cabo+cooler). Fallback relaxa categoria, depois loja.
  const escolhidos: Produto[] = [];
  const lojas = new Set<string>(), cats = new Set<string>();
  for (const { o } of ranqueado) {
    if (lojas.has(o.lojaSlug) || cats.has(o.categoriaSlug ?? "?")) continue;
    lojas.add(o.lojaSlug); cats.add(o.categoriaSlug ?? "?"); escolhidos.push(o);
    if (escolhidos.length >= n) break;
  }
  for (const { o } of ranqueado) { // relaxa categoria, mantém loja distinta
    if (escolhidos.length >= n) break;
    if (lojas.has(o.lojaSlug) || escolhidos.includes(o)) continue;
    lojas.add(o.lojaSlug); escolhidos.push(o);
  }
  for (const { o } of ranqueado) { // último recurso: completa
    if (escolhidos.length >= n) break;
    if (!escolhidos.includes(o)) escolhidos.push(o);
  }
  return escolhidos.map((o) => ({ ...o, scoreConteudo: scoreConteudo(o), legenda: legendaPersuasiva(o) }));
}


function mapVitrine(rows: Record<string, unknown>[], leitura?: LeituraVitrine): Produto[] {
  const produtos = rows.map(map);
  return leitura ? produtos.filter((produto) => permitidoNaHome(produto, leitura.agora)) : produtos;
}

export interface OfertaFiltro {
  maxPreco?: number | null;
  categoria?: string;
  /** filtro por várias categorias (ex: todas as de uma vertical). Tem prioridade sobre `categoria`. */
  categorias?: string[];
  loja?: string;
  busca?: string;
  minScore?: number;
  limit?: number;
}

export async function listarOfertas(f: OfertaFiltro = {}, leitura?: LeituraVitrine): Promise<Produto[]> {
  const sb = leitura?.client ?? createCachedPublicClient();
  const agora = Math.floor(Date.now() / 300_000) * 300_000;
  const limite = f.limit ?? 60;
  // Pool maior que o limite pedido: dá margem pra achar monetizados pra promover
  // à frente sem re-buscar. Piso BAIXO (30) protege o egress do Supabase free — vitrine
  // pequena (3-5 itens) não precisa varrer 60 linhas pra achar afiliado no topo.
  const pool = Math.min(400, Math.max(limite * 6, 30));
  let q = leitura ? consultaVitrine(sb, leitura).order("atualizado_em", { ascending: false })
    : sb.from("vw_ofertas").select(SELECT).eq("em_estoque", true).gt("preco_atual", 0)
      .gte("atualizado_em", recentPriceSince(agora)).lte("atualizado_em", new Date(agora).toISOString())
      .order("promo_score", { ascending: false, nullsFirst: false }).abortSignal(AbortSignal.timeout(12_000));
  if (f.categorias && f.categorias.length) q = q.in("categoria_slug", f.categorias);
  else if (f.categoria && f.categoria !== "all") q = q.eq("categoria_slug", f.categoria);
  if (f.loja) q = q.eq("loja_slug", f.loja);
  if (f.minScore) q = q.gte("promo_score", f.minScore);
  if (f.busca) q = q.ilike("titulo", titlePattern(f.busca));
  // A home valida o pool limitado em permitidoNaHome; duplicar estes predicados
  // na view já causou 57014. Listagens completas precisam filtrar antes do limit.
  if (!leitura) {
    const maxPreco = f.maxPreco === null ? null : catalogPriceLimit(f.maxPreco);
    if (maxPreco !== null) q = q.lte("preco_atual", maxPreco);
    q = q.not("imagem_url", "is", null);
    q = q.not("loja_slug", "in", `(${UNVERIFIED_BRL_STORES.join(",")})`);
    for (const pattern of GENERIC_IMAGE_PATTERNS) q = q.not("imagem_url", "ilike", pattern);
  }
  q = q.limit(pool);
  const { data, error } = await q;
  if (error) throw error;
  const produtos = mapVitrine(data ?? [], leitura);
  // MONETIZADO PRIMEIRO: loja que paga comissão vira destaque mesmo com nota menor
  // — promo_score só desempata dentro do mesmo grupo (monetizado × não-monetizado).
  // Dentro de cada grupo, embaralha (Fisher-Yates) pra vitrine variar a cada refresh
  // sem ORDER BY random() no banco (regra: catálogo infinito e vivo).
  const monetizados = embaralhar(produtos.filter((p) => ehLinkMonetizado(p.url)));
  const outros = embaralhar(produtos.filter((p) => !ehLinkMonetizado(p.url)));
  return [...monetizados, ...outros].slice(0, limite);
}

/**
 * Pool compacto para vitrines de uma loja na Home. Diferente de `listarOfertas`,
 * esta leitura exige os campos que um card visual precisa e embaralha apenas um
 * conjunto limitado dos melhores resultados. Assim, centenas de itens coletados
 * participam do rodizio sem aumentar o HTML nem o egress do Supabase.
 */
export async function listarVitrinePorLoja(lojaSlug: string, limit = 48, leitura = criarLeituraVitrine()): Promise<Produto[]> {
  const sb = leitura.client;
  const limite = Math.max(1, Math.min(limit, 80));
  const pool = Math.min(240, Math.max(limite * 3, 60));
  const { data, error } = await consultaVitrine(sb, leitura)
    .eq("loja_slug", lojaSlug)
    .order("atualizado_em", { ascending: false })
    .limit(pool);

  if (error) throw error;
  return embaralhar(mapVitrine(data ?? [], leitura)).slice(0, limite);
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
function poolAfiliadosPorLoja(
  sb: ReturnType<typeof createPublicClient>,
  categorias?: string[],
  leitura = criarLeituraVitrine(),
): Promise<Produto[]> {
  const key = categorias?.length ? [...categorias].sort().join(",") : "*";
  const existing = leitura.pools.get(key);
  if (existing) return existing;
  const pending = (async () => {
    const { data: lojas, error } = await sb.from("lojas").select("slug,adapter_key").eq("ativo", true)
      .limit(200).abortSignal(leitura.signal);
    if (error) throw error;
    const slugs = (lojas ?? []).filter((l) => redeAfiliada(l.adapter_key as string)).map((l) => l.slug as string);
    const pool: Produto[] = [];
    for (let start = 0; start < slugs.length; start += 4) {
      const fatias = await Promise.all(slugs.slice(start, start + 4).map(async (slug) => {
        let q = consultaVitrine(sb, leitura).eq("loja_slug", slug);
        if (categorias?.length) q = q.in("categoria_slug", categorias);
        const { data, error: readError } = await q.order("atualizado_em", { ascending: false }).limit(POOL_POR_LOJA);
        if (readError) throw readError;
        return mapVitrine(data ?? [], leitura);
      }));
      pool.push(...fatias.flat());
    }
    return pool;
  })();
  leitura.pools.set(key, pending);
  return pending;
}

/** Carrossel de Beleza & Perfumes — pool BALANCEADO POR LOJA nas categorias de
 *  perfume/skincare (garante Sieno, L'Occitane, Shopee, AliExpress… lado a lado)
 *  + aleatório sem loja repetida em sequência. */
export async function achadosBelezaCarrossel(n = 24, leitura = criarLeituraVitrine()): Promise<Produto[]> {
  const sb = leitura.client;
  const pool = await poolAfiliadosPorLoja(sb, [
    "perfumes-importados", "perfumes-arabes", "skincare", "cabelos", "maquiagem",
  ], leitura);
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

export async function listarAfiliados(limit = 24, leitura = criarLeituraVitrine()): Promise<Produto[]> {
  const sb = leitura.client;
  return vitrinePorDescontoEValor(await poolAfiliadosPorLoja(sb, undefined, leitura), limit);
}

/**
 * "Achados" de uma ou mais categorias p/ vitrines da home — pool RECENTE da
 * vertical (não top-score: o topo por nota dessas categorias era 100% uma loja
 * só) + sorteio sem loja repetida em sequência (regra do dono 02/07). Recência
 * garante que loja nova coletada entra na roda no mesmo dia.
 */
export async function achadosPorCategorias(slugs: CategoriaSlug[], n: number, leitura = criarLeituraVitrine()): Promise<Produto[]> {
  const sb = leitura.client;
  const base = () =>
    consultaVitrine(sb, leitura).in("categoria_slug", slugs);
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
    if (permitidoNaHome(p, leitura.agora)) porId.set(p.id, p);
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
export async function listarAfiliadosRodizio(limit = 9, historicoPorProduto = 12, leitura = criarLeituraVitrine()): Promise<ProdutoRodizio[]> {
  const sb = leitura.client;
  // Pool balanceado POR LOJA + aleatório sem loja repetida em sequência (regra do dono).
  const produtos = aleatorioSemLojaSeguida(await poolAfiliadosPorLoja(sb, undefined, leitura), limit);
  if (!produtos.length) return [];

  const ids = produtos.map((produto) => produto.id);
  const historicoLimit = Math.min(ids.length * historicoPorProduto * 4, 300);
  const { data: historico, error: historicoError } = await sb
    .from("historico_precos")
    .select("produto_id,preco,coletado_em")
    .in("produto_id", ids)
    .order("coletado_em", { ascending: false })
    .limit(historicoLimit).abortSignal(leitura.signal);
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
  const sb = createCachedPublicClient();
  // Janela de cinco minutos evita uma chave de cache nova a cada milissegundo.
  const agora = Math.floor(Date.now() / 300_000) * 300_000;
  const porPagina = f.limit ?? 60;
  const pagina = Math.max(1, f.pagina ?? 1);
  const de = (pagina - 1) * porPagina;
  let q = sb
    .from("vw_ofertas")
    .select(SELECT, { count: "exact" })
    .eq("em_estoque", true).gt("preco_atual", 0)
    .gte("atualizado_em", recentPriceSince(agora)).lte("atualizado_em", new Date(agora).toISOString())
    .order("promo_score", { ascending: false, nullsFirst: false })
    .order("atualizado_em", { ascending: false }).order("id")
    .abortSignal(AbortSignal.timeout(12_000));
  if (f.categoria && f.categoria !== "all") q = q.eq("categoria_slug", f.categoria);
  if (f.loja) q = q.eq("loja_slug", f.loja);
  if (f.minScore) q = q.gte("promo_score", f.minScore);
  if (f.busca) q = q.ilike("titulo", titlePattern(f.busca));
  const maxPreco = f.maxPreco === null ? null : catalogPriceLimit(f.maxPreco);
  if (maxPreco !== null) q = q.lte("preco_atual", maxPreco);
  q = q.not("imagem_url", "is", null);
  q = q.not("loja_slug", "in", `(${UNVERIFIED_BRL_STORES.join(",")})`);
  for (const pattern of GENERIC_IMAGE_PATTERNS) q = q.not("imagem_url", "ilike", pattern);

  // Ordenação e paginação no banco: ler 1000 para exibir 60 gastava CPU/rede
  // e promovia comissão sobre a nota. O preço e o CTA afiliado ficam intactos.
  const { data, error, count } = await q.range(de, de + porPagina - 1);
  if (error) throw error;
  const total = count ?? 0;
  return { produtos: (data ?? []).map(map), total };
}

/** Comparações já calculadas no runner; a visita nunca varre o catálogo. */
export async function listarComparacoes(opts: { categoria?: string; categorias?: string[]; limit?: number } = {}): Promise<Comparacao[]> {
  const lista = await lerListaComparacoes(opts);
  return lista.slice(0, Math.min(60, Math.max(0, opts.limit ?? 60)));
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

export async function ofertasEmDestaque(n = 8, leitura = criarLeituraVitrine()): Promise<DestaqueItem[]> {
  const sb = leitura.client;
  const pool = await poolAfiliadosPorLoja(sb, undefined, leitura);
  // A home compara o pool já selecionado; o comparador completo conserva sua leitura própria.
  const cmps = agruparComparacoes(pool, 200);

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
      const pts = await historicoPrecos(refId, 30, leitura);
      historico = pts.map((p) => ({
        data: new Date(p.coletado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        preco: Number(p.preco),
      }));
    } catch { /* segue sem gráfico */ }
    return { produto, comparacao, historico };
  }));
}

export async function obterProduto(id: string): Promise<Produto | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const sb = createCachedPublicClient();
  const { data, error } = await sb.from("vw_ofertas").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? map(data) : null;
}

/** Sitemap curado e limitado; não calcula scores/históricos nem varre o catálogo. */
export async function listarUrlsProdutos(): Promise<{ id: string; atualizadoEm: string }[]> {
  const sb = createCachedPublicClient();
  const now = Date.now();
  const urls: { id: string; atualizadoEm: string }[] = [];
  let cursor = "";
  // Amostra curada por cursor/PK: ordenar o catálogo por atualização causou 57014 no build.
  for (let page = 0; page < 4 && urls.length < 1000; page++) {
    let query = sb.from("produtos").select("id,atualizado_em,em_estoque,preco_atual")
      .order("id").limit(1000).abortSignal(AbortSignal.timeout(5_000));
    if (cursor) query = query.gt("id", cursor);
    const { data, error } = await query;
    if (error) throw error;
    for (const row of data ?? []) {
      if (row.em_estoque && Number(row.preco_atual) > 0 && hasRecentPrice(row.atualizado_em as string, now)) {
        urls.push({ id: row.id as string, atualizadoEm: row.atualizado_em as string });
        if (urls.length === 1000) break;
      }
    }
    if (!data?.length || data.length < 1000) break;
    cursor = data.at(-1)!.id as string;
  }
  return urls;
}

/** A comparação entre lojas da classe de modelo deste produto (ou null se só há 1 loja). */
export async function comparacaoDeProduto(p: Produto): Promise<Comparacao | null> {
  if (!p.categoriaSlug) return null;
  const sig = assinatura(p.titulo, p.categoriaSlug as CategoriaSlug, p.marca);
  if (!sig) return null;
  return lerComparacao(p.categoriaSlug, sig);
}

/** Outras ofertas da mesma categoria (para a seção "relacionados"), exceto o próprio. */
export async function relacionados(categoriaSlug: string, excluirId: string, limit = 8): Promise<Produto[]> {
  const lista = await listarOfertas({ categoria: categoriaSlug, limit: limit + 6 });
  return lista.filter((x) => x.id !== excluirId).slice(0, limit);
}

export interface PontoHistorico { preco: number; coletado_em: string }

export async function historicoPrecos(produtoId: string, limit = 120, leitura?: LeituraVitrine): Promise<PontoHistorico[]> {
  const sb = leitura?.client ?? createCachedPublicClient();
  const query = sb
    .from("historico_precos")
    .select("preco,coletado_em")
    .eq("produto_id", produtoId)
    .order("coletado_em", { ascending: false })
    .limit(limit);
  const { data, error } = await (leitura ? query.abortSignal(leitura.signal) : query);
  if (error) throw error;
  return ((data ?? []) as PontoHistorico[]).reverse();
}

export interface Noticia {
  id: string; fonte: string; titulo: string; resumo: string | null;
  url: string; imagem_url: string | null; publicado_em: string | null; tags: string[];
}

export async function listarNoticias(limit = 30, leitura?: LeituraVitrine): Promise<Noticia[]> {
  const sb = leitura?.client ?? createPublicClient();
  const query = sb
    .from("noticias")
    .select("id,fonte,titulo,resumo,url,imagem_url,publicado_em,tags")
    .order("publicado_em", { ascending: false, nullsFirst: false })
    .limit(limit);
  const { data, error } = await (leitura ? query.abortSignal(leitura.signal) : query);
  if (error) throw error;
  return (data ?? []) as Noticia[];
}
