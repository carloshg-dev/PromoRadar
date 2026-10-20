import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSessionCookie, protectedPath } from "@/core/auth-policy";

export async function refreshSession(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const protectedRoute = protectedPath(path);
  const hasCookie = hasSessionCookie(req.cookies.getAll());
  // Visitante anônimo em rota pública não precisa consultar o serviço de Auth.
  if (!hasCookie && !protectedRoute) return NextResponse.next();
  let response = NextResponse.next({ request: req });
  let authenticated = false;
  if (hasCookie) {
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll(cookies: { name: string; value: string; options: CookieOptions }[]) {
          cookies.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({ request: req });
          cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    // Cookie presente não é autorização: a identidade continua validada no servidor.
    const { data: { user } } = await supabase.auth.getUser();
    authenticated = Boolean(user);
  }
  if (protectedRoute && !authenticated) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", path);
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }
  return response;
}
