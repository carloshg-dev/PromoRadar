export function searchTerm(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, 80) : "";
}

export function titlePattern(value: string): string {
  return `%${searchTerm(value).replace(/[\\%_]/g, "\\$&")}%`;
}

export function pageNumber(value: unknown): number {
  const number = typeof value === "string" ? Number(value) : 1;
  return Number.isFinite(number) ? Math.min(1000, Math.max(1, Math.floor(number))) : 1;
}
