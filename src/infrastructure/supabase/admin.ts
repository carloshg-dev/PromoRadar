import { createClient } from "@supabase/supabase-js";

/**
 * Cliente administrativo (service_role) — SOMENTE no servidor (scrapers/cron).
 * Ignora RLS. Nunca importar em componentes client.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente — necessário p/ scrapers.");
  return createClient(url, key, { auth: { persistSession: false } });
}
