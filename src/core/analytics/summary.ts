import { EVENT_TYPES, safeSearchTerm } from "./events";

export interface EventRow {
  id: number | string; tipo: string; termo: string | null; produto_id: string | null;
  categoria_slug: string | null; dispositivo: string | null;
}

export function movementAccumulator() {
  const counts: Record<string, number> = Object.fromEntries(EVENT_TYPES.map((type) => [type, 0]));
  const terms = new Map<string, number>(), categories = new Map<string, number>(), products = new Map<string, number>();
  let total = 0, mobile = 0, desktop = 0, rankingLimited = false;
  const bump = (map: Map<string, number>, key: string | null | undefined, max: number) => {
    if (!key) return;
    if (!map.has(key) && map.size >= max) { rankingLimited = true; return; }
    map.set(key, (map.get(key) ?? 0) + 1);
  };
  return {
    add(row: EventRow) {
      total++;
      if (Object.hasOwn(counts, row.tipo)) counts[row.tipo] = (counts[row.tipo] ?? 0) + 1;
      else counts.outros = (counts.outros ?? 0) + 1;
      if (row.dispositivo === "mobile") mobile++;
      if (row.dispositivo === "desktop") desktop++;
      if (row.tipo === "busca") bump(terms, row.termo ? safeSearchTerm(row.termo)?.toLocaleLowerCase("pt-BR") : null, 500);
      if (row.tipo === "ver_categoria" && row.categoria_slug && /^[a-z0-9-]{1,60}$/.test(row.categoria_slug)) bump(categories, row.categoria_slug, 100);
      if (row.tipo === "ver_produto") bump(products, row.produto_id, 1000);
    },
    result() {
      const top = (map: Map<string, number>, n: number): [string, number][] => [...map].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n);
      return { totalEventos: total, counts, mobile, desktop, topBuscas: top(terms, 8), topCategorias: top(categories, 6), topProdutoIds: top(products, 5), rankingLimited };
    },
  };
}
