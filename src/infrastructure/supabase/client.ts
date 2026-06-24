import { createClient } from "@supabase/supabase-js";

/** Cliente público (browser/SSR) — usa a chave publishable, respeita RLS. */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env (public) ausente.");
  return createClient(url, key, { auth: { persistSession: false } });
}
