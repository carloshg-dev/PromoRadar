export { refreshSession as middleware } from "@/infrastructure/supabase/middleware";

// Ambos os pontos de entrada usam a mesma política de sessão.
export const config = {
  matcher: ["/((?!_next/static|_next/image|api/track|api/search|r/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|txt|xml)$).*)"],
};
