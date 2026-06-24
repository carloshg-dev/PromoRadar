import { StoreAdapter, type AdapterContext } from "@/infrastructure/scraping/core/adapter";
import { classificarFit } from "@/infrastructure/scraping/core/suplementos";
import type { RawProduct } from "@/core/domain/types";

/**
 * Dark Lab Suplementos — vertical Mundo Fit (investigado ao vivo 10/06/2026).
 *
 * Loja Shopify: catálogo completo em `/products.json?limit=250` (~89 produtos,
 * ~25 de suplemento + roupas/acessórios que filtramos por classificação). Mesmo
 * padrão da Soldiers: HTTP puro, sem browser/Firecrawl. Cada variante traz
 * `grams` (peso) — o título já costuma ter o peso, que o matching usa.
 */

const SITE = "https://darklabsuplementos.com.br";
const API = `${SITE}/products.json?limit=250`;

interface ShopifyVariant { price?: string; compare_at_price?: string | null; available?: boolean }
interface ShopifyImage { src?: string }
interface ShopifyProduct {
  id: number; title?: string; handle?: string; product_type?: string;
  variants?: ShopifyVariant[]; images?: ShopifyImage[];
}

export class DarkLabAdapter extends StoreAdapter {
  readonly key = "darklab" as const;
  readonly nome = "Dark Lab";

  async coletar(ctx: AdapterContext): Promise<RawProduct[]> {
    let data: { products?: ShopifyProduct[] };
    try {
      data = await this.fetchJson<{ products?: ShopifyProduct[] }>(API);
    } catch (e) {
      ctx.log("warn", `Dark Lab: products.json falhou (${(e as Error).message}).`);
      return [];
    }

    const out: RawProduct[] = [];
    for (const p of data.products ?? []) {
      if (!p.handle || !p.title) continue;
      const categoriaSlug = classificarFit(p.title, p.product_type);
      if (!categoriaSlug) continue; // só grandes aparelhos profissionais ficam de fora

      const variantes = p.variants ?? [];
      const disponiveis = variantes.filter((v) => v.available && v.price);
      const base = (disponiveis.length ? disponiveis : variantes).filter((v) => v.price);
      if (!base.length) continue;
      const melhor = base.reduce((a, b) => (Number(a.price) <= Number(b.price) ? a : b));
      const precoAtual = Number(melhor.price);
      if (!Number.isFinite(precoAtual) || precoAtual <= 0) continue;

      const compare = melhor.compare_at_price ? Number(melhor.compare_at_price) : null;
      out.push({
        skuLoja: p.handle.slice(0, 120),
        titulo: p.title.slice(0, 500),
        url: `${SITE}/products/${p.handle}`,
        imagemUrl: p.images?.[0]?.src ?? null,
        marca: "Dark Lab",
        categoriaSlug,
        precoAtual,
        precoOriginal: compare != null && compare > precoAtual ? compare : null,
        emEstoque: disponiveis.length > 0,
      });
    }

    ctx.log("info", `Dark Lab: ${out.length} itens (de ${data.products?.length ?? 0} no catálogo)`);
    return out;
  }
}
