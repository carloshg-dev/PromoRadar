import { StoreAdapter, type AdapterContext } from "@/infrastructure/scraping/core/adapter";
import type { RawProduct, CategoriaSlug } from "@/core/domain/types";
import { contemTermoProibido } from "@/core/blacklist-nicho";

/**
 * Kabum — hardware/tech pesado pro comparador (aprovada Awin 11/07). NÃO tem
 * datafeed Awin (só deeplink no clique) e o site é React (não VTEX). MAS a API
 * interna dela (servicespub…grupokabum) responde JSON limpo — raspamos por ela.
 *
 * MONETIZAÇÃO: URL CRUA kabum.com.br → a rota /r/[id] embrulha no deeplink Awin
 * (mid 2936727) no clique (mesmo esquema Amazon/Carrefour). Loja multi-loja.
 */

const API = "https://servicespub.prod.api.aws.grupokabum.com.br/catalog/v2/products";
const SITE = "https://www.kabum.com.br";
const POR_QUERY = Math.min(100, Number(process.env.KABUM_POR_QUERY) || 60);
const PAGINAS = Math.max(1, Number(process.env.KABUM_PAGINAS) || 3);

interface Busca { query: string; slug: CategoriaSlug; valida: RegExp }
const BUSCAS: readonly Busca[] = [
  { query: "placa de video", slug: "placas-de-video", valida: /placa de v[íi]deo|\brtx\b|\brx ?\d|geforce|radeon/i },
  { query: "processador", slug: "processadores", valida: /processador|ryzen|core i\d|core ultra/i },
  { query: "ssd", slug: "ssds", valida: /\bssd\b|nvme/i },
  { query: "memoria ram", slug: "memorias-ram", valida: /mem[óo]ria|ddr[45]|\bram\b/i },
  { query: "fonte", slug: "fontes", valida: /fonte|\b\d{3,4} ?w\b|80 ?plus/i },
  { query: "placa mae", slug: "placas-mae", valida: /placa[ -]?m[ãa]e|b550|b650|x670|z790|h610|a620|h510/i },
  { query: "gabinete gamer", slug: "gabinetes", valida: /gabinete/i },
  { query: "monitor gamer", slug: "monitores", valida: /monitor/i },
  { query: "notebook", slug: "notebooks", valida: /notebook/i },
  { query: "teclado mecanico", slug: "perifericos", valida: /teclado/i },
  { query: "mouse gamer", slug: "perifericos", valida: /mouse/i },
  { query: "headset gamer", slug: "perifericos", valida: /headset|fone/i },
  { query: "cadeira gamer", slug: "perifericos", valida: /cadeira/i },
  { query: "water cooler", slug: "gabinetes", valida: /cooler|water/i },
];

interface KabumItem {
  id?: string;
  attributes?: {
    title?: string; price?: number; price_with_discount?: number; old_price?: number;
    available?: boolean; product_link?: string;
    manufacturer?: { name?: string } | string;
    images?: string[]; photos?: { g?: string[]; m?: string[] };
  };
}

export class KabumAdapter extends StoreAdapter {
  readonly key = "kabum" as const;
  readonly nome = "Kabum";

  async coletar(ctx: AdapterContext): Promise<RawProduct[]> {
    const out: RawProduct[] = [];
    const vistos = new Set<string>();
    const loja = {
      slug: "kabum", nome: "Kabum", baseUrl: SITE,
      logoUrl: "https://ui.awin.com/images/upload/merchant/profile/17729.png",
    };

    for (const b of BUSCAS) {
      if (out.length >= 1200) break;
      let n = 0;
      for (let pg = 1; pg <= PAGINAS; pg++) {
        try {
          const url = `${API}?query=${encodeURIComponent(b.query)}&page_number=${pg}&page_size=${POR_QUERY}`;
          const data = await this.fetchJson<{ data?: KabumItem[] }>(url, { headers: { Accept: "application/json" } });
          const itens = data.data ?? [];
          if (!itens.length) break;

          for (const it of itens) {
            const a = it.attributes;
            const nome = a?.title?.trim();
            if (!nome || !it.id || a?.available === false) continue;
            if (!b.valida.test(nome)) continue;         // fora do tipo da busca
            if (contemTermoProibido(nome)) continue;
            const atual = a?.price_with_discount || a?.price;
            if (typeof atual !== "number" || atual <= 0) continue;
            if (vistos.has(it.id)) continue;
            vistos.add(it.id);
            const orig = a?.price && a.price > atual ? a.price
              : (a?.old_price && a.old_price > atual ? a.old_price : null);
            const marca = typeof a?.manufacturer === "string" ? a.manufacturer : a?.manufacturer?.name ?? null;
            out.push({
              skuLoja: `kabum-${it.id}`,
              titulo: nome.slice(0, 500),
              url: `${SITE}/produto/${it.id}/${a?.product_link ?? ""}`, // CRU → /r/ embrulha Awin
              imagemUrl: a?.images?.[0] ?? a?.photos?.g?.[0] ?? a?.photos?.m?.[0] ?? null,
              marca,
              categoriaSlug: b.slug,
              precoAtual: atual,
              precoOriginal: orig,
              emEstoque: true,
              loja,
            });
            n++;
          }
          if (itens.length < POR_QUERY) break; // última página
          await this.sleep(400);
        } catch (e) {
          ctx.log("warn", `Kabum "${b.query}" p${pg}: ${(e as Error).message}`);
          break;
        }
      }
      ctx.log("info", `Kabum ${b.slug}: ${n} itens`);
    }
    ctx.log("info", `Kabum: ${out.length} produtos`);
    return out;
  }
}
