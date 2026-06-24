import { NextResponse } from "next/server";
import { createServerSupabase } from "@/infrastructure/supabase/server";
import { createAdminClient } from "@/infrastructure/supabase/admin";
import { notificarNovoUsuario } from "@/infrastructure/notify/owner";

/** Avisa o dono se este login é de um cadastro recém-criado (≤5 min). Lê com
 *  service_role (independe de RLS). Nunca derruba o fluxo de login. */
async function avisarSeNovoUsuario(authId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: perfil } = await admin
      .from("usuarios").select("nome,email,criado_via,criado_em").eq("auth_id", authId).maybeSingle();
    if (!perfil?.criado_em) return;
    const idadeMs = Date.now() - new Date(perfil.criado_em as string).getTime();
    if (idadeMs > 5 * 60 * 1000) return; // não é novo (re-login) → não avisa
    const { count } = await admin.from("usuarios").select("id", { count: "exact", head: true });
    await notificarNovoUsuario({
      nome: perfil.nome as string | null,
      email: perfil.email as string | null,
      via: perfil.criado_via as string | null,
      totalUsuarios: count ?? null,
    });
  } catch { /* aviso nunca quebra o login */ }
}

/** Troca o code do OAuth/magic-link por sessão e redireciona. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  if (code) {
    const supabase = createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Decide destino: onboarding se ainda não completou
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await avisarSeNovoUsuario(user.id); // avisa o dono se for cadastro novo
        const { data: perfil } = await supabase
          .from("usuarios").select("onboarding_completo").eq("auth_id", user.id).maybeSingle();
        if (!perfil?.onboarding_completo) return NextResponse.redirect(`${origin}/onboarding`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?erro=auth`);
}
