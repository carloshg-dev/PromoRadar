import { Readable } from "node:stream";
import { StoreAdapter, type AdapterContext } from "@/infrastructure/scraping/core/adapter";
import { readCsvRows } from "@/infrastructure/scraping/core/csv-stream";
import type { RawProduct } from "@/core/domain/types";
import { contemTermoProibido } from "@/core/blacklist-nicho";
import { anunciantesDoAdapter, awinLogoUrl } from "@/core/awin-anunciantes";
import { validFeedUrl } from "@/core/collection/feed-url";
import { awinPrice } from "@/core/collection/awin-price";
import { validProductImage } from "@/core/catalog-policy";

/** Feeds oficiais por anunciante; Diesel permanece no cron próprio. */
function limitEnv(name: string, fallback: number, max: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 1 ? Math.min(max, Math.floor(value)) : fallback;
}

export class AwinAdapter extends StoreAdapter {
  readonly key = "awin" as const;
  readonly nome = "Awin";

  async coletar(ctx: AdapterContext): Promise<RawProduct[]> {
    const feedList = process.env.AWIN_DATAFEED_URL;
    if (!feedList) { ctx.log("warn", "Awin sem AWIN_DATAFEED_URL — pulando."); return []; }
    const alvos = anunciantesDoAdapter();
    const maxTotal = limitEnv("AWIN_MAX_TOTAL", 8000, 20_000);
    const maxFeeds = limitEnv("AWIN_MAX_FEEDS", 3, 20);
    const maxPorAnunciante = limitEnv("AWIN_MAX_POR_ANUNCIANTE", 900, maxTotal);
    const failure = (code: string) => { if (ctx.reportFailure) ctx.reportFailure(code); else throw new Error(code); };
    const feedsPorMid = new Map<string, { fid: string; url: string }[]>();
    try {
      const response = await fetch(feedList, { headers: { "User-Agent": this.UA }, signal: AbortSignal.timeout(120_000) });
      if (!response.ok || !response.body) { await response.body?.cancel(); throw new Error("awin_feedlist_http_failed"); }
      await readCsvRows(Readable.fromWeb(response.body as never), (row) => {
        const mid = row["0"] ?? "";
        if (alvos.has(mid) && /^https?:\/\//.test(row["12"] ?? "")) {
          if (!feedsPorMid.has(mid)) feedsPorMid.set(mid, []);
          const cap = Math.min(20, alvos.get(mid)?.maxFeeds ?? maxFeeds);
          if (feedsPorMid.get(mid)!.length < cap) feedsPorMid.get(mid)!.push({ fid: row["5"] ?? "", url: row["12"]! });
        }
      }, { indexed: true });
    } catch { failure("awin_feedlist_read_failed"); return []; }

    const semFeed = [...alvos.entries()].filter(([mid]) => !feedsPorMid.has(mid)).map(([, advertiser]) => advertiser.nome);
    ctx.log("info", `Awin: ${feedsPorMid.size}/${alvos.size} anunciantes com datafeed`);
    if (semFeed.length) ctx.log("info", `Awin sem datafeed: ${semFeed.join(", ")}`);
    const out: RawProduct[] = [];
    const vistos = new Set<string>();
    for (const [mid, advertiser] of alvos) {
      if (out.length >= maxTotal) break;
      const feeds = feedsPorMid.get(mid) ?? [];
      if (!feeds.length) continue;
      const capProdutos = Math.min(maxTotal, advertiser.maxProdutos ?? maxPorAnunciante);
      const capFeeds = Math.min(20, advertiser.maxFeeds ?? maxFeeds);
      const loja = { slug: advertiser.slug, nome: advertiser.nome, baseUrl: advertiser.baseUrl, logoUrl: awinLogoUrl(mid) };
      let count = 0;
      for (const feed of feeds.slice(0, capFeeds)) {
        if (count >= capProdutos || out.length >= maxTotal) break;
        try {
          const response = await fetch(feed.url, { headers: { "User-Agent": this.UA }, signal: AbortSignal.timeout(120_000) });
          if (!response.ok || !response.body) { await response.body?.cancel(); throw new Error("awin_feed_http_failed"); }
          let rowNumber = 0;
          await readCsvRows(Readable.fromWeb(response.body as never), (row) => {
            rowNumber++;
            const nome = row.product_name?.trim(), link = row.aw_deep_link?.trim();
            // Imagem direta do lojista primeiro; o proxy Awin pode responder placeholder.
            const image = [row.merchant_image_url, row.aw_image_url].map(value => value?.trim()).find(validProductImage) ?? "";
            const price = awinPrice(row, advertiser.moedaPadrao);
            if (!nome || !link || !validFeedUrl(link) || !validFeedUrl(image) || !price || contemTermoProibido(nome)) return;
            const sku = `awin-${row.aw_product_id?.trim() || `${feed.fid}-${rowNumber}`}`;
            const dedupKey = `${advertiser.slug}:${sku}`;
            if (vistos.has(dedupKey)) return;
            vistos.add(dedupKey);
            out.push({ skuLoja: sku, titulo: nome.slice(0, 500), url: link, imagemUrl: image,
              marca: row.brand_name?.trim() || row.merchant_name || advertiser.nome,
              categoriaSlug: advertiser.categoria, precoAtual: price.current,
              precoOriginal: price.reference, emEstoque: true, loja });
            count++;
            if (count >= capProdutos || out.length >= maxTotal) return false;
          }, { required: ["product_name", "aw_deep_link", "search_price"] });
          await this.sleep(600);
        } catch { failure(`awin_feed_read_failed:${advertiser.slug}`); }
      }
      if (count) ctx.log("info", `Awin ${advertiser.nome}: ${count} produtos (${Math.min(feeds.length, capFeeds)}/${feeds.length} feeds)`);
    }
    ctx.log("info", `Awin: ${out.length} produtos no total`);
    return out;
  }
}
