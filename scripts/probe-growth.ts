/* Sonda a Growth com browser real (passa o paredão JS "noc"). Uso:
 *   npx tsx scripts/probe-growth.ts            → home: lista links de categoria
 *   npx tsx scripts/probe-growth.ts <url>      → listagem: estrutura dos cards
 */
import "dotenv/config";
import { coletarPaginas } from "../src/infrastructure/scraping/core/browser-fetch";
import * as cheerio from "cheerio";

const alvo = process.argv[2] ?? "https://www.gsuplementos.com.br/";

async function main() {
  const [pg] = await coletarPaginas([alvo], {
    log: (n, m) => console.log(`[${n}] ${m}`),
    esperaPosCarga: 12000,
    rolagens: 6,
  });
  if (!pg?.html) { console.log("SEM HTML", pg?.erro); return; }
  const html = pg.html;
  require("node:fs").writeFileSync("C:/tmp-growth.html", html);
  console.log("bytes:", html.length, "| noc-wall:", html.includes("Verifying your browser"));
  const $ = cheerio.load(html);

  if (alvo.endsWith(".br/") || alvo.endsWith(".br")) {
    // home → links internos candidatos a categoria
    const links = new Set<string>();
    $("a[href]").each((_, a) => {
      const h = $(a).attr("href") ?? "";
      const m = h.match(/^(?:https?:\/\/www\.gsuplementos\.com\.br)?\/([a-z0-9-]{3,40})\/?$/i);
      if (m?.[1]) links.add(m[1]);
    });
    console.log("links raiz:", [...links].sort().join(", "));
  } else if (process.argv[3] === "precos") {
    // varre folhas com "R$" fora do menu e mostra classe própria + do card ancestral com <a>
    const vistos = new Map<string, number>();
    $("*").each((_, el) => {
      const $el = $(el);
      if ($el.children().length > 0) return;
      const t = $el.text().trim();
      if (!t.startsWith("R$") || t.length > 20) return;
      if ($el.parents().toArray().some((p) => /sub[Mm]enu|header|nav-|navbar/.test($(p).attr("class") ?? ""))) return;
      const cls = ($el.attr("class") ?? $el.parent().attr("class") ?? "?").slice(0, 70);
      vistos.set(cls, (vistos.get(cls) ?? 0) + 1);
    });
    for (const [k, n] of [...vistos.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`  preco[${n}x] class: ${k}`);
    // pega o 1º preço fora do menu e mostra o card em volta
    const alvoEl = $("*").toArray().find((el) => {
      const $el = $(el);
      return $el.children().length === 0 && $el.text().trim().startsWith("R$") &&
        !$el.parents().toArray().some((p) => /sub[Mm]enu|header|nav-|navbar/.test($(p).attr("class") ?? ""));
    });
    if (alvoEl) {
      const $card = $(alvoEl).closest("li, article, [class*='card'], [class*='item'], [class*='product'], [class*='spot']");
      console.log("card class:", ($card.attr("class") ?? "?").slice(0, 100));
      const $a = $card.find("a[href]").first();
      console.log("href:", ($a.attr("href") ?? "?").slice(0, 100));
      const img = $card.find("img").first();
      console.log("img alt:", (img.attr("alt") ?? "").slice(0, 70), "| src?", Boolean(img.attr("src") ?? img.attr("data-src")));
      console.log("textos R$:", $card.find("*").toArray().map((e) => $(e).children().length === 0 ? $(e).text().trim() : "").filter((t) => t.startsWith("R$")).slice(0, 4).join(" || "));
    }
  } else {
    // listagem → âncoras de produto reais (slug termina em -pNNNNNN)
    const hrefs = new Set<string>();
    $("a[href]").each((_, a) => {
      const h = $(a).attr("href") ?? "";
      if (/-p\d{4,}\/?$/i.test(h)) hrefs.add(h);
    });
    console.log("ancoras -pNNNN:", hrefs.size);
    // de quais containers essas âncoras vêm? (menu × grade de produtos)
    const porContainer = new Map<string, number>();
    $("a[href]").each((_, a) => {
      const h = $(a).attr("href") ?? "";
      if (!/-p\d{4,}\/?$/i.test(h)) return;
      const anc = $(a).parents().toArray().map((p) => $(p).attr("class") ?? "").filter(Boolean);
      const chave = (anc.find((c) => /sub[Mm]enu|menu|header|nav/.test(c)) ? "MENU" : anc[1] ?? anc[0] ?? "?").slice(0, 90);
      porContainer.set(chave, (porContainer.get(chave) ?? 0) + 1);
    });
    for (const [k, n] of porContainer) console.log(`  container[${n}x]: ${k}`);
    // primeiro card FORA do menu
    const primeiro = $("a[href]").toArray().map((a) => $(a)).find(($a) => {
      const h = $a.attr("href") ?? "";
      if (!/-p\d{4,}\/?$/i.test(h)) return false;
      return !$a.parents().toArray().some((p) => /sub[Mm]enu|header|nav/.test($(p).attr("class") ?? ""));
    })?.attr("href");
    if (primeiro) {
      const $a = $(`a[href="${primeiro}"]`).first();
      const $card = $a.closest("li, article, div[class*='item'], div[class*='card'], div[class*='product']");
      const alvo = $card.length ? $card : $a.parent().parent();
      console.log("card tag:", alvo.prop("tagName"), "class:", (alvo.attr("class") ?? "").slice(0, 120));
      alvo.find("*").each((_, el) => {
        const t = $(el).children().length === 0 ? $(el).text().trim() : "";
        const cls = $(el).attr("class") ?? "";
        if ((t && (t.includes("R$") || t.length > 25)) || /price|preco|nome|name|title/i.test(cls)) {
          console.log(`  <${$(el).prop("tagName")}> class="${cls.slice(0, 80)}" txt="${t.slice(0, 70)}"`);
        }
      });
      const img = alvo.find("img").first();
      console.log("  img src:", (img.attr("src") ?? img.attr("data-src") ?? "").slice(0, 90), "| alt:", (img.attr("alt") ?? "").slice(0, 60));
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
