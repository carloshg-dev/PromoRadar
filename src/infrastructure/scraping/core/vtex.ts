import type { RawProduct, CategoriaSlug } from "@/core/domain/types";

/**
 * Coletor genérico para lojas VTEX cuja API pública responde ao fetch do Node
 * (undici) — ex: Americanas, Ferramentas Gerais. (A Max Titanium é VTEX mas o
 * WAF dela exige navegação de documento; por isso usa coletarJson, não isto.)
 *
 * Busca por termo em `/api/catalog_system/pub/products/search?ft=`. Cada busca
 * vira uma categoria; o `valida` (regex no título) corta itens fora do tema
 * (acessórios/peças que a busca traz junto). HTTP puro: roda em qualquer lugar.
 */
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

/**
 * Peças/acessórios que a busca full-text traz junto e poluem a categoria
 * (ex: "Grade para Forno de Fogão", "Gaveta para Geladeira", "Trempe"). Não são
 * o produto-alvo — descartados. "para <eletro/ferramenta>" é o sinal mais forte.
 */
const PECA_ACESSORIO =
  /\bpara (fog[ãa]o|forno|cooktop|geladeira|refriger|lava|m[áa]quina|furadeira|serra|lixadeira)\b|\b(grade|trempe|manta|queimador|v[áa]lvula|mangueira|refil|borracha|puxador|prateleira|gaveta|trinco|dobradi[çc]a|reposi[çc][ãa]o|pe[çc]a)\b/i;

export interface VtexBusca {
  termo: string;
  slug: CategoriaSlug;
  /** só entra o produto cujo título casa (evita lixo da busca full-text) */
  valida?: RegExp;
}

interface VtexProduct {
  productId?: string;
  productName?: string;
  brand?: string;
  linkText?: string;
  items?: Array<{
    images?: Array<{ imageUrl?: string }>;
    sellers?: Array<{ sellerName?: string; commertialOffer?: { Price?: number; ListPrice?: number; IsAvailable?: boolean } }>;
  }>;
}

export interface ColetaVtexOpts {
  /** marca fixa da loja (ex: Ferramentas Gerais). Se ausente, usa o brand/seller do produto. */
  marca?: string;
  /** itens por termo (VTEX devolve em ranges; máx 50). Default 40. */
  porTermo?: number;
  log: (nivel: "info" | "warn" | "error", msg: string) => void;
}

export async function coletarVtex(
  site: string,
  buscas: readonly VtexBusca[],
  opts: ColetaVtexOpts,
): Promise<RawProduct[]> {
  const out: RawProduct[] = [];
  const vistos = new Set<string>();
  const porTermo = opts.porTermo ?? 40;

  for (const b of buscas) {
    try {
      const url = `${site}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(b.termo)}&_from=0&_to=${porTermo - 1}`;
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
      // VTEX responde 200 ou 206 (range parcial) — ambos OK.
      if (!res.ok && res.status !== 206) { opts.log("warn", `${site} ${b.slug}: HTTP ${res.status}`); continue; }
      const produtos = (await res.json()) as VtexProduct[];
      if (!Array.isArray(produtos)) { opts.log("warn", `${site} ${b.slug}: resposta inesperada`); continue; }

      let n = 0;
      for (const p of produtos) {
        if (!p.productName || !p.linkText || vistos.has(p.linkText)) continue;
        if (b.valida && !b.valida.test(p.productName)) continue;
        if (PECA_ACESSORIO.test(p.productName)) continue; // peça/acessório, não o produto

        const seller = p.items?.[0]?.sellers?.[0];
        const offer = seller?.commertialOffer;
        const preco = offer?.Price;
        if (typeof preco !== "number" || preco <= 0) continue;
        const lista = typeof offer?.ListPrice === "number" ? offer.ListPrice : null;

        vistos.add(p.linkText);
        n++;
        out.push({
          skuLoja: (p.productId ?? p.linkText).slice(0, 120),
          titulo: p.productName.slice(0, 500),
          url: `${site}/${p.linkText}/p`,
          imagemUrl: p.items?.[0]?.images?.[0]?.imageUrl ?? null,
          marca: opts.marca ?? p.brand ?? seller?.sellerName ?? null,
          categoriaSlug: b.slug,
          precoAtual: preco,
          precoOriginal: lista != null && lista > preco ? lista : null,
          emEstoque: offer?.IsAvailable !== false,
        });
      }
      opts.log("info", `${site.replace(/^https?:\/\/(www\.)?/, "")} ${b.slug}: ${n} itens`);
      await new Promise((r) => setTimeout(r, 250));
    } catch (e) {
      opts.log("warn", `${site} ${b.slug} falhou: ${(e as Error).message}`);
    }
  }
  return out;
}
