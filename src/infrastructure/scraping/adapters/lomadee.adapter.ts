import { StoreAdapter, type AdapterContext } from "@/infrastructure/scraping/core/adapter";
import type { RawProduct, CategoriaSlug } from "@/core/domain/types";

/**
 * Lomadee — rede de afiliados (API oficial). Alimenta o FEED "Achados dos
 * parceiros" da home. DADO + DINHEIRO no mesmo lugar:
 *   • GET  /affiliate/products?search=TERMO   → catálogo (preço + imagem + seller)
 *   • POST /affiliate/shortener/url           → gera o LINK DE AFILIADO (lmdee.link)
 *
 * Decisão (21/06): a busca da Lomadee é fuzzy e NÃO filtra por marca, então não
 * forçamos categoria (isso reintroduziria a mistura que corrigimos). Todos os
 * itens vão pro BUCKET NEUTRO `ofertas-parceiros` → aparecem SOLTOS no feed de
 * afiliados, sem poluir as verticais/comparador. Volume amplo em beleza,
 * perfumes e eletrônicos (o foco do dono). Rate limit 60/min → throttle.
 */

const BASE = "https://api.lomadee.com.br";
const CAT_NEUTRA: CategoriaSlug = "ofertas-parceiros";
const MAX_POR_BUSCA = 18;   // teto por termo (1 link/req → cabe no rate limit)
const THROTTLE_MS = 1100;   // 60/min no shortener

/** Termos amplos p/ dar VOLUME ao feed (beleza, perfume, eletrônicos, casa). */
const TERMOS: readonly string[] = [
  "perfume importado", "perfume feminino", "perfume masculino", "perfume arabe",
  "maquiagem", "batom", "base facial", "paleta de sombras",
  "skincare facial", "protetor solar", "shampoo", "creme hidratante",
  "fone de ouvido bluetooth", "smartwatch", "caixa de som bluetooth", "power bank",
  "geladeira", "fogao", "air fryer", "robo aspirador", "cafeteira", "liquidificador",
];

interface LmdProduct {
  id?: string;
  organizationId?: string;
  name?: string;
  url?: string;
  available?: boolean;
  images?: Array<{ url?: string }>;
  options?: Array<{ seller?: string; pricing?: Array<{ price?: number; listPrice?: number }> }>;
}

export class LomadeeAdapter extends StoreAdapter {
  readonly key = "lomadee" as const;
  readonly nome = "Lomadee";

  async coletar(ctx: AdapterContext): Promise<RawProduct[]> {
    const apiKey = process.env.LOMADEE_API_KEY;
    if (!apiKey) { ctx.log("warn", "Lomadee sem LOMADEE_API_KEY — pulando."); return []; }
    const headers = { "x-api-key": apiKey };

    const out: RawProduct[] = [];
    const vistos = new Set<string>();
    for (const termo of TERMOS) {
      try {
        const data = await this.fetchJson<{ data?: LmdProduct[] }>(
          `${BASE}/affiliate/products?search=${encodeURIComponent(termo)}&limit=100`,
          { headers },
        );
        const produtos = data.data ?? [];
        let n = 0;
        for (const p of produtos) {
          if (n >= MAX_POR_BUSCA) break;
          if (!p.id || !p.url || !p.organizationId || vistos.has(p.id)) continue;
          if (p.available === false) continue;
          const nome = p.name ?? "";
          if (nome.length < 6) continue;

          const opt = p.options?.[0];
          const preco = opt?.pricing?.[0]?.price;
          if (typeof preco !== "number" || preco <= 0) continue;
          const imagem = p.images?.[0]?.url ?? null;
          if (!imagem) continue; // feed é visual: sem foto não entra

          const link = await this.encurtar(p.url, p.organizationId, headers);
          if (!link) continue;

          const lista = opt?.pricing?.[0]?.listPrice;
          vistos.add(p.id);
          n++;
          out.push({
            skuLoja: `lmd-${p.id}`,
            titulo: nome.slice(0, 500),
            url: link,
            imagemUrl: imagem,
            marca: opt?.seller ?? "Lomadee",
            categoriaSlug: CAT_NEUTRA,
            precoAtual: preco,
            precoOriginal: typeof lista === "number" && lista > preco ? lista : null,
            emEstoque: true,
          });
          await this.sleep(THROTTLE_MS); // respeita 60/min do shortener
        }
        ctx.log("info", `Lomadee "${termo}": ${n} itens (c/ link afiliado)`);
      } catch (e) {
        ctx.log("warn", `Lomadee "${termo}" falhou: ${(e as Error).message}`);
      }
    }
    ctx.log("info", `Lomadee: ${out.length} itens no feed de parceiros`);
    return out;
  }

  /** Gera o link de afiliado (lmdee.link). null se falhar. */
  private async encurtar(url: string, organizationId: string, headers: Record<string, string>): Promise<string | null> {
    try {
      const r = await this.fetchJson<unknown>(`${BASE}/affiliate/shortener/url`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ url, organizationId, type: "Custom" }),
      });
      const m = JSON.stringify(r).match(/https:\/\/lmdee\.link\/[A-Za-z0-9]+/);
      return m?.[0] ?? null;
    } catch {
      return null;
    }
  }
}
