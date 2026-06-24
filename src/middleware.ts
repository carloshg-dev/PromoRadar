import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Mantém a sessão viva: Server Components não conseguem regravar cookies,
 * então é o middleware que renova o token (Google/e-mail) antes de expirar.
 * Sem isso, sessões caducam ~1h depois do login até o usuário tocar numa
 * rota que escreva cookies.
 */
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(toSet: CookieToSet[]) {
          toSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          toSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    },
  );

  await supabase.auth.getUser();
  return res;
}

export const config = {
  // Estáticos e rotas de máquina ficam fora (latência à toa).
  matcher: ["/((?!_next/static|_next/image|api/cron|r/|.*\\.(?:png|ico|svg|jpg|jpeg|webp|webmanifest|txt)$).*)"],
};
