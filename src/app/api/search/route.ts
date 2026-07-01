import { NextResponse } from "next/server";
import { createServerSupabase } from "@/infrastructure/supabase/server";
import { ehLinkMonetizado } from "@/lib/afiliados";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ produtos: [] });
  const sb = createServerSupabase();
  const { data } = await sb
    .from("vw_ofertas")
    .select("id,titulo,loja_nome,preco_atual,promo_score,categoria_emoji,url")
    .ilike("titulo", `%${q}%`)
    .order("promo_score", { ascending: false, nullsFirst: false })
    .limit(40);

  // MONETIZADO PRIMEIRO: mesma regra do catálogo — a loja que paga comissão
  // aparece primeiro na busca, mesmo com nota menor.
  const produtos = (data ?? []).sort((a, b) => {
    const m = (ehLinkMonetizado(b.url) ? 1 : 0) - (ehLinkMonetizado(a.url) ? 1 : 0);
    return m !== 0 ? m : (b.promo_score ?? 0) - (a.promo_score ?? 0);
  }).slice(0, 8).map(({ url: _url, ...resto }) => resto); // url só serve p/ ordenar; não vaza pro cliente

  return NextResponse.json({ produtos });
}
