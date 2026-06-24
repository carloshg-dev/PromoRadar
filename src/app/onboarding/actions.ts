"use server";
import { createServerSupabase } from "@/infrastructure/supabase/server";
import { redirect } from "next/navigation";

export async function salvarInteresses(interesses: string[]) {
  const sb = createServerSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  await sb.from("usuarios")
    .update({ interesses, onboarding_completo: true })
    .eq("auth_id", user.id);
  redirect("/ofertas");
}
