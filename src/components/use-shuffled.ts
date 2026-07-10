"use client";
import { useMemo } from "react";

/**
 * Fisher-Yates shuffle — versão CLIENT-SIDE. Roda no mount (useMemo sem deps
 * estáveis), garantindo que cada visita/F5 do usuário veja uma ordem diferente
 * mesmo quando o HTML do servidor está cacheado pelo ISR (revalidate = 300s).
 *
 * Recebe o pool completo e devolve `n` itens embaralhados.
 */
export function useShuffled<T>(pool: T[], n: number): T[] {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- seed aleatória intencional no mount
  return useMemo(() => {
    const arr = [...pool];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i]!; arr[i] = arr[j]!; arr[j] = t;
    }
    return arr.slice(0, n);
  }, [pool.length, n]);
}
