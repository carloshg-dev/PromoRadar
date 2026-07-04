import { StoreAdapter, type AdapterContext } from "@/infrastructure/scraping/core/adapter";
import type { RawProduct, CategoriaSlug } from "@/core/domain/types";
import { contemTermoProibido } from "@/core/blacklist-nicho";

/**
 * Carrefour — eletro & tech pesado pro comparador geral. O Carrefour NÃO tem
 * datafeed na Awin, e a API de catálogo VTEX clássica dele responde 403 a fetch
 * de servidor. MAS o endpoint VTEX intelligent-search (VTEX IO) responde 200 —
 * é por ele que raspamos (com Referer do próprio site).
 *
 * MONETIZAÇÃO: salvamos a URL CRUA carrefour.com.br; a rota de saída /r/[id]
 * embrulha no deeplink Awin (mid 17665) no clique — mesmo esquema da Amazon
 * (tag no clique). `ehLinkMonetizado`/`AWIN_MIDS` já reconhecem carrefour.com.br.
 *
 * Loja multi-loja (item.loja) → nasce sozinha no banco na 1ª coleta.
 */

const SITE = "https://www.carrefour.com.br";
const IS = `${SITE}/api/io/_v/api/intelligent-search/product_search/trade-policy/1`;
const POR_QUERY = Math.min(50, Number(process.env.CARREFOUR_POR_QUERY) || 48);
// Carrefour tem 168k produtos — NÃO é limitado pelo catálogo (só pelo nosso teto).
// 4 páginas × 48 × 12 buscas → ~200+ após o filtro `valida` (era 94 com 2 pág).
const PAGINAS = Math.max(1, Number(process.env.CARREFOUR_PAGINAS) || 4);

interface Busca { query: string; slug: CategoriaSlug; valida?: RegExp }

/** Buscas por categoria — foco em eletro/tech pesado (autoridade no comparador). */
const BUSCAS: readonly Busca[] = [
  { query: "smart tv", slug: "tvs", valida: /\b(tv|televis)/i },
  { query: "geladeira", slug: "geladeiras", valida: /geladeira|refriger|frigobar/i },
  { query: "fogao", slug: "fogoes", valida: /fog[ãa]o|cooktop/i },
  { query: "maquina de lavar", slug: "maquinas-lavar", valida: /lavar|lava e seca|lavadora/i },
  { query: "ar condicionado", slug: "ar-condicionado", valida: /ar[- ]condicionado|split/i },
  { query: "micro-ondas", slug: "micro-ondas", valida: /micro-?ondas/i },
  { query: "notebook", slug: "notebooks", valida: /notebook|ultrabook|macbook/i },
  { query: "monitor", slug: "monitores", valida: /monitor/i },
  { query: "fone bluetooth", slug: "fones-bluetooth", valida: /fone|earbud|headset|headphone/i },
  { query: "smartwatch", slug: "smartwatch", valida: /smartwatch|smart watch|rel[óo]gio/i },
  { query: "caixa de som bluetooth", slug: "caixa-de-som", valida: /caixa de som|speaker|soundbar/i },
  { query: "power bank", slug: "power-bank", valida: /power ?bank|carregador port/i },
  // Eletroportáteis / linha branca — mais volume de eletro (bucket neutro qdo
  // não há vertical própria; Carrefour tem 168k produtos, o teto é nosso).
  { query: "air fryer", slug: "ofertas-parceiros", valida: /air ?fryer|fritadeira/i },
  { query: "aspirador de po", slug: "ofertas-parceiros", valida: /aspirador/i },
  { query: "cafeteira", slug: "ofertas-parceiros", valida: /cafeteira|café|nespresso/i },
  { query: "liquidificador", slug: "ofertas-parceiros", valida: /liquidificador/i },
  { query: "ventilador", slug: "ofertas-parceiros", valida: /ventilador|climatizador/i },
  { query: "cooktop", slug: "fogoes", valida: /cooktop/i },
  { query: "freezer", slug: "geladeiras", valida: /freezer|frigobar|geladeira/i },
  { query: "tablet", slug: "ofertas-parceiros", valida: /tablet|ipad/i },
  { query: "batedeira", slug: "ofertas-parceiros", valida: /batedeira/i },
  { query: "purificador de agua", slug: "ofertas-parceiros", valida: /purificador|bebedouro/i },
];

interface CarProduct {
  productName?: string; link?: string; linkText?: string; brand?: string;
  items?: Array<{
    images?: Array<{ imageUrl?: string }>;
    sellers?: Array<{ commertialOffer?: { Price?: number; ListPrice?: number; IsAvailable?: boolean } }>;
  }>;
}

export class CarrefourAdapter extends StoreAdapter {
  readonly key = "carrefour" as const;
  readonly nome = "Carrefour";

  async coletar(ctx: AdapterContext): Promise<RawProduct[]> {
    const out: RawProduct[] = [];
    const vistos = new Set<string>();
    const loja = {
      slug: "carrefour", nome: "Carrefour", baseUrl: SITE,
      logoUrl: "https://ui.awin.com/images/upload/merchant/profile/17665.png",
    };

    for (const b of BUSCAS) {
      if (out.length >= 1500) break;
      let n = 0;
      for (let pg = 1; pg <= PAGINAS; pg++) {
        try {
          const url = `${IS}?query=${encodeURIComponent(b.query)}&count=${POR_QUERY}&page=${pg}&sort=${encodeURIComponent("orders:desc")}`;
          const data = await this.fetchJson<{ products?: CarProduct[] }>(url, { headers: { Referer: `${SITE}/` } });
          const prods = data.products ?? [];
          if (!prods.length) break;

          for (const p of prods) {
            const nome = p.productName?.trim();
            const path = p.link || (p.linkText ? `/${p.linkText}/p` : "");
            if (!nome || !path) continue;
            if (b.valida && !b.valida.test(nome)) continue;   // fora do tipo da busca
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
              url: urlAbs,                 // CRU — /r/ embrulha no deeplink Awin no clique
              imagemUrl: p.items?.[0]?.images?.[0]?.imageUrl ?? null,
              marca: p.brand ?? null,
              categoriaSlug: b.slug,
              precoAtual: preco,
              precoOriginal: lista != null && lista > preco ? lista : null,
              emEstoque: true,
              loja,
            });
            n++;
          }
          if (prods.length < POR_QUERY) break; // última página
          await this.sleep(400);
        } catch (e) {
          ctx.log("warn", `Carrefour "${b.query}" p${pg}: ${(e as Error).message}`);
          break;
        }
      }
      ctx.log("info", `Carrefour ${b.slug}: ${n} itens`);
    }
    ctx.log("info", `Carrefour: ${out.length} produtos`);
    return out;
  }
}
