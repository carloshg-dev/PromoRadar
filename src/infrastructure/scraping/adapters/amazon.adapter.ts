import * as cheerio from "cheerio";
import { StoreAdapter, parsePrecoBR, type AdapterContext } from "@/infrastructure/scraping/core/adapter";
import { coletarPaginas } from "@/infrastructure/scraping/core/browser-fetch";
import type { RawProduct, CategoriaSlug } from "@/core/domain/types";

/**
 * Amazon (amazon.com.br) — busca via HTML, com Chromium headless.
 *
 * `fetch` HTTP puro é intermitente (alterna 200/503 por anti-bot). Um browser
 * real serve a página de busca de forma confiável (~60 resultados por consulta,
 * sem captcha). Coleta por categoria (uma busca por categoria) e classifica pela
 * própria consulta, com um filtro de relevância no título p/ cortar acessórios.
 *
 * Estrutura do card (validada ao vivo):
 *   div[data-asin][data-component-type="s-search-result"]
 *     h2 span                         → título
 *     .a-price .a-offscreen           → preço atual ("R$ 5.584,10")
 *     .a-price.a-text-price .a-offscreen → preço "de" (lista)
 *     img.s-image                     → imagem
 *   o `data-asin` é o sku. URL canônica: /dp/{asin}.
 *
 * Roda local/runner (browser headless), não no cron serverless da Vercel.
 */

const SITE = "https://www.amazon.com.br";

const BUSCAS: ReadonlyArray<{ q: string; slug: CategoriaSlug; re: RegExp }> = [
  { q: "placa de video rtx", slug: "placas-de-video", re: /placa de v[íi]deo|\brtx\b|\brx ?\d|geforce|radeon|\bgpu\b/i },
  { q: "processador ryzen", slug: "processadores", re: /processador|ryzen|core i\d|core ultra|\bcpu\b/i },
  { q: "ssd nvme", slug: "ssds", re: /\bssd\b|nvme/i },
  { q: "memoria ram ddr5", slug: "memorias-ram", re: /mem[óo]ria|ddr[45]|\bram\b/i },
  { q: "fonte atx 80 plus", slug: "fontes", re: /fonte|\bpsu\b|80 ?plus|\b\d{3,4} ?w\b/i },
  { q: "placa mae b550 am4", slug: "placas-mae", re: /placa[ -]?m[ãa]e|motherboard|b550|b650|x670|z790|z690|h610|a620/i },
  { q: "monitor gamer 144hz", slug: "monitores", re: /\bmonitor/i },
  { q: "notebook gamer", slug: "notebooks", re: /\bnotebook/i },
  // Gadgets — Amazon é forte aqui; vira 2ª/3ª loja e destrava as comparações da
  // vertical (antes só Americanas + Mercado Livre alimentavam Gadgets).
  { q: "fone de ouvido bluetooth", slug: "fones-bluetooth", re: /fone|earbud|earphone|headphone|headset|\btws\b/i },
  { q: "smartwatch", slug: "smartwatch", re: /smartwatch|smart ?watch|rel[óo]gio inteligente|smart ?band/i },
  { q: "caixa de som bluetooth", slug: "caixa-de-som", re: /caixa de som|speaker|soundbar|partybox|\bjbl\b/i },
  { q: "power bank", slug: "power-bank", re: /power ?bank|carregador port[áa]til|bateria externa|\bmah\b/i },
  { q: "webcam full hd", slug: "webcam-acao", re: /webcam|c[âa]mera web|gopro|action ?cam/i },
];

export class AmazonAdapter extends StoreAdapter {
  readonly key = "amazon" as const;
  readonly nome = "Amazon";

  async coletar(ctx: AdapterContext): Promise<RawProduct[]> {
    const urls = BUSCAS.map((b) => `${SITE}/s?k=${encodeURIComponent(b.q)}`);

    let paginas;
    try {
      paginas = await coletarPaginas(urls, { log: ctx.log, intervaloEntre: 5000, esperaPosCarga: 3500 });
    } catch (e) {
      ctx.log("warn", `Amazon: coleta via browser indisponível (${(e as Error).message}).`);
      return [];
    }

    const out: RawProduct[] = [];
    const vistos = new Set<string>();
    for (let i = 0; i < BUSCAS.length; i++) {
      const b = BUSCAS[i]!;
      const pagina = paginas[i];
      if (!pagina?.html) {
        ctx.log("warn", `Amazon ${b.slug}: sem HTML${pagina?.erro ? ` (${pagina.erro})` : ""}.`);
        continue;
      }
      const antes = out.length;
      this.extrair(pagina.html, b, out, vistos);
      ctx.log("info", `Amazon ${b.slug}: ${out.length - antes} produtos`);
    }
    ctx.log("info", `Amazon: ${out.length} produtos no total`);
    return out;
  }

  private extrair(
    html: string,
    b: { slug: CategoriaSlug; re: RegExp },
    out: RawProduct[],
    vistos: Set<string>,
  ): void {
    const $ = cheerio.load(html);
    $('div[data-asin][data-component-type="s-search-result"]').each((_, el) => {
      const $e = $(el);
      const asin = ($e.attr("data-asin") ?? "").trim();
      if (!asin || vistos.has(asin)) return;

      const titulo = ($e.find("h2 span").first().text() || $e.find("[data-cy='title-recipe'] span").first().text()).trim();
      if (!titulo || !b.re.test(titulo)) return; // filtro de relevância (corta acessórios)

      const precoAtual = parsePrecoBR($e.find(".a-price .a-offscreen").first().text());
      if (precoAtual == null) return;

      const old = parsePrecoBR($e.find(".a-price.a-text-price .a-offscreen").first().text());
      const precoOriginal = old != null && old > precoAtual ? old : null;

      vistos.add(asin);
      out.push({
        skuLoja: asin,
        titulo: titulo.slice(0, 500),
        url: `${SITE}/dp/${asin}`,
        imagemUrl: $e.find("img.s-image").attr("src") ?? null,
        marca: null,
        categoriaSlug: b.slug,
        precoAtual,
        precoOriginal,
        emEstoque: true,
      });
    });
  }
}
