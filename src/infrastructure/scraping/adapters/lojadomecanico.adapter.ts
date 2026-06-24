import { StoreAdapter, type AdapterContext } from "@/infrastructure/scraping/core/adapter";
import { coletarPaginas } from "@/infrastructure/scraping/core/browser-fetch";
import type { RawProduct, CategoriaSlug } from "@/core/domain/types";

/**
 * Loja do Mecânico — a maior loja de ferramentas/EPI do Brasil (investigada ao
 * vivo 14/06/2026). VTEX por trás, mas protegida por Radware Bot Manager: home,
 * /busca/ e a API VTEX dão 302 sem JS. O caminho viável é o Firecrawl nas
 * páginas de CATEGORIA server-renderizadas (`/subcategorias/{setor}/{cat}/slug`)
 * — `/busca/` é SPA e só devolve um carrossel fixo, então NÃO usar.
 *
 * Cada card traz um JSON completo no atributo `data-product` — parse barato e
 * robusto (sem CSS frágil): name, brand, price.BRL, original_price.BRL,
 * in_stock, image_url, url, sku.
 *
 * Roda via Firecrawl (CI / SCRAPE_VIA_FIRECRAWL=1). Local sem Firecrawl degrada
 * para [] — o Playwright do runner não passa o Radware de forma confiável.
 */

const SITE = "https://www.lojadomecanico.com.br";

/** Categorias mapeadas (IDs confirmados na investigação) → slug do PromoDetec. */
const LISTAGENS: ReadonlyArray<{ path: string; slug: CategoriaSlug }> = [
  { path: "/subcategorias/2/115/chaves-combinadas", slug: "chaves-soquetes" },
  { path: "/subcategorias/2/855/chaves-soquete", slug: "chaves-soquetes" },
  { path: "/subcategorias/2/587/jogos-de-chaves", slug: "chaves-soquetes" },
  { path: "/subcategorias/21/222/esmerilhadeiras", slug: "lixadeiras" },
  { path: "/subcategorias/36/316/luvas-de-seguranca", slug: "epi" },
  { path: "/subcategorias/36/556/capacetes-de-seguranca", slug: "epi" },
];

interface DataProduct {
  name?: string; brand?: string; sku?: string; item_id?: string;
  price?: { BRL?: number }; original_price?: { BRL?: number };
  in_stock?: boolean; url?: string; image_url?: string;
}

/** Extrai e parseia os JSONs do atributo data-product de cada card. */
function extrairProdutos(html: string): DataProduct[] {
  const out: DataProduct[] = [];
  const re = /data-product=(?:"|&quot;)(\{.*?\})(?:"|&quot;)/gs;
  for (const m of html.matchAll(re)) {
    const bruto = m[1]!
      .replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#39;/g, "'");
    try { out.push(JSON.parse(bruto) as DataProduct); } catch { /* card malformado, ignora */ }
  }
  return out;
}

export class LojaDoMecanicoAdapter extends StoreAdapter {
  readonly key = "lojadomecanico" as const;
  readonly nome = "Loja do Mecânico";

  async coletar(ctx: AdapterContext): Promise<RawProduct[]> {
    const out: RawProduct[] = [];
    const vistos = new Set<string>();

    // EM SÉRIE (1 categoria por vez): Firecrawl com render longo p/ furar o Radware.
    for (const lst of LISTAGENS) {
      let pg;
      try {
        [pg] = await coletarPaginas([`${SITE}${lst.path}`], { log: ctx.log, esperaPosCarga: 7000 });
      } catch (e) {
        ctx.log("warn", `Loja do Mecânico ${lst.slug}: indisponível (${(e as Error).message}).`);
        continue;
      }
      if (!pg?.html) { ctx.log("warn", `Loja do Mecânico ${lst.slug}: não carregou${pg?.erro ? ` (${pg.erro})` : ""}.`); continue; }

      let n = 0;
      for (const p of extrairProdutos(pg.html)) {
        const preco = p.price?.BRL;
        const sku = p.sku ?? p.item_id ?? p.url;
        if (!p.name || !sku || typeof preco !== "number" || preco <= 0 || vistos.has(sku)) continue;
        const de = p.original_price?.BRL;
        vistos.add(sku);
        n++;
        out.push({
          skuLoja: String(sku).slice(0, 120),
          titulo: p.name.slice(0, 500),
          url: p.url ? (p.url.startsWith("http") ? p.url : `${SITE}${p.url}`) : `${SITE}${lst.path}`,
          imagemUrl: p.image_url ?? null,
          marca: p.brand ?? null,
          categoriaSlug: lst.slug,
          precoAtual: preco,
          precoOriginal: typeof de === "number" && de > preco ? de : null,
          emEstoque: p.in_stock !== false,
        });
      }
      ctx.log("info", `Loja do Mecânico ${lst.slug}: ${n} itens`);
    }

    ctx.log("info", `Loja do Mecânico: ${out.length} itens coletados`);
    return out;
  }
}
