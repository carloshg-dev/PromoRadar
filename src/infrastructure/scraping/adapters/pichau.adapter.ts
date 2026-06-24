import * as cheerio from "cheerio";
import { StoreAdapter, parsePrecoBR, type AdapterContext } from "@/infrastructure/scraping/core/adapter";
import { coletarPaginas } from "@/infrastructure/scraping/core/browser-fetch";
import type { RawProduct, CategoriaSlug } from "@/core/domain/types";

/**
 * Pichau — catálogo completo via Firecrawl; home como fallback local.
 *
 * Histórico de investigação:
 *   • Browser headless local: home abre, mas TODO o catálogo (`/hardware/*`,
 *     `/search`, `/graphql`, página de produto) devolve 403 "Site em Manutenção"
 *     — bloqueio na camada de aplicação por reputação de IP.
 *   • Firecrawl (10/06/2026): `/hardware/placa-de-video` abriu normal — 354 KB,
 *     46 produtos, zero "manutenção". Os proxies BR do Firecrawl passam.
 *
 * Portanto: no CI (SCRAPE_VIA_FIRECRAWL=1) coletamos as PÁGINAS DE LISTAGEM por
 * categoria (~46 itens/página, 8 páginas/dia de cota Firecrawl). Rodando local
 * (Playwright), as listagens falham e caímos no fallback antigo da home.
 *
 * Estrutura do card (igual na home e na listagem, validada ao vivo):
 *   a[href]                       → âncora do produto (na listagem é URL absoluta,
 *                                   na home é relativa; slug longo no caminho raiz)
 *     img[alt="<nome completo>"]
 *     [class*="price_total"]      → preço à vista ("R$ 1.999,99")
 *     [class*="strikeThrough"]    → preço cheio "de"
 */

const SITE = "https://www.pichau.com.br";

/** Listagens por categoria (convenções de URL estáveis da Pichau). */
const LISTAGENS: ReadonlyArray<{ url: string; slug: CategoriaSlug }> = [
  { url: `${SITE}/hardware/placa-de-video`, slug: "placas-de-video" },
  { url: `${SITE}/hardware/processadores`, slug: "processadores" },
  { url: `${SITE}/hardware/ssd`, slug: "ssds" },
  { url: `${SITE}/hardware/memorias`, slug: "memorias-ram" },
  { url: `${SITE}/hardware/placas-mae`, slug: "placas-mae" },
  { url: `${SITE}/hardware/fontes`, slug: "fontes" },
  { url: `${SITE}/monitores`, slug: "monitores" },
  { url: `${SITE}/notebooks`, slug: "notebooks" },
];

/**
 * Classificação por título, ANCORADA no início (na Pichau o título começa pelo
 * tipo: "Placa de Video...", "Processador..."). Na listagem ela é o filtro de
 * qualidade: só fica o item cujo título CONCORDA com a categoria da página —
 * derruba cross-sell ("PC Gamer" na página de GPU) e HDs na página de SSD.
 */
const REGRAS: ReadonlyArray<{ slug: CategoriaSlug; re: RegExp }> = [
  { slug: "placas-de-video", re: /^\s*placa de v[íi]deo/i },
  { slug: "processadores", re: /^\s*processador/i },
  { slug: "ssds", re: /^\s*ssd\b/i },
  { slug: "memorias-ram", re: /^\s*mem[óo]ria/i },
  { slug: "placas-mae", re: /^\s*placa[ -]?m[ãa]e/i },
  { slug: "fontes", re: /^\s*fonte\b/i },
  { slug: "monitores", re: /^\s*monitor\b/i },
  { slug: "notebooks", re: /^\s*notebook/i },
];

function classificar(titulo: string): CategoriaSlug | null {
  for (const r of REGRAS) if (r.re.test(titulo)) return r.slug;
  return null;
}

/** Slug do produto a partir do href (aceita URL absoluta da listagem ou relativa da home). */
function slugDaHref(href: string): string | null {
  const m = href.match(/^(?:https?:\/\/www\.pichau\.com\.br)?\/([a-z0-9-]{12,})\/?$/i);
  return m?.[1] ? m[1].slice(0, 120) : null;
}

export class PichauAdapter extends StoreAdapter {
  readonly key = "pichau" as const;
  readonly nome = "Pichau";

  async coletar(ctx: AdapterContext): Promise<RawProduct[]> {
    const vistos = new Set<string>();
    const out: RawProduct[] = [];

    // 1) Catálogo por categoria (funciona via Firecrawl; local devolve 403)
    try {
      const paginas = await coletarPaginas(LISTAGENS.map((l) => l.url), {
        log: ctx.log,
        esperaPosCarga: 3000,
        rolagens: 2,
      });
      paginas.forEach((p, i) => {
        const cat = LISTAGENS[i];
        if (!p.html || !cat) {
          ctx.log("warn", `Pichau ${cat?.slug ?? i}: listagem não carregou${p.erro ? ` (${p.erro})` : ""}.`);
          return;
        }
        const itens = this.extrair(p.html, cat.slug, vistos);
        ctx.log("info", `Pichau ${cat.slug}: ${itens.length} itens`);
        out.push(...itens);
      });
    } catch (e) {
      ctx.log("warn", `Pichau: listagens indisponíveis (${(e as Error).message}).`);
    }

    // 2) Fallback: home (ambiente local, onde o catálogo é bloqueado)
    if (out.length === 0) {
      ctx.log("info", "Pichau: catálogo vazio — tentando a home (fallback local).");
      try {
        const [home] = await coletarPaginas([`${SITE}/`], { log: ctx.log, esperaPosCarga: 4000, rolagens: 4 });
        if (home?.html) out.push(...this.extrair(home.html, null, vistos));
      } catch (e) {
        ctx.log("warn", `Pichau: home também falhou (${(e as Error).message}).`);
      }
    }

    ctx.log("info", `Pichau: ${out.length} itens coletados`);
    return out;
  }

  /**
   * Extrai os cards de uma página. `categoriaDaPagina`:
   *  - definida (listagem): só entra item cujo título concorda com a página;
   *  - null (home, mistura tudo): a classificação por título decide sozinha.
   */
  private extrair(html: string, categoriaDaPagina: CategoriaSlug | null, vistos: Set<string>): RawProduct[] {
    const out: RawProduct[] = [];
    const $ = cheerio.load(html);

    $('[class*="price_total"]').each((_, el) => {
      const $tot = $(el);
      const $link = $tot.closest("a[href]");
      const href = $link.attr("href");
      if (!href) return;

      const sku = slugDaHref(href);
      if (!sku || vistos.has(sku)) return;

      const titulo = ($link.find("img").first().attr("alt") || "").trim();
      if (!titulo) return;

      const porTitulo = classificar(titulo);
      const categoriaSlug = categoriaDaPagina ?? porTitulo;
      if (!categoriaSlug) return; // home: só categorias rastreadas
      if (categoriaDaPagina && porTitulo !== categoriaDaPagina) return; // listagem: derruba cross-sell

      const precoAtual = parsePrecoBR($tot.text());
      if (precoAtual == null) return;

      const oldPrice = parsePrecoBR($link.find('[class*="strikeThrough"]').first().text());
      const precoOriginal = oldPrice != null && oldPrice > precoAtual ? oldPrice : null;

      vistos.add(sku);
      out.push({
        skuLoja: sku,
        titulo: titulo.slice(0, 500),
        url: `${SITE}/${sku}`,
        imagemUrl: $link.find("img").first().attr("src") ?? null,
        marca: null,
        categoriaSlug,
        precoAtual,
        precoOriginal,
        emEstoque: true,
      });
    });

    return out;
  }
}
