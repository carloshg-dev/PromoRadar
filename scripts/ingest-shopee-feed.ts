import { createReadStream, createWriteStream } from "node:fs";
import { mkdtemp, open, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import csv from "csv-parser";
import { config } from "dotenv";

config({ path: ".env.local" });

type CategoriaSlug =
  | "placas-de-video" | "processadores" | "ssds" | "memorias-ram"
  | "fontes" | "placas-mae" | "monitores" | "notebooks"
  | "whey-protein" | "creatina" | "pre-treino" | "fit-outros"
  | "geladeiras" | "fogoes" | "maquinas-lavar" | "tvs" | "micro-ondas" | "ar-condicionado"
  | "furadeiras" | "serras" | "lixadeiras" | "compressores" | "ferramentas-manuais"
  | "chaves-soquetes" | "epi"
  | "fones-bluetooth" | "smartwatch" | "caixa-de-som" | "power-bank" | "webcam-acao"
  | "perfumes-importados" | "perfumes-arabes"
  | "maquiagem" | "skincare" | "cabelos"
  | "moda"
  | "ofertas-parceiros";

type ShopeeCsvRow = Record<string, string | undefined>;

interface FeedInput {
  path: string;
  source: string;
  cleanup: () => Promise<void>;
}

interface NormalizedShopeeItem {
  itemId: string;
  skuLoja: string;
  titulo: string;
  precoAtual: number;
  precoOriginal: number | null;
  descontoPct: number | null;
  imagemUrl: string;
  url: string;
  marca: string | null;
  categoriaSlug: CategoriaSlug;
  qualityScore: number;
}

interface ProdutoUpsert {
  loja_id: string;
  categoria_id: string;
  sku_loja: string;
  titulo: string;
  marca: string | null;
  url: string;
  imagem_url: string;
  preco_atual: number;
  preco_original: number | null;
  desconto_pct: number | null;
  em_estoque: boolean;
  promo_score: number | null;
  visto_em: string;
}

interface CategoryStats {
  candidatos: number;
  mantidos: number;
  cortados: number;
}

interface IngestStats {
  lidos: number;
  candidatosValidos: number;
  degolados: number;
  semImagem: number;
  semTracking: number;
  lojaPausada: number;
  semItemId: number;
  semTitulo: number;
  precoInvalido: number;
  dedupSubstituidos: number;
  upserted: number;
  batchErrors: number;
  stale: number | null;
  invalidos: Map<string, number>;
  categoriasBrutas: Map<string, number>;
  porCategoria: Map<CategoriaSlug, CategoryStats>;
}

const REQUIRED_HEADERS = [
  "shop_rating",
  "itemid",
  "sale_price",
  "item_rating",
  "global_category3",
  "cb_option",
  "discount_percentage",
  "global_catid2",
  "price",
  "description",
  "title",
  "global_category1",
  "image_link_3",
  "global_catid1",
  "global_catid3",
  "like",
  "condition",
  "global_category2",
  "model_ids",
  "image_link",
  "model_names",
  "shop_name",
  "product_link",
  "product_short link",
] as const;

const VALID_CATEGORY_SLUGS: readonly CategoriaSlug[] = [
  "placas-de-video", "processadores", "ssds", "memorias-ram",
  "fontes", "placas-mae", "monitores", "notebooks",
  "whey-protein", "creatina", "pre-treino", "fit-outros",
  "geladeiras", "fogoes", "maquinas-lavar", "tvs", "micro-ondas", "ar-condicionado",
  "furadeiras", "serras", "lixadeiras", "compressores", "ferramentas-manuais",
  "chaves-soquetes", "epi",
  "fones-bluetooth", "smartwatch", "caixa-de-som", "power-bank", "webcam-acao",
  "perfumes-importados", "perfumes-arabes", "maquiagem", "skincare", "cabelos",
  "moda",
  "ofertas-parceiros",
];

const CATEGORY_RULES: ReadonlyArray<{ slug: CategoriaSlug; terms: readonly string[] }> = [
  { slug: "placas-de-video", terms: ["graphics card", "placa de video", "gpu"] },
  { slug: "processadores", terms: ["processor", "processador", "cpu"] },
  { slug: "ssds", terms: ["ssd", "solid state drive"] },
  { slug: "memorias-ram", terms: ["memory ram", "memoria ram", "ram ddr", "ddr4", "ddr5"] },
  { slug: "fontes", terms: ["power supply", "fonte atx", "fonte gamer"] },
  { slug: "placas-mae", terms: ["motherboard", "placa mae", "mainboard"] },
  { slug: "monitores", terms: ["monitor"] },
  { slug: "notebooks", terms: ["notebook", "laptop"] },
  { slug: "whey-protein", terms: ["whey protein", "whey"] },
  { slug: "creatina", terms: ["creatine", "creatina"] },
  { slug: "pre-treino", terms: ["pre treino", "pre-workout", "pre workout"] },
  { slug: "geladeiras", terms: ["geladeira", "refrigerator", "fridge"] },
  { slug: "fogoes", terms: ["fogao", "stove", "cooktop"] },
  { slug: "maquinas-lavar", terms: ["washing machine", "maquina de lavar", "lava e seca"] },
  { slug: "tvs", terms: ["television", "smart tv", " tv "] },
  { slug: "micro-ondas", terms: ["microwave", "micro ondas", "micro-ondas"] },
  { slug: "ar-condicionado", terms: ["air conditioner", "ar condicionado", "split inverter"] },
  { slug: "furadeiras", terms: ["drill", "furadeira"] },
  { slug: "serras", terms: ["saw", "serra circular", "serra tico"] },
  { slug: "lixadeiras", terms: ["sander", "lixadeira"] },
  { slug: "compressores", terms: ["compressor"] },
  { slug: "chaves-soquetes", terms: ["socket wrench", "soquete", "jogo de chave"] },
  { slug: "ferramentas-manuais", terms: ["hand tools", "ferramenta manual", "alicate", "martelo"] },
  { slug: "epi", terms: ["safety helmet", "epi", "luva de seguranca", "capacete"] },
  { slug: "fones-bluetooth", terms: ["bluetooth headphone", "headphone", "earbuds", "earphone", "fone bluetooth"] },
  { slug: "smartwatch", terms: ["smartwatch", "smart watch"] },
  { slug: "caixa-de-som", terms: ["speaker", "caixa de som", "bluetooth speaker"] },
  { slug: "power-bank", terms: ["power bank", "powerbank"] },
  { slug: "webcam-acao", terms: ["webcam", "action camera", "camera de acao"] },
  { slug: "perfumes-arabes", terms: ["arabic perfume", "perfume arabe", "arabian perfume"] },
  { slug: "perfumes-importados", terms: ["perfume", "fragrance", "cologne"] },
  { slug: "maquiagem", terms: ["makeup", "maquiagem", "lipstick", "batom", "mascara de cilios"] },
  { slug: "skincare", terms: ["skincare", "skin care", "sunscreen", "protetor solar", "serum facial"] },
  { slug: "cabelos", terms: ["hair care", "cabelo", "shampoo", "conditioner"] },
  { slug: "moda", terms: ["women clothes", "men clothes", "kids fashion", "clothing", "apparel", "women shoes", "men shoes", "footwear", "fashion accessor", "roupa", "calcado", "tenis", "sapato", "vestido", "camiseta", "bolsa"] },
];

const AFFILIATE_SHORT_HOSTS = new Set(["s.shopee.com.br", "shope.ee"]);
const TRACKING_PARAMS = [
  "af_siteid",
  "affiliate_id",
  "pid",
  "utm_campaign",
  "utm_content",
  "utm_medium",
  "utm_source",
  "utm_term",
  "uls_trackid",
  "xptdk",
] as const;
const PAUSED_STORES = ["epoca cosmeticos"];

const SUPABASE_BATCH_SIZE = 500;
const NEUTRAL_CATEGORY: CategoriaSlug = "ofertas-parceiros";

const stats: IngestStats = {
  lidos: 0,
  candidatosValidos: 0,
  degolados: 0,
  semImagem: 0,
  semTracking: 0,
  lojaPausada: 0,
  semItemId: 0,
  semTitulo: 0,
  precoInvalido: 0,
  dedupSubstituidos: 0,
  upserted: 0,
  batchErrors: 0,
  stale: null,
  invalidos: new Map(),
  categoriasBrutas: new Map(),
  porCategoria: new Map(),
};

async function main() {
  const runStartedAt = new Date().toISOString();
  const pisoPreco = readPositiveNumberEnv("PISO_PRECO_BRL", 20);
  const topN = Math.max(1, Math.trunc(readPositiveNumberEnv("SHOPEE_TOP_N", 400)));
  const dryRun = process.argv.includes("--dry-run") || process.env.SHOPEE_DRY_RUN === "true";

  const input = await resolveFeedInput();
  const candidatesByItemId = new Map<string, NormalizedShopeeItem>();

  console.log(`[Shopee] Iniciando ingestao: ${input.source}`);
  console.log(`[Shopee] Piso de preco: R$ ${pisoPreco.toFixed(2)} | Top-N por categoria: ${topN}`);
  if (dryRun) console.log("[Shopee] DRY_RUN ativo: Supabase nao sera alterado.");

  try {
    await readCsvStream(input.path, async (row) => {
      stats.lidos += 1;
      recordRawCategories(row);

      const normalized = normalizeRow(row, pisoPreco);
      if (!normalized) return;

      if (candidatesByItemId.has(normalized.itemId)) {
        stats.dedupSubstituidos += 1;
      }
      candidatesByItemId.set(normalized.itemId, normalized);
      stats.candidatosValidos += 1;
    });
  } finally {
    await input.cleanup();
  }

  logRawCategoryDiagnostics();

  const selecionados = selectTopNByCategory([...candidatesByItemId.values()], topN);
  const categoryCounts = [...stats.porCategoria.entries()]
    .map(([slug, s]) => `${slug}: mantidos=${s.mantidos}, cortados=${s.cortados}`)
    .join(" | ");
  console.log(`[Shopee] Top-N por categoria: ${categoryCounts || "sem candidatos"}`);

  if (dryRun) {
    printFinalStats();
    return;
  }

  const supabase = createSupabaseClient();
  const lojaId = await resolveShopeeStoreId(supabase);
  const categoriaIds = await resolveCategoryIds(supabase, selecionados.map((item) => item.categoriaSlug));
  const rows = selecionados.map((item) => toProdutoUpsert(item, lojaId, requireCategoryId(categoriaIds, item.categoriaSlug), runStartedAt));

  await upsertRows(supabase, rows);
  stats.stale = await markStaleProducts(supabase, lojaId, runStartedAt);

  printFinalStats();
}

async function resolveFeedInput(): Promise<FeedInput> {
  const cliPath = process.argv.slice(2).find((arg) => arg !== "--dry-run");
  const feedUrl = process.env.SHOPEE_FEED_URL?.trim();

  if (feedUrl) {
    return downloadFeed(feedUrl);
  }

  if (cliPath) {
    const path = resolve(cliPath);
    await stat(path);
    return {
      path,
      source: `arquivo local ${path}`,
      cleanup: async () => undefined,
    };
  }

  throw new Error("Defina SHOPEE_FEED_URL ou informe um caminho local: npx tsx scripts/ingest-shopee-feed.ts feeds/shopee/arquivo.csv");
}

async function downloadFeed(feedUrl: string): Promise<FeedInput> {
  const dir = await mkdtemp(join(tmpdir(), "promodetec-shopee-"));
  const url = new URL(feedUrl);
  const extension = url.pathname.endsWith(".gz") ? ".csv.gz" : ".csv";
  const filePath = join(dir, `shopee-feed${extension}`);

  console.log(`[Shopee] Baixando feed para disco temporario: ${basename(filePath)}`);
  const response = await fetch(feedUrl);
  if (!response.ok || !response.body) {
    throw new Error(`Falha ao baixar SHOPEE_FEED_URL: HTTP ${response.status}`);
  }

  await pipeline(Readable.fromWeb(response.body as never), createWriteStream(filePath));
  return {
    path: filePath,
    source: `SHOPEE_FEED_URL (${url.hostname})`,
    cleanup: async () => {
      await rm(dir, { recursive: true, force: true });
    },
  };
}

async function readCsvStream(filePath: string, onRow: (row: ShopeeCsvRow) => Promise<void> | void): Promise<void> {
  const source = createReadStream(filePath);
  const input = await isGzip(filePath) ? source.pipe(createGunzip()) : source;

  await pipeline(
    input,
    csv({
      separator: ",",
      mapHeaders: ({ header }: { header: string }) => header.trim().replace(/^\uFEFF/, ""),
    }),
    async function* (rows: AsyncIterable<ShopeeCsvRow>) {
      let headersChecked = false;
      for await (const row of rows) {
        if (!headersChecked) {
          headersChecked = true;
          warnIfMissingHeaders(row);
        }
        await onRow(row);
      }
    },
  );
}

async function isGzip(filePath: string): Promise<boolean> {
  if (filePath.toLowerCase().endsWith(".gz")) return true;

  const handle = await open(filePath, "r");
  try {
    const buffer = Buffer.alloc(2);
    const { bytesRead } = await handle.read(buffer, 0, 2, 0);
    return bytesRead === 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;
  } finally {
    await handle.close();
  }
}

function warnIfMissingHeaders(row: ShopeeCsvRow) {
  const keys = new Set(Object.keys(row));
  const missing = REQUIRED_HEADERS.filter((header) => !keys.has(header));
  if (missing.length) {
    console.warn(`[Shopee] Headers ausentes no CSV: ${missing.join(", ")}`);
  }
}

function normalizeRow(row: ShopeeCsvRow, pisoPreco: number): NormalizedShopeeItem | null {
  const itemId = pick(row, ["itemid"]);
  if (!itemId) {
    stats.semItemId += 1;
    increment(stats.invalidos, "itemid_ausente");
    return null;
  }

  const titulo = pick(row, ["title", "Nome do Produto", "product_name"]);
  if (!titulo) {
    stats.semTitulo += 1;
    increment(stats.invalidos, "titulo_ausente");
    return null;
  }

  const precoAtual = parseMoney(pick(row, ["sale_price", "price", "Preco", "Preco atual"]));
  if (!isPositiveNumber(precoAtual)) {
    stats.precoInvalido += 1;
    increment(stats.invalidos, "preco_invalido");
    return null;
  }

  if (precoAtual < pisoPreco) {
    stats.degolados += 1;
    increment(stats.invalidos, "preco_abaixo_do_piso");
    return null;
  }

  const url = pick(row, ["product_short link", "product_link", "Link de Afiliado"]);
  if (!url || !hasAffiliateTracking(url)) {
    stats.semTracking += 1;
    increment(stats.invalidos, "link_sem_tracking_afiliado");
    return null;
  }

  const imagemUrl = pick(row, ["image_link", "image_link_3", "Imagem"]);
  if (!imagemUrl) {
    stats.semImagem += 1;
    increment(stats.invalidos, "imagem_ausente");
    return null;
  }

  const loja = pick(row, ["shop_name"]);
  if (isPausedStore(loja) || isPausedStore(buildRawCategoryText(row))) {
    stats.lojaPausada += 1;
    increment(stats.invalidos, "loja_ou_categoria_pausada");
    return null;
  }

  const precoCheio = parseMoney(pick(row, ["price"]));
  const precoOriginal = isPositiveNumber(precoCheio) && precoCheio > precoAtual ? precoCheio : null;
  const descontoPct = resolveDiscountPct(row, precoAtual, precoOriginal);
  const categoriaSlug = classifyCategory(row);

  return {
    itemId,
    skuLoja: `shopee-${itemId}`,
    titulo,
    precoAtual,
    precoOriginal,
    descontoPct,
    imagemUrl,
    url,
    marca: loja,
    categoriaSlug,
    qualityScore: computeQualityScore(row, descontoPct),
  };
}

function selectTopNByCategory(items: NormalizedShopeeItem[], topN: number): NormalizedShopeeItem[] {
  const grouped = new Map<CategoriaSlug, NormalizedShopeeItem[]>();

  for (const item of items) {
    const bucket = grouped.get(item.categoriaSlug) ?? [];
    bucket.push(item);
    grouped.set(item.categoriaSlug, bucket);
  }

  const selected: NormalizedShopeeItem[] = [];
  for (const [slug, bucket] of grouped) {
    bucket.sort((a, b) => b.qualityScore - a.qualityScore || a.titulo.localeCompare(b.titulo, "pt-BR"));
    const kept = bucket.slice(0, topN);
    selected.push(...kept);
    stats.porCategoria.set(slug, {
      candidatos: bucket.length,
      mantidos: kept.length,
      cortados: Math.max(0, bucket.length - kept.length),
    });
  }

  return selected;
}

function classifyCategory(row: ShopeeCsvRow): CategoriaSlug {
  const text = normalizeText(`${buildRawCategoryText(row)} ${pick(row, ["title"]) ?? ""}`);

  for (const rule of CATEGORY_RULES) {
    if (rule.terms.some((term) => text.includes(normalizeText(term)))) {
      return rule.slug;
    }
  }

  return NEUTRAL_CATEGORY;
}

function buildRawCategoryText(row: ShopeeCsvRow): string {
  return [
    pick(row, ["global_category1"]),
    pick(row, ["global_category2"]),
    pick(row, ["global_category3"]),
  ].filter(Boolean).join(" > ");
}

function resolveDiscountPct(row: ShopeeCsvRow, salePrice: number, originalPrice: number | null): number | null {
  const rawDiscount = parseMoney(pick(row, ["discount_percentage"]));
  if (rawDiscount != null && Number.isFinite(rawDiscount) && rawDiscount > 0) {
    const normalized = rawDiscount <= 1 ? rawDiscount * 100 : rawDiscount;
    return clamp(Math.round(normalized), 0, 100);
  }

  if (originalPrice != null && originalPrice > salePrice) {
    return clamp(Math.round((1 - salePrice / originalPrice) * 100), 0, 100);
  }

  return null;
}

function computeQualityScore(row: ShopeeCsvRow, descontoPct: number | null): number {
  const rating = clamp(parseMoney(pick(row, ["item_rating"])) ?? 0, 0, 5);
  const likes = Math.max(0, parseCount(pick(row, ["like"])) ?? 0);
  const discount = clamp(descontoPct ?? 0, 0, 100);
  const nonCrossBorderBonus = isNonCrossBorder(row) ? 5 : 0;

  const ratingScore = (rating / 5) * 60;
  const likeScore = clamp(Math.log10(1 + likes) / 5, 0, 1) * 20;
  const discountScore = (discount / 100) * 20;

  return ratingScore + likeScore + discountScore + nonCrossBorderBonus;
}

function isNonCrossBorder(row: ShopeeCsvRow): boolean {
  return normalizeText(pick(row, ["cb_option"]) ?? "").includes("non-cross");
}

function toProdutoUpsert(
  item: NormalizedShopeeItem,
  lojaId: string,
  categoriaId: string,
  runStartedAt: string,
): ProdutoUpsert {
  const promoScore = item.descontoPct == null ? null : clamp(item.descontoPct, 0, 100);

  return {
    loja_id: lojaId,
    categoria_id: categoriaId,
    sku_loja: item.skuLoja,
    titulo: item.titulo,
    marca: item.marca,
    url: item.url,
    imagem_url: item.imagemUrl,
    preco_atual: item.precoAtual,
    preco_original: item.precoOriginal,
    desconto_pct: item.descontoPct,
    em_estoque: true,
    promo_score: promoScore,
    visto_em: runStartedAt,
  };
}

function createSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url) throw new Error("SUPABASE_URL ausente.");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente.");

  return createClient(url, key, { auth: { persistSession: false } });
}

async function resolveShopeeStoreId(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase
    .from("lojas")
    .select("id")
    .eq("adapter_key", "shopee")
    .maybeSingle();

  if (error) throw new Error(`Falha ao buscar loja shopee: ${error.message}`);
  if (!data?.id) throw new Error("Loja com adapter_key='shopee' nao encontrada em lojas.");

  return data.id as string;
}

async function resolveCategoryIds(
  supabase: SupabaseClient,
  slugs: CategoriaSlug[],
): Promise<Map<CategoriaSlug, string>> {
  const uniqueSlugs = [...new Set(slugs)];
  if (!uniqueSlugs.length) return new Map();

  const { data, error } = await supabase
    .from("categorias")
    .select("id,slug")
    .in("slug", uniqueSlugs);

  if (error) throw new Error(`Falha ao buscar categorias: ${error.message}`);

  const ids = new Map<CategoriaSlug, string>();
  for (const row of data ?? []) {
    const slug = row.slug as CategoriaSlug;
    if (VALID_CATEGORY_SLUGS.includes(slug)) {
      ids.set(slug, row.id as string);
    }
  }

  const missing = uniqueSlugs.filter((slug) => !ids.has(slug));
  if (missing.length) {
    throw new Error(`Categorias nao cadastradas no Supabase: ${missing.join(", ")}`);
  }

  return ids;
}

function requireCategoryId(categoryIds: Map<CategoriaSlug, string>, slug: CategoriaSlug): string {
  const id = categoryIds.get(slug);
  if (!id) throw new Error(`Categoria sem id resolvido: ${slug}`);
  return id;
}

async function upsertRows(supabase: SupabaseClient, rows: ProdutoUpsert[]): Promise<void> {
  for (let start = 0; start < rows.length; start += SUPABASE_BATCH_SIZE) {
    const batch = rows.slice(start, start + SUPABASE_BATCH_SIZE);
    const { error } = await supabase
      .from("produtos")
      .upsert(batch, { onConflict: "loja_id,sku_loja" });

    if (error) {
      stats.batchErrors += 1;
      console.error(`[Shopee] Erro no batch ${start / SUPABASE_BATCH_SIZE + 1}: ${error.message}`);
      continue;
    }

    stats.upserted += batch.length;
  }
}

async function markStaleProducts(supabase: SupabaseClient, lojaId: string, runStartedAt: string): Promise<number | null> {
  const { count, error } = await supabase
    .from("produtos")
    .update({ em_estoque: false }, { count: "exact" })
    .eq("loja_id", lojaId)
    .lt("visto_em", runStartedAt);

  if (error) {
    console.error(`[Shopee] Falha ao marcar stale: ${error.message}`);
    return null;
  }

  return count ?? null;
}

function recordRawCategories(row: ShopeeCsvRow) {
  for (const key of ["global_category1", "global_category2", "global_category3"] as const) {
    const value = pick(row, [key]);
    if (!value) continue;
    increment(stats.categoriasBrutas, `${key}: ${value}`);
  }
}

function logRawCategoryDiagnostics() {
  console.log("[Shopee] Categorias brutas mais frequentes no feed:");
  const top = [...stats.categoriasBrutas.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40);

  for (const [category, count] of top) {
    console.log(`  - ${category} (${count})`);
  }
}

function printFinalStats() {
  console.log("\n[Shopee] Resumo final");
  console.log(`Total de produtos lidos: ${stats.lidos}`);
  console.log(`Total de candidatos validos: ${stats.candidatosValidos}`);
  console.log(`Total degolados por preco: ${stats.degolados}`);
  console.log(`Total sem imagem: ${stats.semImagem}`);
  console.log(`Total sem tracking afiliado: ${stats.semTracking}`);
  console.log(`Total deduplicado por itemid: ${stats.dedupSubstituidos}`);
  console.log(`Total upserted: ${stats.upserted}`);
  console.log(`Total batches com erro: ${stats.batchErrors}`);
  console.log(`Total stale marcado fora de estoque: ${stats.stale ?? "nao executado"}`);

  const principaisMotivos = [...stats.invalidos.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  if (principaisMotivos.length) {
    console.log("Principais motivos de descarte:");
    for (const [motivo, count] of principaisMotivos) {
      console.log(`  - ${motivo}: ${count}`);
    }
  }
}

function pick(row: ShopeeCsvRow, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function parseMoney(raw: string | null): number | null {
  if (!raw) return null;
  const clean = raw
    .replace(/[^\d,.-]/g, "")
    .replace(/\s/g, "")
    .trim();

  if (!clean) return null;

  const hasComma = clean.includes(",");
  const hasDot = clean.includes(".");
  const normalized = hasComma && hasDot
    ? clean.lastIndexOf(",") > clean.lastIndexOf(".")
      ? clean.replace(/\./g, "").replace(",", ".")
      : clean.replace(/,/g, "")
    : hasComma
      ? clean.replace(",", ".")
      : clean;

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCount(raw: string | null): number | null {
  if (!raw) return null;
  const normalized = raw.trim().toLowerCase().replace(/\s/g, "");
  const multiplier = normalized.endsWith("k") ? 1_000 : normalized.endsWith("m") ? 1_000_000 : 1;
  const numeric = multiplier === 1 ? normalized : normalized.slice(0, -1);
  const parsed = parseMoney(numeric);
  return parsed == null ? null : parsed * multiplier;
}

function hasAffiliateTracking(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.toLowerCase();

    if (AFFILIATE_SHORT_HOSTS.has(hostname)) return true;
    return TRACKING_PARAMS.some((param) => url.searchParams.has(param));
  } catch {
    return false;
  }
}

function isPausedStore(value: string | null): boolean {
  const normalized = normalizeText(value ?? "");
  return PAUSED_STORES.some((store) => normalized.includes(store));
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isPositiveNumber(value: number | null): value is number {
  return value != null && Number.isFinite(value) && value > 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function increment(map: Map<string, number>, key: string, by = 1) {
  map.set(key, (map.get(key) ?? 0) + by);
}

function readPositiveNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;

  const parsed = Number(raw.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

main().catch((error) => {
  console.error("[Shopee] Falha fatal na ingestao:", error);
  process.exit(1);
});
