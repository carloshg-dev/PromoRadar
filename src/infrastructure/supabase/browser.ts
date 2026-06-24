"use client";
import { createBrowserClient } from "@supabase/ssr";

/** Cliente Supabase para Client Components (browser). Singleton. */
let _client: ReturnType<typeof createBrowserClient> | null = null;
export function createBrowserSupabase() {
  if (_client) return _client;
  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return _client;
}
