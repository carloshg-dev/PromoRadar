/**
 * Bright Data Web Unlocker — busca páginas furando proteção anti-bot.
 * Usado pelos adapters de lojas que bloqueiam scraping direto (Pichau, Terabyte, ML).
 *
 * Requer no ambiente:
 *   BRIGHTDATA_API_KEY        (Control Panel > Account Settings)
 *   BRIGHTDATA_UNLOCKER_ZONE  (nome da zona Web Unlocker)
 */

const ENDPOINT = "https://api.brightdata.com/request";

export function brightConfigurado(): boolean {
  return Boolean(process.env.BRIGHTDATA_API_KEY && process.env.BRIGHTDATA_UNLOCKER_ZONE);
}

export interface BrightOpts {
  /** "markdown" devolve texto limpo; undefined devolve HTML cru. */
  dataFormat?: "markdown";
  country?: string; // ex: "br"
}

export async function brightFetch(url: string, opts: BrightOpts = {}): Promise<string> {
  const key = process.env.BRIGHTDATA_API_KEY;
  const zone = process.env.BRIGHTDATA_UNLOCKER_ZONE;
  if (!key || !zone) throw new Error("Bright Data não configurado (BRIGHTDATA_API_KEY / BRIGHTDATA_UNLOCKER_ZONE).");

  const body: Record<string, unknown> = { zone, url, format: "raw", country: opts.country ?? "br" };
  if (opts.dataFormat) body.data_format = opts.dataFormat;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Bright Data ${res.status}: ${await res.text()}`);
  return await res.text();
}
