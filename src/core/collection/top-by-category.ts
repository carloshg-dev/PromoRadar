/** Seleção exata com heap: só os N melhores de cada categoria ficam na RAM. */
export function selectTopByCategory<T>(items: Iterable<T>, limit: number, categories: readonly string[], category: (item: T) => string, compare: (a: T, b: T) => number) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 5000) throw new Error("selection_invalid_limit");
  type Entry = { value: T; order: number };
  const rank = (a: Entry, b: Entry) => compare(a.value, b.value) || a.order - b.order;
  const buckets = new Map(categories.map((slug) => [slug, { candidates: 0, heap: [] as Entry[] }]));
  let order = 0;
  for (const value of items) {
    const item = { value, order: order++ };
    const bucket = buckets.get(category(value));
    if (!bucket) throw new Error("selection_unknown_category");
    bucket.candidates++;
    const heap = bucket.heap;
    if (heap.length < limit) {
      heap.push(item);
      let index = heap.length - 1;
      while (index > 0) {
        const parent = Math.floor((index - 1) / 2);
        if (rank(heap[index]!, heap[parent]!) <= 0) break;
        [heap[index], heap[parent]] = [heap[parent]!, heap[index]!];
        index = parent;
      }
    } else if (rank(item, heap[0]!) < 0) {
      heap[0] = item;
      let index = 0;
      while (true) {
        const left = index * 2 + 1, right = left + 1;
        if (left >= heap.length) break;
        const worse = right < heap.length && rank(heap[right]!, heap[left]!) > 0 ? right : left;
        if (rank(heap[index]!, heap[worse]!) >= 0) break;
        [heap[index], heap[worse]] = [heap[worse]!, heap[index]!];
        index = worse;
      }
    }
  }
  return {
    items: [...buckets.values()].flatMap(({ heap }) => heap.sort(rank).map((entry) => entry.value)),
    stats: new Map([...buckets].filter(([, bucket]) => bucket.candidates).map(([slug, bucket]) => [slug, {
      candidatos: bucket.candidates, mantidos: bucket.heap.length, cortados: bucket.candidates - bucket.heap.length,
    }])),
  };
}
