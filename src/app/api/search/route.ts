import { NextResponse } from "next/server";
import { createPublicClient } from "@/infrastructure/supabase/client";
import { ehLinkMonetizado } from "@/lib/afiliados";
import { searchTerm, titlePattern } from "@/core/search";
import { recentPriceSince } from "@/core/offer-freshness";
import { UNVERIFIED_BRL_STORES } from "@/core/catalog-policy";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = searchTerm(new URL(req.url).searchParams.get("q"));
  if (q.length < 2) return NextResponse.json({ produtos: [] });
  const now = Date.now();
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("vw_ofertas")
    .select("id,titulo,loja_nome,preco_atual,promo_score,categoria_emoji,url")
    .eq("em_estoque", true)
    .not("loja_slug", "in", `(${UNVERIFIED_BRL_STORES.join(",")})`)
    .gt("preco_atual", 0)
    .gte("atualizado_em", recentPriceSince(now))
    .lte("atualizado_em", new Date(now).toISOString())
    .ilike("titulo", titlePattern(q))
    .order("promo_score", { ascending: false, nullsFirst: false })
    .limit(40)
    .abortSignal(AbortSignal.timeout(5_000));
  if (error) return NextResponse.json({ produtos: [], error: "search_unavailable" }, { status: 503 });

  // MONETIZADO PRIMEIRO: mesma regra do catálogo — a loja que paga comissão
  // aparece primeiro na busca, mesmo com nota menor.
  const produtos = (data ?? []).sort((a, b) => {
    const m = (ehLinkMonetizado(b.url) ? 1 : 0) - (ehLinkMonetizado(a.url) ? 1 : 0);
    return m !== 0 ? m : (b.promo_score ?? 0) - (a.promo_score ?? 0);
  }).slice(0, 8).map(({ url: _url, ...resto }) => resto); // url só serve p/ ordenar; não vaza pro cliente

  return NextResponse.json({ produtos });
}
