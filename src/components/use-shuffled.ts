"use client";
import { useEffect, useState } from "react";

function fisherYates<T>(a: readonly T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j]!, r[i]!];
  }
  return r;
}

/**
 * DINAMISMO DA HOME (F5 vivo) sem matar o Supabase. O servidor manda um POOL
 * grande (150-200, cacheado por ISR → 1 query a cada 5 min); ESTE hook sorteia
 * um subconjunto de `n` NO CLIENTE a cada mount. Cada F5 mostra uma vitrine
 * diferente do mesmo arsenal, sem nenhuma query extra.
 *
 * Anti-hydration-mismatch: 1º render usa a ordem do servidor (idêntica ao SSR,
 * sem Math.random no server → sem warning/flash); o embaralho só roda no
 * useEffect (client), DEPOIS da hidratação.
 */
export function useShuffled<T>(pool: T[], n: number): T[] {
  const [itens, setItens] = useState<T[]>(() => pool.slice(0, n));
  useEffect(() => {
    setItens(fisherYates(pool).slice(0, n));
  }, [pool, n]);
  return itens;
}
