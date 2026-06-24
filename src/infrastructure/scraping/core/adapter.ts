/**
 * Scraper Core — contrato base de todos os adapters.
 *
 * Cada loja implementa um StoreAdapter independente. Se um adapter quebra,
 * o runner isola a falha e os demais continuam (ver collection.service).
 *
 * Diretriz do projeto: preferir endpoints JSON internos a scraping de HTML.
 * O helper `fetchJson` existe para isso; `fetchHtml` é o fallback.
 */

import type { RawProduct, AdapterKey } from "@/core/domain/types";

export interface AdapterContext {
  log: (nivel: "info" | "warn" | "error", msg: string) => void;
}

export abstract class StoreAdapter {
  abstract readonly key: AdapterKey;
  abstract readonly nome: string;

  /** Coleta e devolve produtos normalizados. Lança em falha irrecuperável. */
  abstract coletar(ctx: AdapterContext): Promise<RawProduct[]>;

  protected readonly UA =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

  protected async fetchJson<T = unknown>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
      ...init,
      headers: {
        "User-Agent": this.UA,
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "pt-BR,pt;q=0.9",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
    return (await res.json()) as T;
  }

  protected async fetchHtml(url: string, init?: RequestInit): Promise<string> {
    const res = await fetch(url, {
      ...init,
      headers: {
        "User-Agent": this.UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
    return await res.text();
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}

/** Converte string de preço BR ("R$ 1.234,56") em número, ignorando parcelamento. */
export function parsePrecoBR(texto: string): number | null {
  if (!texto) return null;
  // Remove trechos de parcelamento ("12x", "em até 10x") antes de extrair o valor.
  const limpo = texto.replace(/\d+\s*x/gi, " ");
  const m = limpo.match(/(\d{1,3}(?:\.\d{3})*|\d+),(\d{2})/);
  if (!m) return null;
  const num = `${m[1]!.replace(/\./g, "")}.${m[2]}`;
  const v = Number(num);
  return Number.isFinite(v) && v > 0 ? v : null;
}
