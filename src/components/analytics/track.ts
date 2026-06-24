export interface TrackPayload {
  termo?: string;
  produtoId?: string;
  lojaSlug?: string | null;
  categoriaSlug?: string | null;
  origem?: string;
}

/**
 * Envia um evento de analytics para /api/track sem bloquear a navegação
 * (sendBeacon; fallback fetch keepalive). Falha em silêncio — analytics nunca
 * pode atrapalhar o usuário. Device/geo são derivados no servidor.
 */
export function track(tipo: string, payload: TrackPayload = {}): void {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({ tipo, ...payload });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
    }
  } catch { /* silencioso */ }
}
