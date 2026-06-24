/**
 * Módulo de Notícias — coleta de feeds RSS de hardware/tecnologia (com imagem).
 *
 * Trocamos o Google News RSS (que não traz thumbnail e mistura assuntos) por
 * feeds curados de portais de tech brasileiros. Vantagens:
 *   • Thumbnail real por matéria (media:content / enclosure / <img> no conteúdo).
 *   • Conteúdo já alinhado ao interesse do site (hardware, GPU/CPU, lançamentos).
 * Além disso, aplicamos um FILTRO DE RELEVÂNCIA por palavra-chave: só entram
 * matérias que casam com os temas do PromoDetec, e elas já saem tagueadas.
 *
 * Parse sem dependências; deduplica por URL; grava em `noticias` (com imagem_url).
 */

import { createAdminClient } from "@/infrastructure/supabase/admin";
import { decodeHtmlEntities } from "@/lib/utils";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36";

/** Feeds curados (hardware/tech, com imagem). `fonte` é o portal de origem. */
const FEEDS: ReadonlyArray<{ url: string; fonte: string }> = [
  { url: "https://www.adrenaline.com.br/hardware/feed/", fonte: "Adrenaline" },
  { url: "https://www.adrenaline.com.br/feed/", fonte: "Adrenaline" },
  { url: "https://canaltech.com.br/rss/hardware/", fonte: "Canaltech" },
  { url: "https://canaltech.com.br/rss/", fonte: "Canaltech" },
];

/**
 * Filtro de relevância: cada tema tem um padrão; uma matéria só é coletada se
 * casar com ≥1 tema (mantém o feed no "ambiente de interesse" do site). As tags
 * que casaram são salvas com a notícia.
 */
const TEMAS: ReadonlyArray<{ tag: string; re: RegExp }> = [
  { tag: "gpu", re: /placa de v[ií]deo|\bgpu\b|geforce|radeon|\brtx\b|\brx ?\d|nvidia|intel arc|\barc\b/i },
  { tag: "cpu", re: /processador|\bcpu\b|ryzen|intel core|threadripper|core i\d|core ultra/i },
  { tag: "armazenamento", re: /\bssd\b|\bnvme\b|armazenamento|\bhd\b/i },
  { tag: "memoria", re: /mem[óo]ria|ddr[45]|\bram\b/i },
  { tag: "monitores", re: /\bmonitor/i },
  { tag: "notebooks", re: /\bnotebook|laptop|ultrabook/i },
  { tag: "fontes", re: /\bfonte\b|\bpsu\b/i },
  { tag: "placas-mae", re: /placa[ -]?m[ãa]e|motherboard|chipset/i },
  { tag: "ia", re: /intelig[êe]ncia artificial|\bia\b|chatgpt|openai|\bgpt\b|copilot|gemini/i },
  { tag: "hardware", re: /hardware|pc gamer|gabinete|water ?cooler|overclock|benchmark|\bplaca\b|refrigera/i },
  { tag: "ofertas", re: /oferta|desconto|promo[çc][ãa]o|\bpre[çc]o|black friday|cupom/i },
];

function classificar(texto: string): string[] {
  const tags: string[] = [];
  for (const t of TEMAS) if (t.re.test(texto)) tags.push(t.tag);
  return tags;
}

interface NoticiaRaw {
  titulo: string; url: string; fonte: string; resumo: string | null;
  publicado_em: string | null; tags: string[]; imagem_url: string | null;
}

function decode(s: string): string {
  return decodeHtmlEntities(
    s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, " "),
  )
    .replace(/<[^>]+>/g, " ") // tags que vieram codificadas (&lt;p&gt;…) caem aqui
    .replace(/\s+/g, " ").trim();
}

function pegar(tag: string, bloco: string): string {
  const m = bloco.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? m[1]! : "";
}

/** Extrai a thumbnail do item: media:content/thumbnail, enclosure ou 1ª <img>. */
function extrairImagem(bloco: string): string | null {
  const mc =
    bloco.match(/<media:content[^>]+url="([^"]+)"[^>]*(?:medium="image"|type="image)/i) ||
    bloco.match(/<media:content[^>]+url="([^"]+\.(?:jpe?g|png|webp|gif)[^"]*)"/i) ||
    bloco.match(/<media:thumbnail[^>]+url="([^"]+)"/i) ||
    bloco.match(/<enclosure[^>]+url="([^"]+)"[^>]*type="image/i);
  if (mc?.[1]) return mc[1];

  // <img> dentro de content:encoded ou description (pode vir HTML-encoded)
  const html = decodeHtmlEntities(pegar("content:encoded", bloco) || pegar("description", bloco));
  const im = html.match(/<img[^>]+src="([^"]+)"/i);
  if (im?.[1] && /^https?:\/\//.test(im[1])) return im[1];
  return null;
}

function parseFeed(xml: string, fonte: string): NoticiaRaw[] {
  const itens = xml.split(/<item[ >]/i).slice(1).map((b) => b.split(/<\/item>/i)[0] ?? "");
  const out: NoticiaRaw[] = [];
  for (const bloco of itens) {
    const titulo = decode(pegar("title", bloco));
    const url = decode(pegar("link", bloco)) || decode(pegar("guid", bloco));
    if (!titulo || !/^https?:\/\//.test(url)) continue;

    const resumo = decode(pegar("description", bloco)).slice(0, 300) || null;
    const tags = classificar(`${titulo} ${resumo ?? ""}`);
    if (tags.length === 0) continue; // fora do interesse do site → descarta

    const pub = pegar("pubDate", bloco).trim();
    const publicado_em = pub ? safeDate(pub) : null;
    out.push({
      titulo: titulo.slice(0, 300), url, fonte, resumo,
      publicado_em, tags, imagem_url: extrairImagem(bloco),
    });
  }
  return out;
}

function safeDate(s: string): string | null {
  const t = Date.parse(s);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

async function buscarFeed(url: string, fonte: string): Promise<NoticiaRaw[]> {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, */*" },
    });
    if (!res.ok) throw new Error(`RSS ${res.status}`);
    return parseFeed(await res.text(), fonte);
  } finally {
    clearTimeout(to);
  }
}

export interface NewsResult { coletadas: number; salvas: number; erros: number; comImagem: number }

export async function coletarNoticias(): Promise<NewsResult> {
  const sb = createAdminClient();
  const r: NewsResult = { coletadas: 0, salvas: 0, erros: 0, comImagem: 0 };
  const vistos = new Set<string>();

  for (const feed of FEEDS) {
    try {
      const itens = await buscarFeed(feed.url, feed.fonte);
      r.coletadas += itens.length;
      for (const n of itens) {
        if (vistos.has(n.url)) continue;
        vistos.add(n.url);
        const { error } = await sb.from("noticias").upsert({
          fonte: n.fonte, titulo: n.titulo, resumo: n.resumo, url: n.url,
          imagem_url: n.imagem_url, publicado_em: n.publicado_em, tags: n.tags,
        }, { onConflict: "url" });
        if (!error) { r.salvas++; if (n.imagem_url) r.comImagem++; }
      }
    } catch {
      r.erros++;
    }
  }
  return r;
}
