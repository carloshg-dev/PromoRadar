import * as cheerio from "cheerio";
import { StoreAdapter, parsePrecoBR, type AdapterContext } from "@/infrastructure/scraping/core/adapter";
import { coletarPaginas } from "@/infrastructure/scraping/core/browser-fetch";
import type { RawProduct, CategoriaSlug } from "@/core/domain/types";

/**
 * Havan — vertical Casa & Eletro (investigado ao vivo 10/06/2026).
 *
 * Plataforma Magento 2 atrás de Cloudflare: GraphQL/REST e a home dão 403 a HTTP
 * puro. A busca pública `/catalogsearch/result/?q=TERMO` renderiza a grade de
 * produtos no HTML — então coletamos via browser/Firecrawl (coletarPaginas) e
 * parseamos com cheerio, como na Pichau.
 *
 * Card (.product-item, 24/página, validado ao vivo):
 *   a.product-item-link            → nome + URL (absoluta)
 *   [data-price-type="finalPrice"] .price  → preço à vista
 *   [data-price-type="oldPrice"] .price    → preço "de" (quando há desconto)
 *   img[src]                        → imagem (absoluta)
 */

const SITE = "https://www.havan.com.br";

/** Cada busca vira uma categoria; o `valida` corta itens fora do tema (peça, acessório). */
const BUSCAS: ReadonlyArray<{ termo: string; slug: CategoriaSlug; valida: RegExp }> = [
  { termo: "geladeira", slug: "geladeiras", valida: /geladeira|refrigerador|frigobar/i },
  { termo: "fogão", slug: "fogoes", valida: /fog[ãa]o|cooktop/i },
  { termo: "máquina de lavar", slug: "maquinas-lavar", valida: /lava|m[áa]quina de lavar|lavadora/i },
  { termo: "smart tv", slug: "tvs", valida: /\btv\b|smart\s?tv|televis/i },
  { termo: "microondas", slug: "micro-ondas", valida: /micro-?ondas/i },
  { termo: "ar condicionado", slug: "ar-condicionado", valida: /ar[- ]condicionado|split/i },
];

export class HavanAdapter extends StoreAdapter {
  readonly key = "havan" as const;
  readonly nome = "Havan";

  async coletar(ctx: AdapterContext): Promise<RawProduct[]> {
    const out: RawProduct[] = [];
    const vistos = new Set<string>();

    // EM SÉRIE (1 busca por vez): a grade Magento da Havan só renderiza completa
    // num request isolado — disparar as 6 juntas dá página parcial (rate-limit no
    // Firecrawl, render incompleto no Playwright). Serializar custa tempo, mas é
    // o que entrega as ~24 ofertas por categoria de forma confiável.
    for (const busca of BUSCAS) {
      const url = `${SITE}/catalogsearch/result/?q=${encodeURIComponent(busca.termo)}`;
      let pg;
      try {
        [pg] = await coletarPaginas([url], { log: ctx.log, esperaPosCarga: 4000 });
      } catch (e) {
        ctx.log("warn", `Havan ${busca.slug}: indisponível (${(e as Error).message}).`);
        continue;
      }
      if (!pg?.html) {
        ctx.log("warn", `Havan ${busca.slug}: não carregou${pg?.erro ? ` (${pg.erro})` : ""}.`);
        continue;
      }
      const $ = cheerio.load(pg.html);
      let n = 0;

      $(".product-item").each((_, el) => {
        const $card = $(el);
        const $link = $card.find("a.product-item-link").first();
        const titulo = $link.text().trim();
        const href = $link.attr("href");
        if (!titulo || !href || !busca.valida.test(titulo)) return; // fora do tema

        // O href termina em ".../{slug-do-produto}/p" (padrão Magento) — o slug
        // é o penúltimo segmento; pegar o último daria "p" para todos (colisão).
        const sku = (href.replace(/[?#].*$/, "").replace(/\/p\/?$/, "")
          .split("/").filter(Boolean).pop() ?? href).slice(0, 120);
        if (vistos.has(sku)) return;

        const precoAtual = parsePrecoBR(
          $card.find('[data-price-type="finalPrice"] .price, .special-price .price, .price').first().text(),
        );
        if (precoAtual == null) return;
        const de = parsePrecoBR($card.find('[data-price-type="oldPrice"] .price, .old-price .price').first().text());

        const img = $card.find("img").first();
        vistos.add(sku);
        n++;
        out.push({
          skuLoja: sku.slice(0, 120),
          titulo: titulo.slice(0, 500),
          url: href.startsWith("http") ? href : `${SITE}${href}`,
          imagemUrl: img.attr("src") ?? img.attr("data-src") ?? null,
          marca: null,
          categoriaSlug: busca.slug,
          precoAtual,
          precoOriginal: de != null && de > precoAtual ? de : null,
          emEstoque: true,
        });
      });
      ctx.log("info", `Havan ${busca.slug}: ${n} itens`);
    }

    ctx.log("info", `Havan: ${out.length} itens coletados`);
    return out;
  }
}
