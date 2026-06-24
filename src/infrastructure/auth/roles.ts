import { createServerSupabase } from "@/infrastructure/supabase/server";
import { createAdminClient } from "@/infrastructure/supabase/admin";

/**
 * Hierarquia de acesso do PromoDetec (fonte da verdade: usuarios.role).
 * super_admin > admin > moderador > operador > user.
 * A coluna role só pode ser alterada via service_role (grants por coluna +
 * trigger trg_protege_privilegios no banco impedem escalação).
 */
export type Papel = "super_admin" | "admin" | "moderador" | "operador" | "user";

export const PAPEL_LABEL: Record<Papel, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  moderador: "Moderador",
  operador: "Operador",
  user: "Usuário",
};

/** Papel do usuário da sessão atual (cookies). Lê com service_role — independe de RLS. */
export async function papelAtual(): Promise<{ papel: Papel; email: string | null } | null> {
  const ssr = createServerSupabase();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("usuarios").select("role").eq("auth_id", user.id).maybeSingle();
  return { papel: ((data?.role as Papel) ?? "user"), email: user.email ?? null };
}

export function ehStaff(p?: Papel | null): boolean {
  return p === "super_admin" || p === "admin" || p === "moderador" || p === "operador";
}

/** Dispara coletas e mexe na operação. Moderador é só conteúdo. */
export function podeColetar(p?: Papel | null): boolean {
  return p === "super_admin" || p === "admin" || p === "operador";
}

/** Gestão de papéis de outros usuários (reservado ao Master). */
export function podeGerirEquipe(p?: Papel | null): boolean {
  return p === "super_admin";
}
