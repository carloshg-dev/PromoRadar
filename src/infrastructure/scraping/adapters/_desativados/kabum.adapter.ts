/**
 * Kabum Adapter — API REST pública de catálogo (JSON:API).
 *
 * Endpoint (validado ao vivo):
 *   https://servicespub.prod.api.aws.grupokabum.com.br/catalog/v2/products
 *   ?page_number=N&page_size=M&sort=-discount
 *
 * Cada item vem como { type, id, attributes: {...} }.
 * Campos reais usados: attributes.title, attributes.menu (categoria),
 * attributes.price_with_discount, attributes.old_price, attributes.product_link.
 * O código do produto é o `id` do topo do item.
 *
 * A categoria é classificada pelo campo `menu` (ex: "Hardware/Placa de Vídeo/...").
 * Itens fora das categorias do PromoDetec são descartados.
 */

import { StoreAdapter, type AdapterContext } from "@/infrastructure/scraping/core/adapter";
import type { RawProduct, CategoriaSlug } from "@/core/domain/types";

const BASE_API = "https://servicespub.prod.api.aws.grupokabum.com.br/catalog/v2/products";
const SITE = "https://www.kabum.com.br";
const PAGINAS = 10;     // 10 páginas
const TAMANHO = 100;    // de 100 = até 1000 produtos avaliados por rodada

/** Classificação pelo caminho de categoria (campo `menu`). */
const REGRAS: ReadonlyArray<{ slug: CategoriaSlug; re: RegExp }> = [
  { slug: "placas-de-video", re: /placa de v[íi]deo/i },
  { slug: "processadores", re: /processador/i },
  { slug: "ssds", re: /\bssd\b/i },
  { slug: "memorias-ram", re: /mem[óo]ria/i },
  { slug: "placas-mae", re: /placa[ -]?m[ãa]e/i },
  { slug: "fontes", re: /fonte/i },
  { slug: "monitores", re: /monitor/i },
  { slug: "notebooks", re: /notebook/i },
];

function classificar(menu: string, _titulo: string): CategoriaSlug | null {
  // Classifica SÓ pelo caminho de categoria da loja (campo `menu`). Usar o título
  // contaminava as categorias: um notebook usado com "SSD 256gb" no nome caía em
  // "ssds"; um PC gamer com "SSD 1TB" idem. O `menu` é a categoria REAL da Kabum.
  for (const r of REGRAS) if (r.re.test(menu)) return r.slug;
  return null;
}

type Item = { id?: unknown; attributes?: Record<string, unknown> } & Record<string, unknown>;
const num = (v: unknown): number => {
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : (v as number);
  return Number.isFinite(n) ? n : 0;
};
const str = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));

export class KabumAdapter extends StoreAdapter {
  readonly key = "kabum" as const;
  readonly nome = "Kabum";

  async coletar(ctx: AdapterContext): Promise<RawProduct[]> {
    const out: RawProduct[] = [];
    let totalRaw = 0;
    for (let page = 1; page <= PAGINAS; page++) {
      try {
        const url = `${BASE_API}?page_number=${page}&page_size=${TAMANHO}&sort=-discount`;
        const data = await this.fetchJson<{ data?: Item[] }>(url);
        const items = Array.isArray(data?.data) ? data.data : [];
        totalRaw += items.length;
        for (const raw of items) {
          const p = this.normalizar(raw);
          if (p) out.push(p);
        }
        await this.sleep(900);
      } catch (e) {
        ctx.log("warn", `Kabum página ${page} falhou: ${(e as Error).message}`);
      }
    }
    ctx.log("info", `Kabum: ${totalRaw} itens crus → ${out.length} de hardware válidos`);
    return out;
  }

  private normalizar(raw: Item): RawProduct | null {
    const a = raw.attributes ?? {};
    const titulo = str(a.title) || str(a.name);
    const menu = str(a.menu);
    if (!titulo) return null;

    const categoriaSlug = classificar(menu, titulo);
    if (!categoriaSlug) return null;

    const precoAtual = num(a.price_with_discount) || num(a.price);
    if (precoAtual <= 0) return null;
    const oldPrice = num(a.old_price);
    const precoOriginal = oldPrice > precoAtual ? oldPrice : null;

    const codigo = str(raw.id) || str(a.code);
    if (!codigo) return null;
    const slug = str(a.product_link) || str(a.friendly_name);

    // imagem: tenta images[0], depois photos.g[0]
    let imagem: string | null = null;
    const imgs = a.images;
    if (Array.isArray(imgs) && imgs.length) imagem = str(imgs[0]);
    if (!imagem) {
      const photos = a.photos as Record<string, unknown> | undefined;
      const g = photos?.g;
      if (Array.isArray(g) && g.length) imagem = str(g[0]);
    }

    const manufacturer = a.manufacturer as Record<string, unknown> | undefined;
    const estoque = a.available !== false && num(a.stock) !== 0;

    return {
      skuLoja: codigo,
      titulo: titulo.slice(0, 500),
      url: slug ? `${SITE}/produto/${codigo}/${slug}` : `${SITE}/produto/${codigo}`,
      imagemUrl: imagem,
      marca: manufacturer ? str(manufacturer.name) || null : null,
      categoriaSlug,
      precoAtual,
      precoOriginal,
      emEstoque: estoque,
    };
  }
}
