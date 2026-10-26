"use client";

import { useEffect, useRef } from "react";
import { track, type TrackPayload } from "./track";
import type { EventType } from "@/core/analytics/events";
import { hasAnalyticsConsent, CONSENT_EVENT } from "./consent";

/**
 * Dispara um evento de analytics uma vez quando a página monta. Renderizável
 * dentro de Server Components (páginas) para registrar views/buscas/categorias.
 */
export function TrackView({ tipo, ...payload }: { tipo: EventType } & TrackPayload) {
  const enviado = useRef("");
  const signature = JSON.stringify({ tipo, ...payload });
  useEffect(() => {
    const send = () => {
      if (!hasAnalyticsConsent() || enviado.current === signature) return;
      enviado.current = signature;
      track(tipo, payload);
    };
    send();
    window.addEventListener(CONSENT_EVENT, send);
    return () => window.removeEventListener(CONSENT_EVENT, send);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);
  return null;
}
