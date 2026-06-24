/**
 * Browser fetch — coleta páginas protegidas por desafio JS do Cloudflare
 * ("Just a moment…"/"Um momento…") usando um Chromium headless real.
 *
 * Por que existe: lojas como Terabyte/Pichau respondem 403 a `fetch` HTTP puro
 * (o desafio do Cloudflare exige executar JavaScript). Um browser real resolve o
 * desafio naturalmente — sem proxy pago. Descobertas que moldam a estratégia:
 *
 *   • Reusar o MESMO contexto em navegações rápidas faz o Cloudflare re-desafiar
 *     com um challenge mais duro que o headless não resolve. Por isso usamos um
 *     CONTEXTO NOVO por página (cookies cf limpos a cada vez) + intervalo educado.
 *   • É preciso ESPERAR o desafio limpar (o título deixa de ser "…momento…").
 *
 * Restrição de ambiente: Chromium NÃO roda no cron serverless da Vercel (sem
 * binário de browser). Estes adapters rodam LOCALMENTE ou em um runner próprio
 * (ex: GitHub Actions, VPS) via `npm run scrape`. Em produção serverless o
 * import dinâmico do Playwright falha e o adapter degrada para `[]` (o
 * collection.service isola a falha sem derrubar os demais).
 *
 * O `playwright` é uma devDependency: capacidade de coleta local, não de runtime
 * de produção. O import é dinâmico para não entrar no bundle das funções Vercel.
 */

import { coletarViaFirecrawl, coletarJsonViaFirecrawl, extrairJson, firecrawlConfigurado } from "@/infrastructure/scraping/core/firecrawl-fetch";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/** Título/markup típico de página ainda presa no desafio do Cloudflare. */
function emDesafio(titulo: string): boolean {
  return /momento|moment/i.test(titulo);
}

export interface PaginaColetada {
  url: string;
  html: string | null;
  erro?: string;
}

export interface ColetaOpts {
  /** ms a esperar após o desafio limpar, p/ a página assentar. Default 3000. */
  esperaPosCarga?: number;
  /** ms entre páginas (ritmo educado p/ não re-disparar o anti-bot). Default 4000. */
  intervaloEntre?: number;
  /** timeout de navegação por página. Default 45000. */
  timeoutNav?: number;
  /** tentativas de poll do desafio (2s cada). Default 12 (~24s). */
  tentativasDesafio?: number;
  /** nº de rolagens até o fim (p/ páginas com lazy-load, ex: home). Default 0. */
  rolagens?: number;
  log?: (nivel: "info" | "warn" | "error", msg: string) => void;
}

/**
 * Carrega cada URL em um contexto headless novo, espera o desafio do Cloudflare
 * limpar e devolve o HTML final. Falhas por página não interrompem as demais.
 * Lança apenas se o Playwright/Chromium não estiver disponível no ambiente.
 */
export async function coletarPaginas(
  urls: string[],
  opts: ColetaOpts = {},
): Promise<PaginaColetada[]> {
  const {
    esperaPosCarga = 3000,
    intervaloEntre = 4000,
    timeoutNav = 45000,
    tentativasDesafio = 12,
    rolagens = 0,
    log = () => {},
  } = opts;

  // Usa Firecrawl (HTTP) quando não há browser confiável: serverless (Vercel) ou
  // CI (GitHub Actions, via SCRAPE_VIA_FIRECRAWL=1, p/ não depender de IP residencial).
  // Local, mantém o Playwright (sem custo de página).
  if (firecrawlConfigurado() && (process.env.VERCEL || process.env.SCRAPE_VIA_FIRECRAWL === "1")) {
    log("info", "coleta via Firecrawl");
    return coletarViaFirecrawl(urls, opts);
  }

  // Import dinâmico: mantém o Playwright fora do bundle das funções serverless
  // e permite degradar onde o browser não existe (cai p/ Firecrawl se houver chave).
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    if (firecrawlConfigurado()) {
      log("info", "Playwright indisponível; usando Firecrawl.");
      return coletarViaFirecrawl(urls, opts);
    }
    throw new Error(
      "Playwright indisponível e sem FIRECRAWL_API_KEY (coleta via browser só roda local/runner, ou configure o Firecrawl).",
    );
  }

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });

  const out: PaginaColetada[] = [];
  try {
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]!;
      // Contexto NOVO por página: cookies cf limpos → o primeiro acesso resolve
      // o desafio. Reusar contexto em sequência rápida re-dispara o anti-bot.
      const ctx = await browser.newContext({
        userAgent: UA,
        locale: "pt-BR",
        viewport: { width: 1366, height: 768 },
      });
      // Mascara o sinal mais óbvio de automação.
      await ctx.addInitScript(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => undefined });
      });
      const page = await ctx.newPage();
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutNav });
        let limpou = false;
        for (let t = 0; t < tentativasDesafio; t++) {
          if (!emDesafio(await page.title())) {
            limpou = true;
            break;
          }
          await page.waitForTimeout(2000);
        }
        if (!limpou) {
          out.push({ url, html: null, erro: "desafio anti-bot não resolvido" });
          log("warn", `desafio não resolvido em ${url}`);
        } else {
          await page.waitForTimeout(esperaPosCarga);
          for (let r = 0; r < rolagens; r++) {
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await page.waitForTimeout(1500);
          }
          out.push({ url, html: await page.content() });
        }
      } catch (e) {
        out.push({ url, html: null, erro: (e as Error).message });
        log("warn", `falha em ${url}: ${(e as Error).message}`);
      } finally {
        await ctx.close();
      }
      if (i < urls.length - 1) await new Promise((r) => setTimeout(r, intervaloEntre));
    }
  } finally {
    await browser.close();
  }
  return out;
}

/**
 * Recupera endpoints JSON que exigem fingerprint de NAVEGADOR (não de cliente
 * HTTP). Caso real: a API VTEX do Max Titanium responde 200 a `curl`/navegação
 * de documento, mas 403 ao `fetch` do Node (undici) e até ao `fetch` interno do
 * Chromium — só a NAVEGAÇÃO de documento passa. Por isso `page.goto` na própria
 * URL da API + `innerText` (JSON limpo), e não um fetch.
 *
 * Local → Playwright; CI/serverless → Firecrawl (rawHtml). Falha vira null por
 * URL, sem derrubar as demais.
 */
export async function coletarJson(urls: string[], opts: ColetaOpts = {}): Promise<Array<unknown | null>> {
  const { timeoutNav = 45000, intervaloEntre = 2500, log = () => {} } = opts;

  if (firecrawlConfigurado() && (process.env.VERCEL || process.env.SCRAPE_VIA_FIRECRAWL === "1")) {
    log("info", "coleta JSON via Firecrawl");
    const out: Array<unknown | null> = [];
    for (const u of urls) {
      try { out.push(await coletarJsonViaFirecrawl(u)); }
      catch (e) { out.push(null); log("warn", `Firecrawl JSON falhou em ${u}: ${(e as Error).message}`); }
    }
    return out;
  }

  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    if (firecrawlConfigurado()) {
      log("info", "Playwright indisponível; JSON via Firecrawl.");
      const out: Array<unknown | null> = [];
      for (const u of urls) { try { out.push(await coletarJsonViaFirecrawl(u)); } catch { out.push(null); } }
      return out;
    }
    throw new Error("Playwright indisponível e sem FIRECRAWL_API_KEY p/ coleta JSON.");
  }

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });
  const out: Array<unknown | null> = [];
  try {
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]!;
      const ctx = await browser.newContext({ userAgent: UA, locale: "pt-BR", viewport: { width: 1366, height: 768 } });
      await ctx.addInitScript(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => undefined });
      });
      const page = await ctx.newPage();
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutNav });
        // espera curta p/ eventual desafio cf e materialização do corpo
        for (let t = 0; t < 8 && emDesafio(await page.title()); t++) await page.waitForTimeout(2000);
        const txt = await page.evaluate(() => document.body.innerText);
        out.push(extrairJson(txt));
      } catch (e) {
        out.push(null);
        log("warn", `falha JSON em ${url}: ${(e as Error).message}`);
      } finally {
        await ctx.close();
      }
      if (i < urls.length - 1) await new Promise((r) => setTimeout(r, intervaloEntre));
    }
  } finally {
    await browser.close();
  }
  return out;
}
