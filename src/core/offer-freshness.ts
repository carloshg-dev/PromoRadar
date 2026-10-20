export const MAX_PRICE_AGE_DAYS = 7;
const MAX_AGE = MAX_PRICE_AGE_DAYS * 86_400_000;

export function recentPriceSince(now = Date.now()): string {
  return new Date(now - MAX_AGE).toISOString();
}

export function hasRecentPrice(updatedAt: string, now = Date.now()): boolean {
  const timestamp = Date.parse(updatedAt);
  return Number.isFinite(timestamp) && timestamp <= now && timestamp >= now - MAX_AGE;
}
