import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/infrastructure/supabase/admin";
import { linkAfiliado, ehLinkMonetizado } from "@/lib/afiliados";
import { isAutomatedRequest, safeOrigin } from "@/core/analytics/events";
import { verifiedBrlPrice } from "@/core/catalog-policy";

export const dynamic = "force-dynamic";

/**
 * Redireciona o usuário à loja registrando o clique — a base de TODA a
 * monetização (afiliados, conversão, argumento de venda p/ parceiros).
 * Sem IP nem identificação do usuário (LGPDamigável): só produto, loja,
 * origem do clique e se veio de celular. Bots não contam. O robots.txt
 * já bloqueia /r/ da indexação.
 */
export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ctx.params.id)) return NextResponse.redirect(new URL("/", req.url));
  const purpose = req.headers.get("purpose") ?? req.headers.get("sec-purpose") ?? "";
  if (/prefetch|prerender/i.test(purpose)) return new NextResponse(null, { status: 204 });
  const ua = req.headers.get("user-agent") ?? "";
  if (isAutomatedRequest(ua)) return NextResponse.redirect(new URL(`/produto/${ctx.params.id}`, req.url));
  const sb = createAdminClient();
  const { data } = await sb
    .from("vw_ofertas")
    .select("id,url,loja_slug")
    .eq("id", ctx.params.id)
    .maybeSingle();

  // id desconhecido ou URL suspeita → home (nunca redirecionar para fora do esperado)
  if (!data?.url || !/^https?:\/\//i.test(data.url)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // TRAVA DE VAZAMENTO: /r/ é a ÚNICA porta de saída do site — o gate de monetização
  // tem que estar AQUI (servidor), não só escondido atrás do botão do card. Assim,
  // mesmo que algum link antigo/direto aponte pra /r/{id} de um produto de loja que
  // não nos afiliou, ele NUNCA sai de graça — cai na página interna de comparação.
  if (!verifiedBrlPrice(data.loja_slug ?? "") || !ehLinkMonetizado(data.url)) {
    return NextResponse.redirect(new URL(`/produto/${data.id}`, req.url));
  }

  if (process.env.PROMODETEC_ANALYTICS_DISABLED !== "1") {
    // clique jamais impede o redirect: erro aqui é engolido de propósito
    try {
      const { error } = await sb.from("cliques").insert({
      produto_id: data.id,
      loja_slug: data.loja_slug ?? null,
      origem: safeOrigin(req.nextUrl.searchParams.get("o") ?? "") ?? null,
      movel: /mobile|android|iphone/i.test(ua),
      }).abortSignal(AbortSignal.timeout(1_500));
      if (error) console.warn("outbound_measurement_failed");
    } catch { console.warn("outbound_measurement_failed"); }
  }

  // Monetização: embrulha o destino com o ID de afiliado da rede (Amazon tag etc.).
  // Não muda o que é exibido; só o link de saída no clique.
  return NextResponse.redirect(linkAfiliado(data.url, data.loja_slug), { status: 302, headers: { "Cache-Control": "no-store" } });
}

// Robôs e verificadores de link não devem gerar cliques nem acessar a rede afiliada.
export async function HEAD() {
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
