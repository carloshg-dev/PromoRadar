import { StoreAdapter, type AdapterContext } from "@/infrastructure/scraping/core/adapter";
import { classificarFit } from "@/infrastructure/scraping/core/suplementos";
import type { RawProduct } from "@/core/domain/types";

/**
 * Integralmédica — vertical Mundo Fit (investigado ao vivo 10/06/2026).
 *
 * NÃO é VTEX (o `site-platform="vtex"` é pista falsa): é Shopify headless
 * (Hydrogen). A fonte limpa é a Storefront GraphQL API do shop interno, com um
 * token público de storefront (lido da hidratação da própria página — leitura
 * apenas). HTTP puro, sem browser/Firecrawl.
 *
 * URL pública do produto = https://www.integralmedica.com.br/{handle}/p
 * (o onlineStoreUrl aponta para o domínio de checkout — não usar).
 */

const SITE = "https://www.integralmedica.com.br";
const GQL = "https://totvsibi-integralmedica-dc.myshopify.com/api/2024-07/graphql.json";
const STOREFRONT_TOKEN = "8579679aad75c79869d7168ad90d4d37"; // público (storefront, read-only)
// 3 categorias principais + termos que trazem o "Outros" (BCAA, barra, vitamina,
// acessórios…). classificarFit roteia cada resultado para a categoria certa.
const TERMOS = ["whey", "creatina", "pre-treino", "bcaa", "barra", "glutamina", "termogenico", "coqueteleira"] as const;

const QUERY = `query P($q:String!){products(first:50,query:$q){edges{node{
  title handle vendor productType
  priceRange{minVariantPrice{amount}}
  compareAtPriceRange{minVariantPrice{amount}}
  featuredImage{url}
  variants(first:1){edges{node{availableForSale}}}
}}}}`;

interface GqlNode {
  title?: string; handle?: string; vendor?: string; productType?: string;
  priceRange?: { minVariantPrice?: { amount?: string } };
  compareAtPriceRange?: { minVariantPrice?: { amount?: string } };
  featuredImage?: { url?: string };
  variants?: { edges?: Array<{ node?: { availableForSale?: boolean } }> };
}
interface GqlResp { data?: { products?: { edges?: Array<{ node?: GqlNode }> } } }

export class IntegralmedicaAdapter extends StoreAdapter {
  readonly key = "integralmedica" as const;
  readonly nome = "Integralmédica";

  async coletar(ctx: AdapterContext): Promise<RawProduct[]> {
    const out: RawProduct[] = [];
    const vistos = new Set<string>();

    for (const termo of TERMOS) {
      try {
        const resp = await this.fetchJson<GqlResp>(GQL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
          },
          body: JSON.stringify({ query: QUERY, variables: { q: termo } }),
        });
        const edges = resp.data?.products?.edges ?? [];
        let n = 0;

        for (const { node: p } of edges) {
          if (!p?.title || !p.handle || vistos.has(p.handle)) continue;
          const categoriaSlug = classificarFit(p.title, p.productType);
          if (!categoriaSlug) continue;

          const precoAtual = Number(p.priceRange?.minVariantPrice?.amount);
          if (!Number.isFinite(precoAtual) || precoAtual <= 0) continue;
          const de = Number(p.compareAtPriceRange?.minVariantPrice?.amount); // "0.0" = sem desconto

          vistos.add(p.handle);
          n++;
          out.push({
            skuLoja: p.handle.slice(0, 120),
            titulo: p.title.slice(0, 500),
            url: `${SITE}/${p.handle}/p`,
            imagemUrl: p.featuredImage?.url ?? null,
            marca: "Integralmédica",
            categoriaSlug,
            precoAtual,
            precoOriginal: Number.isFinite(de) && de > precoAtual ? de : null,
            emEstoque: p.variants?.edges?.[0]?.node?.availableForSale !== false,
          });
        }
        ctx.log("info", `Integralmédica ${termo}: ${n} itens`);
        await this.sleep(300);
      } catch (e) {
        ctx.log("warn", `Integralmédica "${termo}" falhou: ${(e as Error).message}`);
      }
    }

    ctx.log("info", `Integralmédica: ${out.length} itens coletados`);
    return out;
  }
}
