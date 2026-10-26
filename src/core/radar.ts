export interface RadarItem { id: string; titulo: string }
export const RADAR_LIMIT = 30;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseRadar(raw: string | null): RadarItem[] {
  if (!raw || raw.length > 30_000) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    const seen = new Set<string>();
    const items: RadarItem[] = [];
    for (const row of data.slice(0, RADAR_LIMIT)) {
      if (!row || typeof row !== "object" || typeof row.id !== "string" || !UUID.test(row.id)
        || typeof row.titulo !== "string" || seen.has(row.id)) continue;
      seen.add(row.id);
      items.push({ id: row.id, titulo: row.titulo.slice(0, 180) });
    }
    return items;
  } catch { return []; }
}

export function toggleRadar(items: RadarItem[], item: RadarItem): { items: RadarItem[]; action: "saved" | "removed" | "full" } {
  if (items.some((row) => row.id === item.id)) return { items: items.filter((row) => row.id !== item.id), action: "removed" };
  if (items.length >= RADAR_LIMIT) return { items, action: "full" };
  return { items: [{ id: item.id, titulo: item.titulo.slice(0, 180) }, ...items], action: "saved" };
}
