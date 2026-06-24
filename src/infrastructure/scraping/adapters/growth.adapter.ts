import * as cheerio from "cheerio";
import { StoreAdapter, parsePrecoBR, type AdapterContext } from "@/infrastructure/scraping/core/adapter";
import { coletarPaginas } from "@/infrastructure/scraping/core/browser-fetch";
import type { RawProduct, CategoriaSlug } from "@/core/domain/types";

/**
 * Growth Supplements — vertical Mundo Fit (investigação ao vivo 10/06/2026).
 *
 * O site (Nuxt/Vue) tem um paredão JS ("Verifying your browser…/noc-cdn") que
 * barra HTTP puro, mas browser real passa — local (Playwright) e Firecrawl.
 * A grade de produtos renderiza DEPOIS do load (XHR): precisa de espera longa
 * e rolagens para materializar os cards (~18 itens/listagem na 1ª dobra).
 *
 * Estrutura do card (validada ao vivo):
 *   div.card-wrapper
 *     a.card__name[href="/<slug>-pNNNNNN"]   → título (texto) + link
 *     .card__prices .price                   → preço à vista ("R$49,90")
 *     .card__prices-preco-de del             → preço cheio "de"
 *     .card__image img[src="/_ipx/...https://www.gsuplementos.com.br/upload/..."]
 */

const SITE = "https://www.gsuplementos.com.br";

const LISTAGENS: ReadonlyArray<{ url: string; slug: CategoriaSlug }> = [
  { url: `${SITE}/whey-protein`, slug: "whey-protein" },
  { url: `${SITE}/creatina`, slug: "creatina" },
  { url: `${SITE}/pre-treino`, slug: "pre-treino" },
  // NOTA: as listagens de "Outros" da Growth (/acessorios, /roupas, /bcaa…)
  // ficaram de fora — o headless não materializa o preço/card nessas páginas
  // (e /roupas dispara o anti-bot). O "Outros" já é abastecido por Soldiers,
  // Dark Lab, Max Titanium e Integralmédica. Refino do Growth fica como TODO.
];

/** A imagem vem via proxy `/_ipx/<transform>/<url-real>` — extraímos a URL real. */
function imagemReal(src: string | undefined): string | null {
  if (!src) return null;
  const m = src.match(/https?:\/\/.+$/);
  if (m) return m[0];
  return src.startsWith("/") ? `${SITE}${src}` : src;
}

export class GrowthAdapter extends StoreAdapter {
  readonly key = "growth" as const;
  readonly nome = "Growth Supplements";

  async coletar(ctx: AdapterContext): Promise<RawProduct[]> {
    const out: RawProduct[] = [];
    const vistos = new Set<string>();

    let paginas;
    try {
      paginas = await coletarPaginas(LISTAGENS.map((l) => l.url), {
        log: ctx.log,
        esperaPosCarga: 12000, // grade carrega via XHR após o load
        rolagens: 6,
      });
    } catch (e) {
      ctx.log("warn", `Growth: coleta indisponível (${(e as Error).message}).`);
      return [];
    }

    paginas.forEach((p, i) => {
      const cat = LISTAGENS[i];
      if (!p.html || !cat) {
        ctx.log("warn", `Growth ${cat?.slug ?? i}: listagem não carregou${p.erro ? ` (${p.erro})` : ""}.`);
        return;
      }
      const $ = cheerio.load(p.html);
      let n = 0;

      $("a.card__name").each((_, el) => {
        const $a = $(el);
        const href = $a.attr("href") ?? "";
        const m = href.match(/^\/([a-z0-9-]+-p\d{4,})\/?$/i);
        if (!m?.[1] || vistos.has(m[1])) return;

        const titulo = $a.text().trim();
        if (!titulo) return;

        const $card = $a.closest(".card-wrapper");
        const precoAtual = parsePrecoBR($card.find(".card__prices .price").first().text());
        if (precoAtual == null) return;

        const oldPrice = parsePrecoBR($card.find(".card__prices-preco-de del").first().text());

        vistos.add(m[1]);
        n++;
        out.push({
          skuLoja: m[1].slice(0, 120),
          titulo: titulo.slice(0, 500),
          url: `${SITE}/${m[1]}`,
          imagemUrl: imagemReal($card.find(".card__image img").first().attr("src")),
          marca: "Growth Supplements",
          categoriaSlug: cat.slug, // a listagem define a categoria (curadoria da própria loja)
          precoAtual,
          precoOriginal: oldPrice != null && oldPrice > precoAtual ? oldPrice : null,
          emEstoque: true,
        });
      });
      ctx.log("info", `Growth ${cat.slug}: ${n} itens`);
    });

    ctx.log("info", `Growth: ${out.length} itens coletados`);
    return out;
  }
}
