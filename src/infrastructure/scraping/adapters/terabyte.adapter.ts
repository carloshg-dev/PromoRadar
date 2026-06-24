import * as cheerio from "cheerio";
import { StoreAdapter, parsePrecoBR, type AdapterContext } from "@/infrastructure/scraping/core/adapter";
import { coletarPaginas } from "@/infrastructure/scraping/core/browser-fetch";
import type { RawProduct, CategoriaSlug } from "@/core/domain/types";

/**
 * TerabyteShop — catálogo em HTML protegido por desafio JS do Cloudflare.
 *
 * `fetch` HTTP puro recebe 403 ("Just a moment…"). A coleta passa por um Chromium
 * headless que resolve o desafio (ver `browser-fetch.ts`). Cada categoria é uma
 * página de listagem que já traz todos os itens (sem paginação) — ~100–150 cards.
 *
 * Estrutura do card (validada ao vivo):
 *   .product-item
 *     a.product-item__image[href="/produto/{id}/{slug}"][title="<nome completo>"]
 *       img.image-thumbnail[src]
 *     .product-item__name            → nome (truncado; preferir o title do link)
 *     .product-item__old-price       → "De: R$ 2.999,90 por:"   (preço cheio)
 *     .product-item__new-price       → "R$ 1.689,99 à vista"     (preço à vista)
 *
 * O sku é o `{id}` da URL do produto. A categoria é a própria página coletada
 * (confiável, sem heurística de título).
 *
 * Roda local/runner (browser headless), não no cron serverless da Vercel.
 */

const SITE = "https://www.terabyteshop.com.br";

/** Mapa categoria do PromoDetec → caminho de listagem na Terabyte (validado ao vivo). */
const CATEGORIAS: ReadonlyArray<{ slug: CategoriaSlug; path: string }> = [
  { slug: "placas-de-video", path: "hardware/placas-de-video" },
  { slug: "processadores", path: "hardware/processadores" },
  { slug: "ssds", path: "hardware/disco-ssd" },
  { slug: "memorias-ram", path: "hardware/memorias" },
  { slug: "placas-mae", path: "hardware/placas-mae" },
  { slug: "fontes", path: "hardware/fontes" },
  { slug: "monitores", path: "monitor" },
  { slug: "notebooks", path: "notebook" },
];

/** Extrai o id numérico do produto de uma URL "/produto/{id}/{slug}". */
function skuDaUrl(href: string): string | null {
  const m = href.match(/\/produto\/(\d+)/);
  return m ? m[1]! : null;
}

export class TerabyteAdapter extends StoreAdapter {
  readonly key = "terabyte" as const;
  readonly nome = "TerabyteShop";

  async coletar(ctx: AdapterContext): Promise<RawProduct[]> {
    const urls = CATEGORIAS.map((c) => `${SITE}/${c.path}`);

    let paginas;
    try {
      paginas = await coletarPaginas(urls, {
        log: ctx.log,
        intervaloEntre: 5000, // ritmo educado entre categorias
        esperaPosCarga: 3500,
      });
    } catch (e) {
      // Ambiente sem browser (ex: serverless): degrada sem derrubar a rodada.
      ctx.log("warn", `Terabyte: coleta via browser indisponível (${(e as Error).message}).`);
      return [];
    }

    const out: RawProduct[] = [];
    for (let i = 0; i < CATEGORIAS.length; i++) {
      const { slug } = CATEGORIAS[i]!;
      const pagina = paginas[i];
      if (!pagina?.html) {
        ctx.log("warn", `Terabyte ${slug}: sem HTML${pagina?.erro ? ` (${pagina.erro})` : ""}.`);
        continue;
      }
      const antes = out.length;
      this.extrair(pagina.html, slug, out);
      ctx.log("info", `Terabyte ${slug}: ${out.length - antes} produtos`);
    }

    ctx.log("info", `Terabyte: ${out.length} produtos no total`);
    return out;
  }

  private extrair(html: string, categoriaSlug: CategoriaSlug, out: RawProduct[]): void {
    const $ = cheerio.load(html);
    $(".product-item").each((_, el) => {
      const $el = $(el);
      const $link = $el.find("a.product-item__image").first();
      const href = $link.attr("href") ?? "";
      const sku = skuDaUrl(href);
      if (!sku) return;

      const titulo = ($link.attr("title") || $el.find(".product-item__name").first().text()).trim();
      if (!titulo) return;

      const precoAtual = parsePrecoBR($el.find(".product-item__new-price").first().text());
      if (precoAtual == null) return; // sem preço à vista → indisponível, pula

      const oldTxt = $el.find(".product-item__old-price").first().text();
      const oldPrice = parsePrecoBR(oldTxt);
      const precoOriginal = oldPrice != null && oldPrice > precoAtual ? oldPrice : null;

      const imagem = $el.find("img.image-thumbnail").first().attr("src") ?? null;
      const url = href.startsWith("http") ? href : `${SITE}${href.startsWith("/") ? "" : "/"}${href}`;

      out.push({
        skuLoja: sku,
        titulo: titulo.slice(0, 500),
        url,
        imagemUrl: imagem,
        marca: null,
        categoriaSlug,
        precoAtual,
        precoOriginal,
        emEstoque: true,
      });
    });
  }
}
