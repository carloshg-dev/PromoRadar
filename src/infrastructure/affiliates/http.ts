/** Limita cada página antes do parse e respeita o orçamento total do coletor. */
export async function boundedJson(url: string, init: RequestInit = {}): Promise<unknown> {
  const timeout = AbortSignal.timeout(20_000);
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  const response = await fetch(url, { ...init, redirect: "error", signal });
  if (!response.ok || !response.body) {
    await response.body?.cancel();
    throw new Error(`affiliate_http_${response.status}`);
  }
  const reader = response.body.getReader(), decoder = new TextDecoder();
  let bytes = 0, text = "";
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > 2 * 1024 * 1024) throw new Error("affiliate_response_limit");
      text += decoder.decode(part.value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally { await reader.cancel(); reader.releaseLock(); }
}

export function affiliateError(error: unknown): string {
  return error instanceof Error && /^[a-z0-9_]+$/.test(error.message) ? error.message : "read_failed";
}
