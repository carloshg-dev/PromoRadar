export function validFeedUrl(value: string): boolean {
  if (value.length > 8192) return false;
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password; }
  catch { return false; }
}
