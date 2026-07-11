import { gunzipSync } from "node:zlib";
import { StoreAdapter, type AdapterContext } from "@/infrastructure/scraping/core/adapter";
import type { RawProduct } from "@/core/domain/types";
import { contemTermoProibido } from "@/core/blacklist-nicho";
import { anunciantesDoAdapter, awinLogoUrl } from "@/core/awin-anunciantes";

/**
 * Awin — feed de PRODUTOS oficial (formato Darwin), agora MULTI-LOJA. Lê a URL
 * Mestre de Feeds (AWIN_DATAFEED_URL), agrupa os feeds POR ANUNCIANTE aprovado
 * (fonte única: src/core/awin-anunciantes.ts) e emite cada produto com a
 * IDENTIDADE da própria loja (slug/nome/logo) — o collection.service cria a
 * loja no banco na 1ª aparição. Links já vêm monetizados (aw_deep_link com o
 * publisher), com FOTO + PREÇO.
 *
 * • Diesel (17846) fica FORA daqui de propósito (ingestao: "cron-proprio"):
 *   scripts/ingest-awin-diesel.js já cuida dela — incluir aqui = ingestão DUPLA.
 * • Anunciante aprovado SEM feed no feedList é normal (nem todo advertiser expõe
 *   datafeed) — é logado e segue monetizando só pelo wrapper de deeplink.
 * • Preço: o que o cliente paga = MENOR entre search_price/rrp_price/
 *   product_price_old (o feed Diesel ensinou que as colunas podem vir INVERTIDAS);
 *   o maior vira o "De". parseMoeda aceita "999.00" e "799,00" no mesmo feed.
 */

// Tetos por rodada — env-configuráveis p/ escalar SEM estourar (a) o egress do
// Supabase free e (b) o TIMEOUT de 45 min do job (cada produto = round-trips ao
// banco cross-region). 5000 ≈ 25-30 min, margem segura; subir além disso exige
// job próprio ou timeout maior (o 7000 estourou os 45 min em 03/07). O dono
// afina via AWIN_MAX_TOTAL / AWIN_MAX_POR_ANUNCIANTE.
// 8000 (era 5000): o teto global processado EM ORDEM matava de fome as lojas do
// fim do array (Dufrio etc.) — a AliExpress sozinha comia 2000. O job Awin tem
// 90min, cabe. Fix estrutural (fatia justa por loja) fica no roadmap.
const MAX_TOTAL = Number(process.env.AWIN_MAX_TOTAL) || 8000;
const MAX_FEEDS_PADRAO = Number(process.env.AWIN_MAX_FEEDS) || 3;
const MAX_POR_ANUNCIANTE = Number(process.env.AWIN_MAX_POR_ANUNCIANTE) || 900;

/** Câmbio p/ feeds que não vêm em real (a AliExpress costuma vir em USD). Sem isto,
 *  "US$ 3" virava "R$ 3" na vitrine (bug real). Configurável por env; default conservador. */
const TAXAS_FX: Record<string, number> = {
  BRL: 1,
  USD: Number(process.env.AWIN_FX_USD) || 5.4,
  EUR: Number(process.env.AWIN_FX_EUR) || 5.9,
};

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

/** Preço robusto: "1.234,56" (BR), "999.00" (ponto) e "799,00" no MESMO feed. */
function parseMoeda(v: string | null | undefined): number {
  if (v == null) return NaN;
  const s = String(v).trim().replace(/[^\d.,]/g, "");
  if (!s) return NaN;
  const norm = /,\d{1,2}$/.test(s) ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  const n = Number(norm);
  return Number.isFinite(n) ? n : NaN;
}

export class AwinAdapter extends StoreAdapter {
  readonly key = "awin" as const;
  readonly nome = "Awin"; // fallback de exibição — cada item carrega a própria loja

  async coletar(ctx: AdapterContext): Promise<RawProduct[]> {
    // Lê em RUNTIME (não no topo do módulo): no runner local, o dotenv carrega o
    // .env.local DEPOIS dos imports, então um const no topo pegava `undefined`.
    const FEEDLIST = process.env.AWIN_DATAFEED_URL;
    if (!FEEDLIST) { ctx.log("warn", "Awin sem AWIN_DATAFEED_URL — pulando."); return []; }

    const alvos = anunciantesDoAdapter(); // mid → anunciante (Diesel fora: cron próprio)

    // 1) Lista mestra → feeds POR anunciante (col 0 advId, 5 feedId, 12 url).
    const feedsPorMid = new Map<string, Array<{ fid: string; url: string }>>();
    try {
      const lista = await this.fetchHtml(FEEDLIST);
      for (const ln of lista.split("\n")) {
        const c = ln.split('","').map((s) => s.replace(/^"|"$/g, ""));
        const mid = c[0] ?? "";
        if (alvos.has(mid) && (c[12] ?? "").startsWith("http")) {
          if (!feedsPorMid.has(mid)) feedsPorMid.set(mid, []);
          feedsPorMid.get(mid)!.push({ fid: c[5] ?? "", url: c[12]! });
        }
      }
    } catch (e) { ctx.log("warn", `Awin feedList falhou: ${(e as Error).message}`); return []; }

    const semFeed = [...alvos.entries()].filter(([mid]) => !feedsPorMid.has(mid)).map(([, a]) => a.nome);
    ctx.log("info", `Awin: ${feedsPorMid.size}/${alvos.size} anunciantes com datafeed`);
    if (semFeed.length) ctx.log("info", `Awin sem datafeed (seguem só no wrapper de link): ${semFeed.join(", ")}`);

    const out: RawProduct[] = [];
    const vistos = new Set<string>();

    for (const [mid, anunciante] of alvos) {
      if (out.length >= MAX_TOTAL) break;
      const feeds = feedsPorMid.get(mid) ?? [];
      if (!feeds.length) continue;

      const capProdutos = anunciante.maxProdutos ?? MAX_POR_ANUNCIANTE;
      const capFeeds = anunciante.maxFeeds ?? MAX_FEEDS_PADRAO;
      const loja = {
        slug: anunciante.slug,
        nome: anunciante.nome,
        baseUrl: anunciante.baseUrl,
        logoUrl: awinLogoUrl(mid),
      };
      let n = 0;

      for (const f of feeds.slice(0, capFeeds)) {
        if (n >= capProdutos || out.length >= MAX_TOTAL) break;
        try {
          const res = await fetch(f.url, { headers: { "User-Agent": this.UA } });
          if (!res.ok) { ctx.log("warn", `Awin ${anunciante.slug} feed ${f.fid}: HTTP ${res.status}`); continue; }
          const csv = gunzipSync(Buffer.from(await res.arrayBuffer())).toString("utf8");
          const linhas = csv.split("\n");
          const head = parseCsvLinha(linhas[0] ?? "").map((h) => h.trim());
          const ix = (nomeCol: string) => head.indexOf(nomeCol);
          const iNome = ix("product_name"), iLink = ix("aw_deep_link"),
            iImg = ix("aw_image_url"), iImg2 = ix("merchant_image_url"),
            iPreco = ix("search_price"), iRrp = ix("rrp_price"), iOld = ix("product_price_old"),
            iCur = ix("currency"), iMarca = ix("brand_name"), iMerch = ix("merchant_name"),
            iPid = ix("aw_product_id");
          if (iNome < 0 || iLink < 0 || iPreco < 0) { ctx.log("warn", `Awin ${anunciante.slug} feed ${f.fid}: colunas faltando`); continue; }

          for (let r = 1; r < linhas.length && n < capProdutos && out.length < MAX_TOTAL; r++) {
            if (!linhas[r]?.trim()) continue;
            const row = parseCsvLinha(linhas[r]!);
            const nome = row[iNome]?.trim();
            const link = row[iLink]?.trim();
            // Imagem DIRETA do lojista primeiro: o proxy da Awin (productserve)
            // devolve GIF-placeholder quando o CDN de origem o bloqueia (caso
            // real: Extra e Ponto Frio = vitrine cega). O CDN aceita browsers.
            const img = ((iImg2 >= 0 ? row[iImg2]?.trim() : "") || row[iImg]?.trim()) || "";
            // Moeda fora do mapa → descarta (melhor sem produto do que com preço errado).
            const moeda = (iCur >= 0 ? row[iCur]?.trim().toUpperCase() : "") || "BRL";
            const fx = TAXAS_FX[moeda];
            if (!fx) continue;
            // O que o cliente PAGA = MENOR candidato; o "De" = maior (colunas podem
            // vir invertidas entre anunciantes — caso Diesel).
            const cand = [iPreco, iRrp, iOld]
              .filter((i) => i >= 0)
              .map((i) => parseMoeda(row[i]) * fx)
              .filter((v) => Number.isFinite(v) && v > 0);
            const preco = cand.length ? Math.min(...cand) : NaN;
            if (!nome || !link || !img || !Number.isFinite(preco) || preco <= 0) continue;
            // BLACKLIST DE NICHO (módulo isolado): feeds também trazem lixo B2B de
            // infraestrutura de telecom — fora do público. Descarta silencioso.
            if (contemTermoProibido(nome)) continue;
            const sku = `awin-${(iPid >= 0 ? row[iPid]?.trim() : "") || `${f.fid}-${r}`}`;
            const dedupKey = `${anunciante.slug}:${sku}`;
            if (vistos.has(dedupKey)) continue;
            vistos.add(dedupKey);
            const maxc = cand.length ? Math.max(...cand) : NaN;
            out.push({
              skuLoja: sku,
              titulo: nome.slice(0, 500),
              url: link,
              imagemUrl: img,
              marca: (iMarca >= 0 && row[iMarca]?.trim()) || (iMerch >= 0 ? row[iMerch] ?? null : null) || anunciante.nome,
              categoriaSlug: anunciante.categoria,
              precoAtual: preco,
              precoOriginal: Number.isFinite(maxc) && maxc > preco ? maxc : null,
              emEstoque: true,
              loja,
            });
            n++;
          }
          await this.sleep(600);
        } catch (e) { ctx.log("warn", `Awin ${anunciante.slug} feed ${f.fid} falhou: ${(e as Error).message}`); }
      }
      if (n) ctx.log("info", `Awin ${anunciante.nome}: ${n} produtos (${Math.min(feeds.length, capFeeds)}/${feeds.length} feeds)`);
    }

    ctx.log("info", `Awin: ${out.length} produtos no total`);
    return out;
  }
}
