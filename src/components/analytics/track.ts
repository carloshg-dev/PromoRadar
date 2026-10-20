import { eventSchema, type AnalyticsEvent, type EventType, type TrackPayload } from "@/core/analytics/events";
import { hasAnalyticsConsent } from "./consent";
export type { TrackPayload } from "@/core/analytics/events";

let pending: AnalyticsEvent[] = [];
let timer: ReturnType<typeof setTimeout> | undefined;
let listening = false;

function flush(): void {
  clearTimeout(timer);
  timer = undefined;
  if (!hasAnalyticsConsent()) { pending = []; return; }
  if (!pending.length) return;
  const body = JSON.stringify({ consent: "accepted", events: pending.splice(0, 20) });
  try {
    const sent = navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }));
    if (!sent) void fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
  } catch { /* A medição não pode impedir uma ação. */ }
}

/** Lote curto e limitado: nenhuma identidade, IP ou conteúdo de formulário. */
export function track(tipo: EventType, payload: TrackPayload = {}): void {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return;
  if (process.env.NODE_ENV !== "production" || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)) return;
  const parsed = eventSchema.safeParse({ tipo, ...payload });
  if (!parsed.success) return;
  if (!listening) {
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
    window.addEventListener("pd-consent-change", () => { if (!hasAnalyticsConsent()) pending = []; });
    listening = true;
  }
  const bytes = new TextEncoder().encode(JSON.stringify({ consent: "accepted", events: [...pending, parsed.data] })).byteLength;
  if (bytes > 7_000) flush();
  pending.push(parsed.data);
  if (pending.length >= 20) flush();
  else if (!timer) timer = setTimeout(flush, 800);
}
