import { StoreAdapter, type AdapterContext } from "@/infrastructure/scraping/core/adapter";
import type { RawProduct, CategoriaSlug } from "@/core/domain/types";
import { obterAccessTokenML, obterAppTokenML } from "@/infrastructure/integrations/mercadolivre-auth";

/**
 * Mercado Livre — via API de CATÁLOGO (descoberta ao vivo).
 *
 * A busca pública `/sites/MLB/search` foi fechada (403, mesmo com token). Mas a
 * API de catálogo responde 200 com um app token (`client_credentials`, sem OAuth
 * de usuário):
 *   • GET /products/search?site_id=MLB&q=...   → produtos de catálogo (nome,
 *     marca, foto, domínio/categoria).
 *   • GET /products/{id}/items?limit=1         → menor preço ativo (buy box).
 *
 * Nem todo produto de catálogo tem oferta ativa (~1/4 retorna preço); os sem
 * `/items` são pulados. Cobertura parcial, mas dados reais — bem melhor que o
 * "bloqueado" anterior. Roda em qualquer ambiente (só HTTP, sem browser).
 */

const SEARCH = "https://api.mercadolibre.com/products/search";
const PRODUCTS = "https://api.mercadolibre.com/products";
const PDP = "https://www.mercadolivre.com.br/p";

/**
 * Quantos produtos de catálogo avaliar por categoria (mais cobertura = mais
 * chamadas/tempo). Padrão 20 cabe nos ~60s do serverless (Hobby); o GitHub
 * Actions (sem teto de tempo) sobe via env ML_POR_CATEGORIA=50 — máximo da API.
 */
const POR_CATEGORIA = Math.min(50, Math.max(5, Number(process.env.ML_POR_CATEGORIA) || 20));

interface BuscaML { q: string; slug: CategoriaSlug; limit?: number }

const BUSCAS: ReadonlyArray<BuscaML> = [
  { q: "placa de video rtx", slug: "placas-de-video" },
  { q: "processador ryzen", slug: "processadores" },
  { q: "ssd nvme", slug: "ssds" },
  { q: "memoria ram ddr5", slug: "memorias-ram" },
  { q: "fonte 650w 80 plus", slug: "fontes" },
  { q: "placa mae b550", slug: "placas-mae" },
  { q: "monitor gamer 144hz", slug: "monitores" },
  { q: "notebook gamer", slug: "notebooks" },
];

/**
 * Mundo Fit: buscas por MARCA — é o que casa os produtos das lojas próprias
 * (Growth/Soldiers/Max/Integral/Dark Lab) com o ML no comparador. Limite menor
 * (cada marca tem poucos itens relevantes no ML) p/ não estourar tempo. Só
 * entram no modo FUNDO (Actions); no cron raso da Vercel ficariam de fora.
 */
const BUSCAS_FIT: ReadonlyArray<BuscaML> = [
  { q: "whey growth", slug: "whey-protein", limit: 15 },
  { q: "creatina growth", slug: "creatina", limit: 15 },
  { q: "pre treino growth", slug: "pre-treino", limit: 15 },
  { q: "whey max titanium", slug: "whey-protein", limit: 15 },
  { q: "creatina max titanium", slug: "creatina", limit: 15 },
  { q: "whey integralmedica", slug: "whey-protein", limit: 15 },
  { q: "creatina integralmedica", slug: "creatina", limit: 15 },
  { q: "whey dark lab", slug: "whey-protein", limit: 15 },
  { q: "creatina dark lab", slug: "creatina", limit: 15 },
];

/**
 * Casa & Eletro + Ferramentas: o ML como 3ª loja sobreposta, multiplicando as
 * comparações (Havan/Americanas/FG × ML). Buscas por marca+spec p/ casar com o
 * matching. Só no modo FUNDO (Actions).
 */
const BUSCAS_ELETRO_FERR: ReadonlyArray<BuscaML> = [
  { q: "geladeira brastemp frost free", slug: "geladeiras", limit: 20 },
  { q: "geladeira electrolux", slug: "geladeiras", limit: 20 },
  { q: "smart tv samsung", slug: "tvs", limit: 20 },
  { q: "smart tv lg", slug: "tvs", limit: 20 },
  { q: "fogao brastemp 4 bocas", slug: "fogoes", limit: 15 },
  { q: "ar condicionado split springer midea", slug: "ar-condicionado", limit: 20 },
  { q: "lavadora brastemp electrolux", slug: "maquinas-lavar", limit: 20 },
  { q: "furadeira parafusadeira bosch", slug: "furadeiras", limit: 20 },
  { q: "furadeira makita", slug: "furadeiras", limit: 15 },
  { q: "serra circular makita bosch", slug: "serras", limit: 15 },
  { q: "lixadeira bosch", slug: "lixadeiras", limit: 15 },
  { q: "compressor de ar vonder schulz", slug: "compressores", limit: 15 },
  { q: "jogo de soquete gedore tramontina", slug: "chaves-soquetes", limit: 15 },
];

/** Gadgets + Perfumes: ML como 2ª/3ª loja p/ comparação. Só no modo FUNDO. */
const BUSCAS_GADGET_PERFUME: ReadonlyArray<BuscaML> = [
  { q: "fone bluetooth jbl xiaomi", slug: "fones-bluetooth", limit: 20 },
  { q: "smartwatch xiaomi amazfit", slug: "smartwatch", limit: 20 },
  { q: "caixa de som bluetooth jbl", slug: "caixa-de-som", limit: 15 },
  { q: "power bank xiaomi anker", slug: "power-bank", limit: 15 },
  { q: "webcam logitech full hd", slug: "webcam-acao", limit: 15 },
  { q: "perfume lattafa", slug: "perfumes-arabes", limit: 20 },
  { q: "perfume armaf", slug: "perfumes-arabes", limit: 15 },
  { q: "perfume importado masculino", slug: "perfumes-importados", limit: 20 },
  { q: "perfume importado feminino", slug: "perfumes-importados", limit: 15 },
];

interface CatalogProduct {
  id: string;
  catalog_product_id?: string;
  name?: string;
  pictures?: Array<{ url?: string; secure_url?: string }>;
  attributes?: Array<{ id?: string; value_name?: string }>;
}
interface CatalogItem {
  item_id?: string;
  price?: number;
  original_price?: number | null;
  available_quantity?: number;
}

function marcaDe(p: CatalogProduct): string | null {
  const b = p.attributes?.find((a) => a.id === "BRAND")?.value_name;
  return b ?? null;
}

export class MercadoLivreAdapter extends StoreAdapter {
  readonly key = "mercadolivre" as const;
  readonly nome = "Mercado Livre";

  async coletar(ctx: AdapterContext): Promise<RawProduct[]> {
    // Preferir token de usuário (se conectado); senão, app token (client_credentials).
    const token = (await obterAccessTokenML()) ?? (await obterAppTokenML());
    if (!token) {
      ctx.log("warn", "Mercado Livre sem credenciais (ML_CLIENT_ID/SECRET ausentes). Pulando.");
      return [];
    }
    const headers = { Authorization: `Bearer ${token}` };

    const out: RawProduct[] = [];
    const buscas = POR_CATEGORIA >= 50 ? [...BUSCAS, ...BUSCAS_FIT, ...BUSCAS_ELETRO_FERR, ...BUSCAS_GADGET_PERFUME] : BUSCAS;
    for (const b of buscas) {
      try {
        const lim = b.limit ?? POR_CATEGORIA;
        const url = `${SEARCH}?site_id=MLB&status=active&q=${encodeURIComponent(b.q)}&limit=${lim}`;
        const data = await this.fetchJson<{ results?: CatalogProduct[] }>(url, { headers });
        const produtos = data.results ?? [];
        let comPreco = 0;

        for (const p of produtos) {
          if (!p.id || !p.name) continue;
          const preco = await this.menorPreco(p.id, headers);
          if (!preco) continue;
          comPreco++;

          const catId = p.catalog_product_id ?? p.id;
          const img = p.pictures?.[0]?.secure_url ?? p.pictures?.[0]?.url ?? null;
          out.push({
            skuLoja: catId,
            titulo: p.name.slice(0, 500),
            url: `${PDP}/${catId}`,
            imagemUrl: img,
            marca: marcaDe(p),
            categoriaSlug: b.slug,
            precoAtual: preco.precoAtual,
            precoOriginal: preco.precoOriginal,
            emEstoque: true,
          });
          await this.sleep(120); // ritmo entre chamadas de /items
        }
        ctx.log("info", `ML ${b.slug}: ${comPreco}/${produtos.length} com preço ativo`);
        await this.sleep(400);
      } catch (e) {
        ctx.log("warn", `ML "${b.q}" falhou: ${(e as Error).message}`);
      }
    }
    ctx.log("info", `Mercado Livre: ${out.length} itens coletados`);
    return out;
  }

  /** Menor preço ativo de um produto de catálogo (buy box). null se sem oferta. */
  private async menorPreco(
    catalogId: string,
    headers: Record<string, string>,
  ): Promise<{ precoAtual: number; precoOriginal: number | null } | null> {
    try {
      const data = await this.fetchJson<{ results?: CatalogItem[] }>(
        `${PRODUCTS}/${catalogId}/items?limit=1`,
        { headers },
      );
      const item = data.results?.[0];
      if (!item || !(typeof item.price === "number") || item.price <= 0) return null;
      const orig = item.original_price;
      return {
        precoAtual: item.price,
        precoOriginal: typeof orig === "number" && orig > item.price ? orig : null,
      };
    } catch {
      return null; // 404 = sem itens ativos; segue sem derrubar a categoria
    }
  }
}
