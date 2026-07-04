import { StoreAdapter, type AdapterContext } from "@/infrastructure/scraping/core/adapter";
import type { RawProduct } from "@/core/domain/types";
import { contemTermoProibido } from "@/core/blacklist-nicho";
import { decodeHtmlEntities } from "@/lib/utils";
import { LOMADEE_PARCEIROS, lomadeeLogoUrl, type LomadeeParceiro } from "@/core/lomadee-parceiros";
import { coletarVtex } from "@/infrastructure/scraping/core/vtex";

/**
 * Lomadee MULTI-LOJA — v2 (02/07/2026). O princípio "dado × dinheiro" completo:
 *   • DADO: catálogo raspado direto da loja parceira (Shopify/VTEX/WooCommerce —
 *     APIs públicas de cada plataforma, com foto + preço reais);
 *   • DINHEIRO: cada URL de produto é CUNHADA no encurtador oficial
 *     (POST /affiliate/shortener/url → lmdee.link com o canal do dono).
 *
 * Cada parceiro vira uma LOJA própria no banco (identidade por item — mesma
 * fundação multi-loja da Awin). Fonte única: src/core/lomadee-parceiros.ts.
 *
 * AUTO-COMPLIANCE: só coleta marca presente em /affiliate/brands (pausada SOME
 * da lista) e com canal Comparador liberado (shortUrls preenchido) — a lição
 * Época/Terabyte em código. Rate limit 60/min → throttle no encurtador.
 *
 * (v1 search-based aposentada: busca fuzzy sem filtro de marca = achados
 * genéricos com preço que envelhece; catálogo de loja real é coletável 1x/dia.)
 */

const BASE = "https://api.lomadee.com.br";
const THROTTLE_MS = 1100;  // 60/min no encurtador
const MAX_POR_LOJA = Number(process.env.LOMADEE_MAX_POR_LOJA) || 250;
const MAX_TOTAL = Number(process.env.LOMADEE_MAX_TOTAL) || 600;

/**
 * LOMADEE_SOURCE_ID = canal PriceComparator do PromoDetec (66222f2a-…). ATENÇÃO:
 * a API do encurtador NÃO aceita esse id como parâmetro — testado ao vivo,
 * `sourceId`/`channelId`/`source` no body retornam HTTP 400 "property should
 * not exist" (validação estrita). Injetar quebraria a geração de TODO link →
 * prateleira vazia. O canal JÁ vem embutido automaticamente em cada shortUrl
 * (a API key escopa conta+canal). Então usamos o env como GUARDA: valida que
 * cada link cunhado caiu no canal certo e ALERTA se divergir — tripwire de
 * comissão, sem risco de quebrar o dinheiro. Ver também src/lib/lomadee-cupons.
 */
const CANAL_ESPERADO = process.env.LOMADEE_SOURCE_ID?.trim() || null;

interface MarcaLomadee {
  id: string;
  name: string;
  network?: { active?: boolean };
  channels?: Array<{ shortUrls?: string[] }>;
}

interface Candidato {
  titulo: string;
  urlProduto: string;
  imagemUrl: string | null;
  precoAtual: number;
  precoOriginal: number | null;
  marca: string | null;
  categoriaSlug: RawProduct["categoriaSlug"];
  skuBase: string;
}

export class LomadeeAdapter extends StoreAdapter {
  readonly key = "lomadee" as const;
  readonly nome = "Lomadee"; // fallback — cada item carrega a própria loja

  async coletar(ctx: AdapterContext): Promise<RawProduct[]> {
    const KEY = process.env.LOMADEE_API_KEY;
    if (!KEY) { ctx.log("warn", "Lomadee sem LOMADEE_API_KEY — pulando."); return []; }

    // 1) Marcas da conta (paginado) — o guard de pausa/canal mora aqui.
    const marcas = await this.listarMarcas(KEY, ctx);
    if (!marcas.length) return [];

    const out: RawProduct[] = [];
    for (const parceiro of LOMADEE_PARCEIROS) {
      if (out.length >= MAX_TOTAL) break;
      const marca = marcas.find((m) => parceiro.matchMarca.test(m.name));
      const canalOk = marca?.network?.active && (marca.channels?.[0]?.shortUrls?.length ?? 0) > 0;
      if (!marca || !canalOk) {
        ctx.log("warn", `Lomadee ${parceiro.nome}: fora da lista ou canal Comparador bloqueado — PULANDO (compliance).`);
        continue;
      }

      // 2) DADO: catálogo da loja (API pública da plataforma dela).
      let candidatos: Candidato[] = [];
      try {
        candidatos = await this.catalogoDaLoja(parceiro, ctx);
      } catch (e) {
        ctx.log("warn", `Lomadee ${parceiro.slug}: catálogo falhou: ${(e as Error).message}`);
        continue;
      }
      const cap = Math.min(parceiro.maxProdutos ?? MAX_POR_LOJA, MAX_TOTAL - out.length);
      candidatos = candidatos
        .filter((c) => c.titulo && c.urlProduto && c.imagemUrl && c.precoAtual > 0)
        .filter((c) => !contemTermoProibido(c.titulo))
        .filter((c) => !(parceiro.excluir?.test(c.titulo)))
        .slice(0, cap);

      // 3) DINHEIRO: cunha o link de afiliado por produto (throttle 60/min).
      const loja = {
        slug: parceiro.slug,
        nome: parceiro.nome,
        baseUrl: parceiro.baseUrl,
        logoUrl: lomadeeLogoUrl(marca.id),
      };
      let cunhados = 0, semLink = 0, foraDoCanal = 0;
      for (const c of candidatos) {
        const r = await this.cunharLink(KEY, c.urlProduto, marca.id);
        await this.sleep(THROTTLE_MS);
        if (!r) { semLink++; continue; } // sem link monetizado o produto NÃO entra
        // GUARDA de comissão: o link deve cair no canal do PromoDetec (LOMADEE_SOURCE_ID).
        if (CANAL_ESPERADO && r.canal && r.canal !== CANAL_ESPERADO) foraDoCanal++;
        cunhados++;
        out.push({
          skuLoja: `lmd-${parceiro.slug}-${c.skuBase}`.slice(0, 120),
          // WooCommerce devolve entidades HTML no nome (&#038; &#8211;) → decodifica
          titulo: decodeHtmlEntities(c.titulo).slice(0, 500),
          url: r.url,
          imagemUrl: c.imagemUrl,
          marca: c.marca ?? parceiro.nome,
          categoriaSlug: c.categoriaSlug,
          precoAtual: c.precoAtual,
          precoOriginal: c.precoOriginal,
          emEstoque: true,
          loja,
        });
      }
      if (foraDoCanal) ctx.log("warn", `Lomadee ${parceiro.slug}: ${foraDoCanal} link(s) FORA do canal esperado (${CANAL_ESPERADO}) — comissão pode não atribuir!`);
      ctx.log("info", `Lomadee ${parceiro.nome}: ${cunhados} produtos cunhados${semLink ? ` (${semLink} sem link — fora)` : ""}`);
    }

    ctx.log("info", `Lomadee: ${out.length} produtos no total`);
    return out;
  }

  private async listarMarcas(key: string, ctx: AdapterContext): Promise<MarcaLomadee[]> {
    const all: MarcaLomadee[] = [];
    try {
      for (let page = 1; page <= 7; page++) {
        const r = await fetch(`${BASE}/affiliate/brands?limit=100&page=${page}`, { headers: { "x-api-key": key } });
        if (!r.ok) { ctx.log("warn", `Lomadee brands: HTTP ${r.status}`); break; }
        const j = (await r.json()) as { data?: MarcaLomadee[] };
        const data = j.data ?? [];
        all.push(...data);
        if (!data.length) break;
      }
    } catch (e) { ctx.log("warn", `Lomadee brands falhou: ${(e as Error).message}`); }
    return all;
  }

  /** Cunha o link de afiliado; devolve a shortUrl + o canal em que caiu (p/ a
   *  guarda de comissão). O body NÃO leva sourceId: a API rejeita (400). */
  private async cunharLink(key: string, url: string, organizationId: string): Promise<{ url: string; canal: string | null } | null> {
    try {
      const r = await fetch(`${BASE}/affiliate/shortener/url`, {
        method: "POST",
        headers: { "x-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({ url, organizationId, type: "Custom" }),
      });
      if (r.status !== 201) return null;
      const j = (await r.json()) as Array<{ shortUrls?: string[]; availableChannel?: { id?: string } }>;
      const short = j?.[0]?.shortUrls?.[0];
      if (!short) return null;
      return { url: short, canal: j?.[0]?.availableChannel?.id ?? null };
    } catch { return null; }
  }

  private async catalogoDaLoja(p: LomadeeParceiro, ctx: AdapterContext): Promise<Candidato[]> {
    if (p.plataforma === "shopify") return this.catalogoShopify(p);
    if (p.plataforma === "woo") return this.catalogoWoo(p);
    return this.catalogoVtex(p, ctx);
  }

  /** Shopify: /products.json público, PAGINADO (?limit=250&page=N) até acabar. */
  private async catalogoShopify(p: LomadeeParceiro): Promise<Candidato[]> {
    interface ShopifyProduct {
      id: number; title?: string; handle?: string; vendor?: string;
      images?: Array<{ src?: string }>;
      variants?: Array<{ price?: string; compare_at_price?: string | null; available?: boolean }>;
    }
    const out: Candidato[] = [];
    const cap = p.maxProdutos ?? MAX_POR_LOJA;
    for (let page = 1; page <= 20 && out.length < cap; page++) {
      const j = await this.fetchJson<{ products?: ShopifyProduct[] }>(`${p.baseUrl}/products.json?limit=250&page=${page}`);
      const lote = j.products ?? [];
      if (!lote.length) break;
      for (const prod of lote) {
        const precos = (prod.variants ?? []).map((v) => Number(v.price)).filter((n) => Number.isFinite(n) && n > 0);
        const cheios = (prod.variants ?? []).map((v) => Number(v.compare_at_price)).filter((n) => Number.isFinite(n) && n > 0);
        const preco = precos.length ? Math.min(...precos) : NaN;
        if (!Number.isFinite(preco)) continue;
        const cheio = cheios.length ? Math.max(...cheios) : NaN;
        out.push({
          titulo: prod.title ?? "",
          urlProduto: `${p.baseUrl}/products/${prod.handle}`,
          imagemUrl: prod.images?.[0]?.src ?? null,
          precoAtual: preco,
          precoOriginal: Number.isFinite(cheio) && cheio > preco ? cheio : null,
          marca: prod.vendor || p.nome,
          categoriaSlug: p.categoria,
          skuBase: String(prod.id),
        });
      }
      if (lote.length < 250) break; // última página
      await this.sleep(300);
    }
    return out;
  }

  /** WooCommerce: Store API pública (/wp-json/wc/store/v1/products). */
  private async catalogoWoo(p: LomadeeParceiro): Promise<Candidato[]> {
    interface WooProduct {
      id: number; name?: string; permalink?: string;
      short_description?: string;
      is_in_stock?: boolean;
      images?: Array<{ src?: string }>;
      prices?: { price?: string; regular_price?: string; currency_minor_unit?: number };
    }
    const out: Candidato[] = [];
    const capPaginas = Math.ceil((p.maxProdutos ?? MAX_POR_LOJA) / 100);
    for (let page = 1; page <= Math.min(20, capPaginas) ; page++) {
      const lote = await this.fetchJson<WooProduct[]>(`${p.baseUrl}/wp-json/wc/store/v1/products?per_page=100&page=${page}`);
      if (!Array.isArray(lote) || !lote.length) break;
      for (const prod of lote) {
        if (prod.is_in_stock === false) continue;
        // kits B2B/atacado escondem o aviso na descrição — filtra nos dois campos
        if (p.excluir?.test(`${prod.name ?? ""} ${prod.short_description ?? ""}`)) continue;
        const divisor = 10 ** (prod.prices?.currency_minor_unit ?? 2);
        const preco = Number(prod.prices?.price) / divisor;
        const cheio = Number(prod.prices?.regular_price) / divisor;
        if (!Number.isFinite(preco) || preco <= 0) continue;
        out.push({
          titulo: prod.name ?? "",
          urlProduto: prod.permalink ?? "",
          imagemUrl: prod.images?.[0]?.src ?? null,
          precoAtual: preco,
          precoOriginal: Number.isFinite(cheio) && cheio > preco ? cheio : null,
          marca: p.nome,
          categoriaSlug: p.categoria,
          skuBase: String(prod.id),
        });
      }
      if (lote.length < 100) break;
    }
    return out;
  }

  /** VTEX: reusa o coletor genérico (busca por termo → categoria certa). */
  private async catalogoVtex(p: LomadeeParceiro, ctx: AdapterContext): Promise<Candidato[]> {
    const buscas = (p.buscasVtex ?? [{ termo: p.nome, slug: p.categoria }]).map((b) => ({ termo: b.termo, slug: b.slug }));
    const itens = await coletarVtex(p.baseUrl, buscas, { marca: p.nome, porTermo: 50, paginasPorTermo: 3, log: ctx.log });
    return itens.map((i) => ({
      titulo: i.titulo,
      urlProduto: i.url,
      imagemUrl: i.imagemUrl ?? null,
      precoAtual: i.precoAtual,
      precoOriginal: i.precoOriginal ?? null,
      marca: i.marca ?? p.nome,
      categoriaSlug: i.categoriaSlug,
      skuBase: i.skuLoja,
    }));
  }
}
