type Chromium = typeof import("playwright")["chromium"];

/**
 * Carrega o browser somente em processos Node que executam os scrapers.
 * O build do Cloudflare substitui este modulo por playwright-disabled.ts.
 */
export async function carregarChromium(): Promise<Chromium | null> {
  try {
    const modulo = await import("playwright");
    return modulo.chromium ?? null;
  } catch {
    return null;
  }
}
