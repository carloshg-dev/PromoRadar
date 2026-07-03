import { StoreAdapter, type AdapterContext } from "@/infrastructure/scraping/core/adapter";
import { coletarJson } from "@/infrastructure/scraping/core/browser-fetch";
import { classificarFit } from "@/infrastructure/scraping/core/suplementos";
import type { RawProduct } from "@/core/domain/types";

/**
 * Max Titanium — vertical Mundo Fit (investigado ao vivo 10/06/2026).
 *
 * Loja VTEX. A API de catálogo é pública, MAS o WAF/Cloudflare distingue o
 * cliente pelo fingerprint: `curl`/navegação de documento → 200; `fetch` do
 * Node (undici) e até o `fetch` interno do Chromium → 403. Por isso NÃO usamos
 * fetchJson — coletamos via `coletarJson` (navegação de documento: Playwright
 * local, Firecrawl no CI).
 *
 * Puxamos o CATÁLOGO INTEIRO da marca (brandId 2000000, ~240 itens, 5 páginas de
 * 50) e classificamos cada um: whey/creatina/pré-treino nas suas categorias, o
 * resto em "Outros" (classificarFit). Uma fonte cobre toda a loja.
 *
 * Campos (items[0] = SKU principal; pode haver vários sabores):
 *   productName · brand · linkText → /{linkText}/p · items[0].images[0].imageUrl
 *   items[0].sellers[0].commertialOffer.{Price, ListPrice, IsAvailable}
 */

const SITE = "https://www.maxtitanium.com.br";
const BRAND_ID = 2000000;            // Max Titanium (fq=B:2000000)
const PAGINAS = [0, 50, 100, 150, 200]; // 5 páginas de 50 cobrem o catálogo (~240)

interface VtexOffer { Price?: number; ListPrice?: number; IsAvailable?: boolean }
interface VtexSeller { commertialOffer?: VtexOffer }
interface VtexImage { imageUrl?: string }
interface VtexItem { images?: VtexImage[]; sellers?: VtexSeller[] }
interface VtexProduct {
  productId?: string; productName?: string; brand?: string; linkText?: string;
  productClusterNames?: Record<string, string>; items?: VtexItem[];
}

export class MaxTitaniumAdapter extends StoreAdapter {
  readonly key = "maxtitanium" as const;
  readonly nome = "Max Titanium";

  async coletar(ctx: AdapterContext): Promise<RawProduct[]> {
    const out: RawProduct[] = [];
    const vistos = new Set<string>();

    const urls = PAGINAS.map((from) => `${SITE}/api/catalog_system/pub/products/search?fq=B:${BRAND_ID}&_from=${from}&_to=${from + 49}`);
    const respostas = await coletarJson(urls, { log: ctx.log });

    respostas.forEach((resp) => {
      const produtos = Array.isArray(resp) ? (resp as VtexProduct[]) : [];
      for (const p of produtos) {
        if (!p.productName || !p.linkText || vistos.has(p.linkText)) continue;
        const categoriaSlug = classificarFit(p.productName);
        if (!categoriaSlug) continue;

        const offer = p.items?.[0]?.sellers?.[0]?.commertialOffer;
        const precoAtual = offer?.Price;
        if (typeof precoAtual !== "number" || precoAtual <= 0) continue;
        const lista = typeof offer?.ListPrice === "number" ? offer.ListPrice : null;

        vistos.add(p.linkText);
        out.push({
          skuLoja: (p.productId ?? p.linkText).slice(0, 120),
          titulo: p.productName.slice(0, 500),
          url: `${SITE}/${p.linkText}/p`,
          imagemUrl: p.items?.[0]?.images?.[0]?.imageUrl ?? null,
          marca: "Max Titanium",
          categoriaSlug,
          precoOriginal: lista != null && lista > precoAtual ? lista : null,
          precoAtual,
          emEstoque: offer?.IsAvailable !== false,
        });
      }
    });

    ctx.log("info", `Max Titanium: ${out.length} itens coletados`);
    return out;
  }
}
