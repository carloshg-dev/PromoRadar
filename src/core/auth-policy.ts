const PROTECTED = ["/admin", "/onboarding", "/alertas", "/conta"];

export function protectedPath(path: string): boolean {
  return PROTECTED.some((base) => path === base || path.startsWith(`${base}/`));
}

export function hasSessionCookie(cookies: { name: string; value: string }[]): boolean {
  return cookies.some(({ name, value }) => /^sb-.+-auth-token(?:\.\d+)?$/.test(name) && Boolean(value));
}
