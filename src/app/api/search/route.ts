import { NextResponse } from "next/server";
import { createServerSupabase } from "@/infrastructure/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ produtos: [] });
  const sb = createServerSupabase();
  const { data } = await sb
    .from("vw_ofertas")
    .select("id,titulo,loja_nome,preco_atual,promo_score,categoria_emoji")
    .ilike("titulo", `%${q}%`)
    .order("promo_score", { ascending: false, nullsFirst: false })
    .limit(8);
  return NextResponse.json({ produtos: data ?? [] });
}
