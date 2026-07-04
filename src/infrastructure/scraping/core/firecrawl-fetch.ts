/**
 * Firecrawl — coleta hospedada (renderiza JS + fura anti-bot na infra deles).
 *
 * Por que existe: as lojas de browser (Terabyte/Amazon/Pichau) não rodam no cron
 * serverless da Vercel (sem Chromium). O Firecrawl resolve via HTTP: mandamos a
 * URL, ele devolve o HTML já renderizado — então o cron da Vercel passa a coletar
 * tudo sozinho, sem máquina local. Mesmo HTML dos parsers atuais (cheerio).
 *
 * Requer `FIRECRAWL_API_KEY` no ambiente. Tem custo de página no plano free, por
 * isso o cron usa o Firecrawl só para as lojas de browser e 1x/dia (ver cron).
 */

import type { PaginaColetada, ColetaOpts } from "@/infrastructure/scraping/core/browser-fetch";

const ENDPOINT = "https://api.firecrawl.dev/v2/scrape";
const CONCORRENCIA = 3;      // equilíbrio entre velocidade e rate-limit do free
const TENTATIVAS = 3;        // o free limita req/min → re-tenta com backoff

/**
 * CACHE do Firecrawl (`maxAge`, em ms) — é o "re-raspar só o que não foi visto
 * há X horas": se o Firecrawl já raspou a página dentro dessa janela, devolve a
 * versão em CACHE (instantânea + custo reduzido) em vez de raspar de novo. A
 * coleta diária (24h de intervalo > 12h) sempre pega FRESCO; disparos repetidos
 * (testes, re-dispatch) dentro da janela voltam do cache, blindando a cota.
 * Ajuste por FIRECRAWL_MAX_AGE_H (0 = sempre fresco, desliga o cache).
 */
const CACHE_MS = Math.max(0, Number(process.env.FIRECRAWL_MAX_AGE_H ?? 12)) * 3_600_000;

/**
 * Chaves do Firecrawl. Suporta VÁRIAS separadas por vírgula em FIRECRAWL_API_KEY
 * (ex: "fc-aaa,fc-bbb") → failover automático quando uma esgota a cota. Use
 * contas reais distintas (ex: a sua + a do dono); múltiplas contas só pra burlar
 * o limite violam o ToS do Firecrawl e arriscam banir todas de uma vez.
 */
export function firecrawlKeys(): string[] {
  const raw = process.env.FIRECRAWL_API_KEY ?? "";
  // As chaves têm o formato fc-XXXX. Extrair por esse padrão deixa o parser
  // tolerante a QUALQUER separador (vírgula, espaço, " - ", quebra de linha) —
  // sem confundir com o hífen que existe dentro das próprias chaves.
  const achadas = raw.match(/fc-[A-Za-z0-9]+/g);
  if (achadas?.length) return [...new Set(achadas)]; // dedup (mesma chave colada 2x)
  // Fallback p/ chaves fora do padrão fc-: separa por vírgula/espaço.
  return raw.split(/[,\s]+/).map((k) => k.trim()).filter(Boolean);
}

export function firecrawlConfigurado(): boolean {
  return firecrawlKeys().length > 0;
}

// Índice da chave "atual": começa em 0 e só avança quando a chave esgota a cota
// (402) ou é rejeitada (401/403). Sticky — dentro de uma coleta não volta à
// chave já esgotada, poupando chamadas.
let idxChave = 0;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface FirecrawlData { success?: boolean; data?: { html?: string; rawHtml?: string } }

/**
 * POST ao Firecrawl com failover entre chaves + retry com backoff por chave.
 * Em 402/401/403 (cota/credencial) avança para a próxima chave; em 429/5xx
 * re-tenta a mesma. Retorna o JSON da resposta ok, ou null com o último erro.
 */
async function firecrawlPost(body: object): Promise<{ data: FirecrawlData | null; erro: string }> {
  const keys = firecrawlKeys();
  if (!keys.length) throw new Error("FIRECRAWL_API_KEY ausente.");
  let ultimoErro = "?";
  for (let salto = 0; salto < keys.length; salto++) {
    const idx = (idxChave + salto) % keys.length;
    const key = keys[idx]!;
    for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          idxChave = idx; // fixa a chave que funcionou
          return { data: (await res.json()) as FirecrawlData, erro: "" };
        }
        ultimoErro = `http ${res.status}`;
        // cota/credencial → não adianta re-tentar esta chave; pula p/ a próxima
        if (res.status === 401 || res.status === 402 || res.status === 403) break;
        // 429/5xx → re-tenta a MESMA chave com backoff; outros 4xx → desiste
        if (res.status !== 429 && res.status < 500) return { data: null, erro: ultimoErro };
      } catch (e) {
        ultimoErro = (e as Error).message;
      }
      if (tentativa < TENTATIVAS) await sleep(tentativa * 3500); // backoff: 3.5s, 7s
    }
    if (keys.length > 1 && salto < keys.length - 1) idxChave = (idx + 1) % keys.length;
  }
  return { data: null, erro: ultimoErro };
}

async function scrapeUma(url: string, esperaPosCarga: number): Promise<PaginaColetada> {
  const { data, erro } = await firecrawlPost({
    // teto de 8s: lojas com anti-bot mais duro (ex: Loja do Mecânico/Radware)
    // precisam de mais tempo de render; as leves passam esperaPosCarga baixo.
    url, formats: ["html"], onlyMainContent: false,
    waitFor: Math.min(esperaPosCarga, 8000), timeout: 60000, location: { country: "BR" },
    // Cache do Firecrawl: página raspada há < CACHE_MS volta do cache (barato).
    ...(CACHE_MS > 0 ? { maxAge: CACHE_MS } : {}),
  });
  const html = data?.success ? (data.data?.html ?? data.data?.rawHtml ?? null) : null;
  return html ? { url, html } : { url, html: null, erro: `firecrawl ${erro || "sem html"}` };
}

/**
 * Recupera um endpoint JSON que exige fingerprint de navegador (ex: a API VTEX
 * do Max Titanium dá 403 a clientes HTTP, mas 200 a uma navegação de documento).
 * Pede rawHtml ao Firecrawl e extrai o array/objeto JSON do corpo.
 */
export async function coletarJsonViaFirecrawl(url: string): Promise<unknown | null> {
  const { data } = await firecrawlPost({
    url, formats: ["rawHtml"], onlyMainContent: false, timeout: 60000, location: { country: "BR" },
  });
  const corpo = data?.data?.rawHtml ?? data?.data?.html ?? "";
  return corpo ? extrairJson(corpo) : null;
}

/** Extrai JSON de um corpo que pode ser texto puro ou JSON embrulhado em HTML. */
export function extrairJson(corpo: string): unknown | null {
  const txt = corpo.trim();
  try { return JSON.parse(txt); } catch { /* não é JSON puro */ }
  // JSON dentro de <pre>…</pre> (visualizador do Chrome) ou de outro markup
  const m = txt.match(/[[{][\s\S]*[\]}]/);
  if (m) {
    const limpo = m[0].replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    try { return JSON.parse(limpo); } catch { /* desiste */ }
  }
  return null;
}

/** Coleta as URLs via Firecrawl, em lotes paralelos. Mesma assinatura de coletarPaginas. */
export async function coletarViaFirecrawl(urls: string[], opts: ColetaOpts = {}): Promise<PaginaColetada[]> {
  if (!firecrawlConfigurado()) throw new Error("FIRECRAWL_API_KEY ausente.");
  const espera = opts.esperaPosCarga ?? 3000;
  const out: PaginaColetada[] = new Array(urls.length);

  for (let i = 0; i < urls.length; i += CONCORRENCIA) {
    const lote = urls.slice(i, i + CONCORRENCIA);
    const res = await Promise.all(lote.map((u) => scrapeUma(u, espera)));
    res.forEach((r, k) => {
      out[i + k] = r;
      if (!r.html) opts.log?.("warn", `Firecrawl falhou em ${r.url}${r.erro ? ` (${r.erro})` : ""}`);
    });
  }
  return out;
}
