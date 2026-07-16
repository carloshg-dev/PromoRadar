import { StoreAdapter, type AdapterContext } from "@/infrastructure/scraping/core/adapter";
import type { RawProduct, CategoriaSlug } from "@/core/domain/types";
import { contemTermoProibido } from "@/core/blacklist-nicho";

/**
 * Polishop — eletroportáteis/casa/bem-estar. Aprovada na Awin (mid 26113) mas
 * SEM datafeed (por isso nunca chegava produto). O endpoint VTEX intelligent-
 * search dela responde 200 (testado 14/07: "Airfryer iChef 6L R$799,90") —
 * mesmo padrão do carrefour.adapter (clone deliberado; 3º uso a gente extrai
 * um core vtex-is genérico).
 *
 * MONETIZAÇÃO: URL CRUA polishop.com.br → /r/ embrulha no deeplink Awin
 * (mid 26113) no clique. Loja multi-loja (nasce sozinha na 1ª coleta).
 * Guilhotina de volume decide se ela fica (piso 200).
 */

const SITE = "https://www.polishop.com.br";
const IS = `${SITE}/api/io/_v/api/intelligent-search/product_search/trade-policy/1`;
const POR_PAGINA = Math.min(50, Number(process.env.POLISHOP_POR_PAGINA) || 48);
const MAX_PAGINAS = Math.max(1, Number(process.env.POLISHOP_PAGINAS) || 12);

/** Título → categoria do site (regex específicos; resto cai em ofertas-parceiros). */
const CATEGORIA_POR_TITULO: ReadonlyArray<[RegExp, CategoriaSlug]> = [
  [/escova secadora|secador|prancha|chapinha|modelador/i, "cabelos"],
  [/fone|earbud|headphone|headset/i, "fones-bluetooth"],
  [/smartwatch|rel[óo]gio inteligente/i, "smartwatch"],
  [/caixa de som|speaker|soundbar/i, "caixa-de-som"],
  [/suplemento|colageno|whey|vitamina/i, "fit-outros"],
  [/fog[ãa]o|cooktop/i, "fogoes"],
  [/micro-?ondas/i, "micro-ondas"],
];
function categoriaDe(titulo: string): CategoriaSlug {
  for (const [re, slug] of CATEGORIA_POR_TITULO) if (re.test(titulo)) return slug;
  return "ofertas-parceiros";
}

interface PoliProduct {
  productName?: string; link?: string; linkText?: string; brand?: string;
  items?: Array<{
    images?: Array<{ imageUrl?: string }>;
    sellers?: Array<{ commertialOffer?: { Price?: number; ListPrice?: number; IsAvailable?: boolean } }>;
  }>;
}

export class PolishopAdapter extends StoreAdapter {
  readonly key = "polishop" as const;
  readonly nome = "Polishop";

  async coletar(ctx: AdapterContext): Promise<RawProduct[]> {
    const out: RawProduct[] = [];
    const vistos = new Set<string>();
    const loja = {
      slug: "polishop", nome: "Polishop", baseUrl: SITE,
      logoUrl: "https://ui.awin.com/images/upload/merchant/profile/26113.png",
    };

    // CATÁLOGO INTEIRO: query VAZIA pagina os ~350 SKUs (buscas por termo davam
    // só 97 — abaixo do piso 200 da guilhotina; o catálogo completo passa).
    for (let pg = 1; pg <= MAX_PAGINAS; pg++) {
      try {
        const url = `${IS}?query=&count=${POR_PAGINA}&page=${pg}&sort=${encodeURIComponent("orders:desc")}`;
        const data = await this.fetchJson<{ products?: PoliProduct[] }>(url, { headers: { Referer: `${SITE}/` } });
        const prods = data.products ?? [];
        if (!prods.length) break;

        for (const p of prods) {
          const nome = p.productName?.trim();
          const path = p.link || (p.linkText ? `/${p.linkText}/p` : "");
          if (!nome || !path) continue;
          if (contemTermoProibido(nome)) continue;
          const offer = p.items?.[0]?.sellers?.[0]?.commertialOffer;
          const preco = offer?.Price;
          if (typeof preco !== "number" || preco <= 0) continue;
          if (offer?.IsAvailable === false) continue;
          const urlAbs = path.startsWith("http") ? path : `${SITE}${path}`;
          if (vistos.has(urlAbs)) continue;
          vistos.add(urlAbs);
          const lista = typeof offer?.ListPrice === "number" ? offer.ListPrice : null;
          out.push({
            skuLoja: urlAbs.slice(0, 120),
            titulo: nome.slice(0, 500),
            url: urlAbs,               // CRU — /r/ embrulha no deeplink Awin no clique
            imagemUrl: p.items?.[0]?.images?.[0]?.imageUrl ?? null,
            marca: p.brand ?? "Polishop",
            categoriaSlug: categoriaDe(nome),
            precoAtual: preco,
            precoOriginal: lista != null && lista > preco ? lista : null,
            emEstoque: true,
            loja,
          });
        }
        if (prods.length < POR_PAGINA) break;
        await this.sleep(400);
      } catch (e) {
        ctx.log("warn", `Polishop p${pg}: ${(e as Error).message}`);
        break;
      }
    }
    ctx.log("info", `Polishop: ${out.length} produtos (catálogo completo)`);
    return out;
  }
}
