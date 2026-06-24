"use client";

import { useEffect, useRef } from "react";
import { track, type TrackPayload } from "./track";

/**
 * Dispara um evento de analytics uma vez quando a página monta. Renderizável
 * dentro de Server Components (páginas) para registrar views/buscas/categorias.
 */
export function TrackView({ tipo, ...payload }: { tipo: string } & TrackPayload) {
  const enviado = useRef(false);
  useEffect(() => {
    if (enviado.current) return;
    enviado.current = true;
    track(tipo, payload);
    // intencional: dispara só no mount. payload muda → nova montagem da rota.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
