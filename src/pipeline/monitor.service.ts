/**
 * SERVIÇO MONITOR — observabilidade mínima e útil (tempo, memória, status,
 * resultado) por etapa. Hoje loga estruturado no stdout (o Action/Oracle
 * capturam); vira tabela `pipeline_execucoes` no dia em que precisarmos de
 * histórico consultável — não antes (evita complexidade sem benefício).
 */
export async function comObservabilidade<T>(nome: string, fn: () => Promise<T>): Promise<T> {
  const t0 = Date.now();
  try {
    const r = await fn();
    const mem = (process.memoryUsage().heapUsed / 1e6).toFixed(0);
    console.log(`[monitor] ${nome}: OK · ${Date.now() - t0}ms · heap ${mem}MB · ${JSON.stringify(r)}`);
    return r;
  } catch (e) {
    console.error(`[monitor] ${nome}: FALHOU · ${Date.now() - t0}ms · ${(e as Error).message}`);
    throw e;
  }
}
