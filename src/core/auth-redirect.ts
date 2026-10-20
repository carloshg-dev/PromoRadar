const INTERNAL_ORIGIN = "https://promodetec.invalid";

/** `next` chega pela URL pública; roteador e callback aceitam apenas caminho interno. */
export function safeAuthDestination(value: string | null | undefined): string {
  if (!value || value.length > 2_048 || !value.startsWith("/") || value.startsWith("//")
    || /[\\\u0000-\u001f\u007f]/.test(value)) return "/";
  try {
    const target = new URL(value, INTERNAL_ORIGIN);
    if (target.origin !== INTERNAL_ORIGIN || target.pathname.startsWith("//")) return "/";
    return target.pathname + target.search + target.hash;
  } catch { return "/"; }
}
