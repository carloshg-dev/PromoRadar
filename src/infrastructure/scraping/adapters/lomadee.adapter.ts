import { StoreAdapter, type AdapterContext } from "@/infrastructure/scraping/core/adapter";
import type { RawProduct } from "@/core/domain/types";
import { lomadeeAffordableCandidates, shopifyAvailablePrice } from "@/core/lomadee-catalog";
import { decodeHtmlEntities } from "@/lib/utils";
import { LOMADEE_PARCEIROS, lomadeeLogoUrl, type LomadeeParceiro } from "@/core/lomadee-parceiros";
import { coletarVtex } from "@/infrastructure/scraping/core/vtex";
import { boundedJson } from "@/infrastructure/affiliates/http";
import { lomadeeBrands, lomadeeComparatorChannel, lomadeeComparatorLink } from "@/infrastructure/lomadee/api";

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
 * LOMADEE_SOURCE_ID legado identifica availableChannel.id (tipo). Também
 * aceitamos a instância response.id: resolvemos o tipo em uma única instância
 * da conta e exigimos essa instância no link cunhado. A API key escopa a conta;
 * o encurtador não aceita sourceId/channelId/source no body.
 */

function incomplete(ctx: AdapterContext, code: string) {
  if (!ctx.reportFailure) throw new Error(code);
  ctx.reportFailure(code);
}

interface MarcaLomadee {
  id: string;
  name: string;
  network?: { active?: boolean };
  channels?: unknown;
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
    const expectedChannel = process.env.LOMADEE_SOURCE_ID?.trim();

    // 1) Marcas da conta (paginado) — o guard de pausa/canal mora aqui.
    const marcas = await this.listarMarcas(KEY, ctx);
    if (!marcas.length) return [];

    const out: RawProduct[] = [];
    for (const parceiro of LOMADEE_PARCEIROS) {
      if (out.length >= MAX_TOTAL) break;
      const marca = marcas.find((m) => parceiro.matchMarca.test(m.name));
      const canalOk = marca?.network?.active && lomadeeComparatorLink(marca.channels);
      if (!marca || !canalOk) {
        ctx.log("warn", `Lomadee ${parceiro.nome}: fora da lista ou canal Comparador bloqueado — PULANDO (compliance).`);
        continue;
      }
      const configuredChannel = lomadeeComparatorChannel(marca.channels, expectedChannel);
      if (expectedChannel && !configuredChannel?.id) {
        incomplete(ctx, "lomadee_expected_channel_missing");
        ctx.log("warn", `Lomadee ${parceiro.nome}: canal esperado não validado; nenhuma URL será cunhada.`);
        continue;
      }

      // 2) DADO: catálogo da loja (API pública da plataforma dela).
      let candidatos: Candidato[] = [];
      try {
        candidatos = await this.catalogoDaLoja(parceiro, ctx);
      } catch {
        incomplete(ctx, "lomadee_catalog_failed");
        ctx.log("warn", `Lomadee ${parceiro.slug}: catálogo indisponível.`);
        continue;
      }
      const cap = Math.min(parceiro.maxProdutos ?? MAX_POR_LOJA, MAX_TOTAL - out.length);
      candidatos = lomadeeAffordableCandidates(candidatos, cap, parceiro.excluir);

      // 3) DINHEIRO: cunha o link de afiliado por produto (throttle 60/min).
      const loja = {
        slug: parceiro.slug,
        nome: parceiro.nome,
        baseUrl: parceiro.baseUrl,
        logoUrl: lomadeeLogoUrl(marca.id),
      };
      let cunhados = 0, semLink = 0;
      for (const c of candidatos) {
        const r = await this.cunharLink(KEY, c.urlProduto, marca.id, expectedChannel ? configuredChannel!.id! : undefined);
        await this.sleep(THROTTLE_MS);
        if (!r) { semLink++; continue; } // sem link monetizado o produto NÃO entra
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
      if (semLink) incomplete(ctx, "lomadee_affiliate_link_failed");
      ctx.log("info", `Lomadee ${parceiro.nome}: ${cunhados} produtos cunhados${semLink ? ` (${semLink} sem link — fora)` : ""}`);
    }

    ctx.log("info", `Lomadee: ${out.length} produtos no total`);
    return out;
  }

  private async listarMarcas(key: string, ctx: AdapterContext): Promise<MarcaLomadee[]> {
    const result = await lomadeeBrands(key, AbortSignal.timeout(60_000));
    if (result.status !== "ok") { incomplete(ctx, "lomadee_brands_incomplete"); ctx.log("warn", "Lomadee: leitura das marcas incompleta."); }
    return result.brands.filter(row => typeof row.id === "string" && typeof row.name === "string") as unknown as MarcaLomadee[];
  }

  /** Cunha o link de afiliado; devolve a shortUrl + o canal em que caiu (p/ a
   *  guarda de comissão). O body NÃO leva sourceId: a API rejeita (400). */
  private async cunharLink(key: string, url: string, organizationId: string, expectedChannelId?: string): Promise<{ url: string } | null> {
    try {
      const j = await boundedJson(`${BASE}/affiliate/shortener/url`, {
        method: "POST",
        headers: { "x-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({ url, organizationId, type: "Custom" }),
        signal: AbortSignal.timeout(15_000), redirect: "error",
      }) as Array<{ id?: string; shortUrls?: string[]; availableChannel?: { id?: string; name?: string } }>;
      const channel = lomadeeComparatorChannel(j, expectedChannelId);
      if (!channel || (expectedChannelId && channel.id !== expectedChannelId)) return null;
      return { url: channel.link };
    } catch { return null; }
  }

  private async catalogoDaLoja(p: LomadeeParceiro, ctx: AdapterContext): Promise<Candidato[]> {
    if (p.plataforma === "shopify") return this.catalogoShopify(p);
    if (p.plataforma === "woo") return this.catalogoWoo(p);
    return this.catalogoVtex(p, ctx);
  }

  /** Shopify: páginas pequenas e Top-N limitado, sem reter o catálogo inteiro. */
  private async catalogoShopify(p: LomadeeParceiro): Promise<Candidato[]> {
    interface ShopifyProduct {
      id: number; title?: string; handle?: string; vendor?: string;
      images?: Array<{ src?: string }>;
      variants?: Array<{ price?: string; compare_at_price?: string | null; available?: boolean }>;
    }
    const out: Candidato[] = [];
    const cap = Math.min(250, p.maxProdutos ?? MAX_POR_LOJA);
    for (let page = 1; page <= 8; page++) {
      const j = await boundedJson(`${p.baseUrl}/products.json?limit=100&page=${page}`) as { products?: ShopifyProduct[] };
      const lote = j.products ?? [];
      if (!Array.isArray(lote) || lote.length > 100) throw new Error("lomadee_shopify_schema");
      if (!lote.length) break;
      for (const prod of lote) {
        const price = shopifyAvailablePrice(prod.variants ?? []);
        if (!price || !prod.id || !prod.handle) continue;
        out.push({
          titulo: prod.title ?? "",
          urlProduto: `${p.baseUrl}/products/${prod.handle}`,
          imagemUrl: prod.images?.[0]?.src ?? null,
          ...price,
          marca: prod.vendor || p.nome,
          categoriaSlug: p.categoria,
          skuBase: String(prod.id),
        });
      }
      const selected = lomadeeAffordableCandidates(out, cap, p.excluir);
      out.splice(0, out.length, ...selected);
      if (lote.length < 100) break;
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
      prices?: { price?: string; regular_price?: string; currency_minor_unit?: number; currency_code?: string };
    }
    const out: Candidato[] = [];
    const capPaginas = Math.ceil(Math.min(250, p.maxProdutos ?? MAX_POR_LOJA) / 100);
    for (let page = 1; page <= Math.min(20, capPaginas) ; page++) {
      const lote = await boundedJson(`${p.baseUrl}/wp-json/wc/store/v1/products?per_page=100&page=${page}`) as WooProduct[];
      if (!Array.isArray(lote) || !lote.length) break;
      for (const prod of lote) {
        if (prod.is_in_stock !== true || prod.prices?.currency_code !== "BRL" || prod.prices.currency_minor_unit !== 2) continue;
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
    return itens.filter(i => i.emEstoque).map((i) => ({
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
