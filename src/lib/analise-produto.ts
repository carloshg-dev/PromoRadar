import type { CategoriaSlug } from "@/core/domain/types";
import { decodeHtmlEntities } from "@/lib/utils";

/**
 * "Cadastro inteligente" (painel v4.0 Fatia 2) — cola a URL, o servidor tenta
 * descobrir loja/título/imagem/preço/marca/descrição/categoria/slug sozinho.
 * O admin só CONFIRMA (edita o que quiser antes de salvar). Filosofia do manifesto:
 * "quanto menos digitação, melhor" — mas nunca inventa dado: quando não acha algo,
 * devolve `null` + um aviso legível, e o campo fica em branco pro humano preencher.
 */

export interface LojaDetectada { slug: string; nome: string }

const LOJA_POR_DOMINIO: Record<string, LojaDetectada> = {
  "carrefour.com.br": { slug: "carrefour", nome: "Carrefour" },
  "mercadolivre.com.br": { slug: "mercadolivre", nome: "Mercado Livre" },
  "mercadolibre.com.br": { slug: "mercadolivre", nome: "Mercado Livre" },
  "meli.la": { slug: "mercadolivre", nome: "Mercado Livre" },
  "amazon.com.br": { slug: "amazon", nome: "Amazon" },
  "amzn.to": { slug: "amazon", nome: "Amazon" },
  "shopee.com.br": { slug: "shopee", nome: "Shopee" },
  "shope.ee": { slug: "shopee", nome: "Shopee" },
  "aliexpress.com": { slug: "aliexpress", nome: "AliExpress" },
  "diesel.com.br": { slug: "diesel", nome: "Diesel" },
  "diesel.com": { slug: "diesel", nome: "Diesel" }, // destino real do deeplink Awin é br.diesel.com (site global, locale BR)
  "kabum.com.br": { slug: "kabum", nome: "Kabum" },
  "terabyteshop.com.br": { slug: "terabyte", nome: "TerabyteShop" },
  "pichau.com.br": { slug: "pichau", nome: "Pichau" },
  "americanas.com.br": { slug: "americanas", nome: "Americanas" },
  "epocacosmeticos.com.br": { slug: "epocacosmeticos", nome: "Época Cosméticos" },
};

/** Deduz a loja pelo domínio. Em deeplink Awin, olha o destino real (?ued=). */
export function lojaDaUrl(raw: string): LojaDetectada {
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "awin1.com") {
      const ued = u.searchParams.get("ued");
      if (ued) return lojaDaUrl(decodeURIComponent(ued));
      return { slug: "curadoria", nome: "Curadoria" };
    }
    if (LOJA_POR_DOMINIO[host]) return LOJA_POR_DOMINIO[host]!;
    for (const [dom, loja] of Object.entries(LOJA_POR_DOMINIO)) {
      if (host === dom || host.endsWith(`.${dom}`)) return loja;
    }
  } catch { /* url inválida tratada no chamador */ }
  return { slug: "curadoria", nome: "Curadoria" };
}

/**
 * URL "real" a LER (segue ?ued= de deeplink Awin). A URL ORIGINAL com afiliado é
 * sempre a que fica salva — esta função só serve pra achar a página certa a raspar.
 */
function urlParaAnalise(raw: string): string {
  try {
    const u = new URL(raw);
    if (u.hostname.replace(/^www\./, "").toLowerCase() === "awin1.com") {
      const ued = u.searchParams.get("ued");
      if (ued) return decodeURIComponent(ued);
    }
  } catch { /* mantém a original */ }
  return raw;
}

function normalizar(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Regras de categoria por TERMO ESPECÍFICO (não por palavra solta). Lição do motor
 * Shopee: "roupa" pegava guarda-roupa, "mouse" pegava mouse pad de escritório — aqui
 * cada termo já nasce específico o bastante pra não precisar reaprender isso.
 */
const REGRAS_CATEGORIA: ReadonlyArray<{ slug: CategoriaSlug; termos: readonly string[] }> = [
  { slug: "gabinetes", termos: ["gabinete gamer", "gabinete atx", "gabinete para pc", "mid tower", "full tower", "pc case"] },
  { slug: "perifericos", termos: ["mouse gamer", "teclado mecanico", "teclado gamer", "mousepad", "mouse pad", "headset gamer", "cadeira gamer", "cadeira gaming"] },
  { slug: "placas-de-video", termos: ["placa de video", "geforce rtx", "geforce gtx", "radeon rx", "placa grafica"] },
  { slug: "processadores", termos: ["processador amd", "processador intel", "ryzen 5", "ryzen 7", "ryzen 9", "core i3", "core i5", "core i7", "core i9"] },
  { slug: "ssds", termos: ["ssd nvme", "ssd sata", "ssd m.2", "ssd 480", "ssd 500", "ssd 1tb", "ssd 2tb"] },
  { slug: "memorias-ram", termos: ["memoria ram", "memoria ddr4", "memoria ddr5", "ram ddr4", "ram ddr5"] },
  { slug: "fontes", termos: ["fonte atx", "fonte gamer", "fonte 80 plus", "fonte modular"] },
  { slug: "placas-mae", termos: ["placa mae", "placa-mae", "motherboard"] },
  { slug: "monitores", termos: ["monitor gamer", "monitor led", "monitor curvo", "monitor ultrawide"] },
  { slug: "notebooks", termos: ["notebook", "laptop"] },
  { slug: "whey-protein", termos: ["whey protein", "whey isolado", "whey concentrado"] },
  { slug: "creatina", termos: ["creatina monohidratada", "creatina em po"] },
  { slug: "pre-treino", termos: ["pre-treino", "pre treino"] },
  { slug: "geladeiras", termos: ["geladeira", "refrigerador frost free"] },
  { slug: "fogoes", termos: ["fogao "] },
  { slug: "maquinas-lavar", termos: ["maquina de lavar", "lava e seca"] },
  { slug: "tvs", termos: ["smart tv", "televisor"] },
  { slug: "micro-ondas", termos: ["micro-ondas", "micro ondas"] },
  { slug: "ar-condicionado", termos: ["ar-condicionado", "ar condicionado split"] },
  { slug: "furadeiras", termos: ["furadeira"] },
  { slug: "serras", termos: ["serra circular", "serra tico-tico", "serra marmore", "serra de fita"] },
  { slug: "lixadeiras", termos: ["lixadeira"] },
  { slug: "compressores", termos: ["compressor de ar"] },
  { slug: "chaves-soquetes", termos: ["jogo de chaves", "jogo de soquetes", "chave de impacto"] },
  { slug: "ferramentas-manuais", termos: ["alicate", "martelo", "chave de fenda", "chave philips", "trena"] },
  { slug: "epi", termos: ["capacete de seguranca", "luva de seguranca", "oculos de protecao", "protetor auricular"] },
  { slug: "fones-bluetooth", termos: ["fone bluetooth", "fone de ouvido bluetooth", "earbuds", "airpods"] },
  { slug: "smartwatch", termos: ["smartwatch", "smart watch"] },
  { slug: "caixa-de-som", termos: ["caixa de som bluetooth", "speaker bluetooth", "caixa de som portatil"] },
  { slug: "power-bank", termos: ["power bank", "carregador portatil", "bateria portatil"] },
  { slug: "webcam-acao", termos: ["webcam", "camera de acao"] },
  { slug: "perfumes-arabes", termos: ["perfume arabe", "perfume arabo", "essencia arabe"] },
  { slug: "perfumes-importados", termos: ["eau de parfum", "eau de toilette", "perfume importado", "colonia importada"] },
  { slug: "maquiagem", termos: ["batom", "base liquida", "mascara de cilios", "paleta de sombra", "delineador"] },
  { slug: "skincare", termos: ["protetor solar", "serum facial", "hidratante facial", "acido hialuronico", "agua micelar"] },
  { slug: "cabelos", termos: ["shampoo", "condicionador", "ampola capilar", "oleo capilar", "creme para pentear"] },
  { slug: "moda", termos: ["camiseta", "moletom", "tenis ", "vestido", "calca jeans", "jaqueta", "cinto ", "bolsa "] },
];

/** Melhor palpite de categoria a partir de título+descrição — o admin sempre confere. */
export function classificarCategoria(titulo: string, descricao?: string | null): CategoriaSlug | null {
  const texto = normalizar(`${titulo} ${descricao ?? ""}`);
  for (const regra of REGRAS_CATEGORIA) {
    if (regra.termos.some((t) => texto.includes(normalizar(t)))) return regra.slug;
  }
  return null;
}

export function slugify(s: string): string {
  return normalizar(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

const STOPWORDS = new Set([
  "de", "da", "do", "das", "dos", "com", "para", "pra", "em", "no", "na", "nos", "nas",
  "um", "uma", "uns", "umas", "e", "o", "a", "os", "as", "por", "the", "and", "for", "with",
]);

/** Palavras-chave simples (frequência de título, sem stopword) — matéria-prima pro SEO Center. */
export function extrairPalavrasChave(titulo: string, max = 6): string[] {
  const vistas = new Set<string>();
  const out: string[] = [];
  for (const palavra of normalizar(titulo).replace(/[^a-z0-9\s]/g, " ").split(/\s+/)) {
    if (palavra.length < 3 || STOPWORDS.has(palavra) || vistas.has(palavra)) continue;
    vistas.add(palavra);
    out.push(palavra);
    if (out.length >= max) break;
  }
  return out;
}

interface JsonLdProduct {
  name?: string;
  image?: string | string[] | { url?: string };
  description?: string;
  brand?: string | { name?: string };
  offers?: { price?: string | number } | Array<{ price?: string | number }>;
}

function extrairJsonLdProduct(html: string): JsonLdProduct | null {
  const blocos = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of blocos) {
    try {
      const parsed = JSON.parse(m[1]!.trim());
      const candidatos: unknown[] = Array.isArray(parsed) ? parsed : (parsed["@graph"] ?? [parsed]);
      for (const c of candidatos) {
        if (!c || typeof c !== "object") continue;
        const tipo = (c as { "@type"?: string | string[] })["@type"];
        const tipos = Array.isArray(tipo) ? tipo : [tipo];
        if (tipos.includes("Product")) return c as JsonLdProduct;
      }
    } catch { /* bloco inválido — tenta o próximo */ }
  }
  return null;
}

function metaContent(html: string, prop: string): string | null {
  const m = html.match(new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']*)["']`, "i"))
    ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${prop}["']`, "i"));
  return m ? decodeHtmlEntities(m[1]) : null;
}

function extrairOg(html: string) {
  const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] ?? null;
  return {
    title: metaContent(html, "og:title"),
    image: metaContent(html, "og:image"),
    description: metaContent(html, "og:description") ?? (metaDesc ? decodeHtmlEntities(metaDesc) : null),
    precoAmount: metaContent(html, "og:price:amount") ?? metaContent(html, "product:price:amount"),
  };
}

function extrairTagTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? decodeHtmlEntities(m[1]!.trim()) : null;
}

function normalizarImagem(img: JsonLdProduct["image"]): string | null {
  if (!img) return null;
  if (typeof img === "string") return img;
  if (Array.isArray(img)) return typeof img[0] === "string" ? img[0] : null;
  if (typeof img === "object" && "url" in img) return img.url ?? null;
  return null;
}

function primeiroPreco(offers: JsonLdProduct["offers"]): string | number | undefined {
  if (!offers) return undefined;
  return Array.isArray(offers) ? offers[0]?.price : offers.price;
}

function parsePreco(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) && v > 0 ? v : null;
  const bruto = String(v).replace(/[^\d,.-]/g, "");
  // "1.299,90" (BRL) -> "1299.90" · "1299.90" (já US) fica como está
  const comPontoDecimal = /,\d{2}$/.test(bruto) ? bruto.replace(/\./g, "").replace(",", ".") : bruto;
  const n = Number(comPontoDecimal);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function limpar(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const t = decodeHtmlEntities(s.trim());
  return t.length ? t : null;
}

function nomeMarca(brand: JsonLdProduct["brand"]): string | null {
  if (typeof brand === "string") return limpar(brand);
  if (brand && typeof brand === "object") return limpar(brand.name);
  return null;
}

export interface SugestaoProduto {
  loja: LojaDetectada;
  titulo: string | null;
  imagemUrl: string | null;
  preco: number | null;
  marca: string | null;
  descricao: string | null;
  categoria: CategoriaSlug | null;
  slug: string | null;
  palavrasChave: string[];
  avisos: string[];
}

/** Analisa uma URL colada no painel e devolve o melhor palpite pra cada campo. */
export async function analisarUrl(urlOriginal: string): Promise<SugestaoProduto> {
  let loja = lojaDaUrl(urlOriginal);
  const avisos: string[] = [];
  const alvo = urlParaAnalise(urlOriginal);

  let html = "";
  try {
    const resp = await fetch(alvo, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(9000),
    });
    // Awin tem outro formato de link (pclick.php?p=...) que não expõe o destino na
    // URL (diferente do cread.php?...&ued=) — só dá pra saber a loja seguindo o
    // redirect de verdade. Se a 1ª tentativa caiu em "Curadoria", tenta de novo com
    // a URL final (depois de todos os redirects).
    if (loja.slug === "curadoria" && resp.url && resp.url !== alvo) {
      loja = lojaDaUrl(resp.url);
    }
    if (!resp.ok) {
      avisos.push(`O site respondeu ${resp.status} — não deu pra ler a página automaticamente. Preencha os campos à mão.`);
    } else {
      if (loja.slug === "mercadolivre" && !/MLB-?\d{6,}/i.test(resp.url)) {
        avisos.push("Esse link do Mercado Livre não abre direto no produto (link de afiliado opaco) — preencha os campos à mão.");
      } else {
        html = await resp.text();
      }
    }
  } catch {
    avisos.push("Não consegui abrir esse link a partir do servidor (bloqueio do site ou demorou demais). Preencha os campos à mão.");
  }

  if (!html) {
    return { loja, titulo: null, imagemUrl: null, preco: null, marca: null, descricao: null, categoria: null, slug: null, palavrasChave: [], avisos };
  }

  const jsonLd = extrairJsonLdProduct(html);
  const og = extrairOg(html);

  const titulo = limpar(jsonLd?.name) ?? og.title ?? extrairTagTitle(html);
  const imagemUrl = normalizarImagem(jsonLd?.image) ?? og.image;
  const preco = parsePreco(primeiroPreco(jsonLd?.offers) ?? og.precoAmount);
  const marca = nomeMarca(jsonLd?.brand);
  const descricao = (limpar(jsonLd?.description) ?? og.description)?.slice(0, 300) ?? null;

  if (!titulo) avisos.push("Não achei o título automaticamente — digite você.");
  if (!imagemUrl) avisos.push("Não achei uma foto automaticamente — cole a URL da imagem se tiver.");
  if (preco == null) avisos.push("Não achei o preço automaticamente — essa loja pode não expor o preço em texto simples.");

  return {
    loja,
    titulo,
    imagemUrl,
    preco,
    marca,
    descricao,
    categoria: titulo ? classificarCategoria(titulo, descricao) : null,
    slug: titulo ? slugify(titulo) : null,
    palavrasChave: titulo ? extrairPalavrasChave(titulo) : [],
    avisos,
  };
}
