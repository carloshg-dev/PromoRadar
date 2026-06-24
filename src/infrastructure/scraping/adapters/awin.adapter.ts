import { gunzipSync } from "node:zlib";
import { StoreAdapter, type AdapterContext } from "@/infrastructure/scraping/core/adapter";
import type { RawProduct, CategoriaSlug } from "@/core/domain/types";

/**
 * Awin — feed de PRODUTOS oficial (formato Darwin/Google). Lê a URL Mestre de
 * Feeds (AWIN_DATAFEED_URL), acha os feeds dos nossos anunciantes e baixa o
 * catálogo (.csv.gz) com FOTO + PREÇO + link de afiliado PRONTO (aw_deep_link,
 * já com o publisher 2936727). Hoje só a AliExpress BR&LATAM (18879) expõe feed
 * pra nós (Carrefour/Doce Beleza/Sanavita não têm → ficam nas "Ofertas
 * verificadas"). Tudo vai pro bucket NEUTRO `ofertas-parceiros` (solto no feed).
 */

const FEEDLIST = process.env.AWIN_DATAFEED_URL;
const CAT: CategoriaSlug = "ofertas-parceiros";
const ALVOS = new Set(["17665", "18879", "76888", "117737", "78382"]); // advertiser ids aprovados (Carrefour, AliExpress, Doce Beleza, Sanavita, Panasonic)
const MAX_FEEDS = 4;       // nº de feeds baixados por rodada
const MAX_POR_FEED = 700;  // teto de produtos por feed
const MAX_TOTAL = 2500;    // teto geral (cabe no free tier; o feed mostra aleatório)

/** Parser CSV tolerante (aspas + vírgula dentro do campo + "" escapado). */
function parseCsvLinha(linha: string): string[] {
  const out: string[] = [];
  let cur = "", dentro = false;
  for (let i = 0; i < linha.length; i++) {
    const ch = linha[i];
    if (dentro) {
      if (ch === '"' && linha[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') dentro = false;
      else cur += ch;
    } else if (ch === '"') dentro = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

export class AwinAdapter extends StoreAdapter {
  readonly key = "awin" as const;
  readonly nome = "AliExpress";

  async coletar(ctx: AdapterContext): Promise<RawProduct[]> {
    if (!FEEDLIST) { ctx.log("warn", "Awin sem AWIN_DATAFEED_URL — pulando."); return []; }

    // 1) Lista mestra → feeds dos nossos anunciantes (col 0 advId, 5 feedId, 12 url).
    const feeds: Array<{ nome: string; fid: string; url: string }> = [];
    try {
      const lista = await this.fetchHtml(FEEDLIST);
      for (const ln of lista.split("\n")) {
        const c = ln.split('","').map((s) => s.replace(/^"|"$/g, ""));
        if (ALVOS.has(c[0] ?? "") && (c[12] ?? "").startsWith("http")) {
          feeds.push({ nome: c[1] ?? "", fid: c[5] ?? "", url: c[12]! });
        }
      }
    } catch (e) { ctx.log("warn", `Awin feedList falhou: ${(e as Error).message}`); return []; }
    ctx.log("info", `Awin: ${feeds.length} feeds dos nossos anunciantes`);

    const out: RawProduct[] = [];
    const vistos = new Set<string>();
    let nFeeds = 0;
    for (const f of feeds) {
      if (out.length >= MAX_TOTAL || nFeeds >= MAX_FEEDS) break;
      nFeeds++;
      try {
        const res = await fetch(f.url, { headers: { "User-Agent": this.UA } });
        if (!res.ok) { ctx.log("warn", `Awin feed ${f.fid}: HTTP ${res.status}`); continue; }
        const csv = gunzipSync(Buffer.from(await res.arrayBuffer())).toString("utf8");
        const linhas = csv.split("\n");
        const head = parseCsvLinha(linhas[0] ?? "").map((h) => h.trim());
        const ix = (n: string) => head.indexOf(n);
        const iNome = ix("product_name"), iLink = ix("aw_deep_link"),
          iImg = ix("aw_image_url"), iImg2 = ix("merchant_image_url"),
          iPreco = ix("search_price"), iOld = ix("product_price_old"),
          iMarca = ix("brand_name"), iMerch = ix("merchant_name"), iPid = ix("aw_product_id");
        if (iNome < 0 || iLink < 0 || iPreco < 0) { ctx.log("warn", `Awin feed ${f.fid}: colunas faltando`); continue; }

        let n = 0;
        for (let r = 1; r < linhas.length && n < MAX_POR_FEED && out.length < MAX_TOTAL; r++) {
          if (!linhas[r]?.trim()) continue;
          const row = parseCsvLinha(linhas[r]!);
          const nome = row[iNome]?.trim();
          const link = row[iLink]?.trim();
          const img = (row[iImg]?.trim() || (iImg2 >= 0 ? row[iImg2]?.trim() : "")) || "";
          const preco = Number(row[iPreco]);
          if (!nome || !link || !img || !Number.isFinite(preco) || preco <= 0) continue;
          const sku = `awin-${(iPid >= 0 ? row[iPid]?.trim() : "") || `${f.fid}-${r}`}`;
          if (vistos.has(sku)) continue;
          vistos.add(sku);
          const old = iOld >= 0 ? Number(row[iOld]) : NaN;
          out.push({
            skuLoja: sku,
            titulo: nome.slice(0, 500),
            url: link,
            imagemUrl: img,
            marca: (iMarca >= 0 && row[iMarca]?.trim()) || (iMerch >= 0 ? row[iMerch] ?? null : null) || "AliExpress",
            categoriaSlug: CAT,
            precoAtual: preco,
            precoOriginal: Number.isFinite(old) && old > preco ? old : null,
            emEstoque: true,
          });
          n++;
        }
        ctx.log("info", `Awin feed ${f.fid} (${f.nome}): ${n} produtos`);
        await this.sleep(800);
      } catch (e) { ctx.log("warn", `Awin feed ${f.fid} falhou: ${(e as Error).message}`); }
    }
    ctx.log("info", `Awin: ${out.length} produtos no total`);
    return out;
  }
}
