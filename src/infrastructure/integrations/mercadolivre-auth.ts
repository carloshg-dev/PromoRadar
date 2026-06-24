import { createAdminClient } from "@/infrastructure/supabase/admin";

const TOKEN_URL = "https://api.mercadolibre.com/oauth/token";

export const ML_REDIRECT_URI =
  process.env.ML_REDIRECT_URI ??
  "https://www.promodetec.com.br/api/auth/mercadolivre/callback";

interface MLToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id?: number;
}

/** Troca o `code` (do callback) por tokens e salva no banco. */
export async function trocarCodePorToken(code: string): Promise<void> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: process.env.ML_CLIENT_ID!,
    client_secret: process.env.ML_CLIENT_SECRET!,
    code,
    redirect_uri: ML_REDIRECT_URI,
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
  });
  if (!res.ok) throw new Error(`ML token ${res.status}: ${await res.text()}`);
  const t = (await res.json()) as MLToken;
  await salvar(t);
}

/** Retorna um access_token válido, renovando via refresh_token se necessário. */
export async function obterAccessTokenML(): Promise<string | null> {
  const sb = createAdminClient();
  const { data } = await sb.from("integracoes").select("*").eq("provider", "mercadolivre").maybeSingle();
  if (!data?.refresh_token) return null;

  const expirado = !data.expira_em || new Date(data.expira_em).getTime() < Date.now() + 60_000;
  if (!expirado && data.access_token) return data.access_token as string;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: process.env.ML_CLIENT_ID!,
    client_secret: process.env.ML_CLIENT_SECRET!,
    refresh_token: data.refresh_token as string,
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
  });
  if (!res.ok) return null;
  const t = (await res.json()) as MLToken;
  await salvar(t);
  return t.access_token;
}

/**
 * Token de aplicação via `client_credentials` (NÃO precisa de OAuth de usuário).
 *
 * Descoberta ao vivo: a busca antiga `/sites/MLB/search` morreu (403), mas a API
 * de CATÁLOGO (`/products/search`, `/products/{id}/items`) responde 200 com um
 * app token obtido só com client_id + client_secret. Cacheia em memória pelo TTL
 * (6h) p/ não pedir token a cada coleta.
 */
let appTokenCache: { token: string; expiraEm: number } | null = null;

export async function obterAppTokenML(): Promise<string | null> {
  if (appTokenCache && appTokenCache.expiraEm > Date.now() + 60_000) return appTokenCache.token;
  const id = process.env.ML_CLIENT_ID;
  const secret = process.env.ML_CLIENT_SECRET;
  if (!id || !secret) return null;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: id, client_secret: secret }),
  });
  if (!res.ok) return null;
  const t = (await res.json()) as MLToken;
  if (!t.access_token) return null;
  appTokenCache = { token: t.access_token, expiraEm: Date.now() + (t.expires_in ?? 21600) * 1000 };
  return t.access_token;
}

async function salvar(t: MLToken): Promise<void> {
  const sb = createAdminClient();
  await sb.from("integracoes").upsert({
    provider: "mercadolivre",
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    user_id_ext: t.user_id ? String(t.user_id) : null,
    expira_em: new Date(Date.now() + (t.expires_in ?? 21600) * 1000).toISOString(),
    atualizado_em: new Date().toISOString(),
  }, { onConflict: "provider" });
}
