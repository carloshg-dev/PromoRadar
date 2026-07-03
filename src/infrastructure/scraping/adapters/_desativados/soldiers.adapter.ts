import { StoreAdapter, type AdapterContext } from "@/infrastructure/scraping/core/adapter";
import { classificarFit } from "@/infrastructure/scraping/core/suplementos";
import type { RawProduct } from "@/core/domain/types";

/**
 * Soldiers Nutrition — vertical Mundo Fit.
 *
 * A loja roda em Shopify, e Shopify expõe o catálogo COMPLETO em JSON público:
 * `/products.json?limit=250` (validado ao vivo 10/06/2026 — ~216 produtos, com
 * preço, estoque por variante e imagens). Zero browser, zero Firecrawl: é a
 * fonte mais barata de todo o projeto.
 *
 * Classifica o catálogo inteiro: whey/creatina/pré-treino nas suas categorias e
 * o restante (barra, BCAA, acessório, roupa…) em "Outros" — só grandes aparelhos
 * profissionais são descartados (classificarFit).
 */

const SITE = "https://www.soldiersnutrition.com.br";
const API = `${SITE}/products.json?limit=250`;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0 Safari/537.36";

interface ShopifyVariant { price?: string; compare_at_price?: string | null; available?: boolean }
interface ShopifyImage { src?: string }
interface ShopifyProduct {
  id: number; title?: string; handle?: string; product_type?: string;
  variants?: ShopifyVariant[]; images?: ShopifyImage[];
}

export class SoldiersAdapter extends StoreAdapter {
  readonly key = "soldiers" as const;
  readonly nome = "Soldiers Nutrition";

  async coletar(ctx: AdapterContext): Promise<RawProduct[]> {
    let data: { products?: ShopifyProduct[] };
    try {
      data = await this.fetchJson<{ products?: ShopifyProduct[] }>(API, {
        headers: { "User-Agent": UA, Accept: "application/json" },
      });
    } catch (e) {
      ctx.log("warn", `Soldiers: products.json falhou (${(e as Error).message}).`);
      return [];
    }

    const out: RawProduct[] = [];
    for (const p of data.products ?? []) {
      if (!p.handle || !p.title) continue;
      const categoriaSlug = classificarFit(p.title, p.product_type);
      if (!categoriaSlug) continue; // só grandes aparelhos profissionais ficam de fora

      // menor preço entre variantes disponíveis; sem disponível = fora de estoque
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
        marca: "Soldiers Nutrition",
        categoriaSlug,
        precoAtual,
        precoOriginal: compare != null && compare > precoAtual ? compare : null,
        emEstoque: disponiveis.length > 0,
      });
    }

    ctx.log("info", `Soldiers: ${out.length} itens (de ${data.products?.length ?? 0} no catálogo)`);
    return out;
  }
}
