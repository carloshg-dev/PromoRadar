/** Fila por render, com cancelamento também para quem ainda aguarda uma vaga. */
export function limitedFetch(fetcher: typeof fetch): typeof fetch {
  let active = 0;
  const queue: (() => void)[] = [];
  return async (input, init) => {
    const signal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
    await new Promise<void>((resolve, reject) => {
      const abort = () => {
        const index = queue.indexOf(start);
        if (index >= 0) queue.splice(index, 1);
        reject(new DOMException("Aborted", "AbortError"));
      };
      const start = () => {
        signal?.removeEventListener("abort", abort);
        active++;
        resolve();
      };
      if (signal?.aborted) { abort(); return; }
      if (active < 4) start();
      else { queue.push(start); signal?.addEventListener("abort", abort, { once: true }); }
    });
    try {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      return await fetcher(input, init);
    } finally {
      active--;
      queue.shift()?.();
    }
  };
}
