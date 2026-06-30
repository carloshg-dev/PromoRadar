import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/infrastructure/supabase/admin";
import { papelAtual, podeColetar } from "@/infrastructure/auth/roles";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Adicionar oferta MANUAL pelo painel (v4.0). Resolve o "trabalho escravo": em vez
 * de mandar link pro dev e esperar deploy, o staff cola o link de afiliado, escolhe
 * categoria e o produto entra DIRETO no banco (vw_ofertas serve o site na hora).
 *
 * O link é gravado CRU — o CTA decide monetização por ehLinkMonetizado() no clique
 * (Dois Níveis). A loja é deduzida do domínio (badge/cor certas); desconhecida → Curadoria.
 * Preço é opcional (Carrefour/ML não expõem preço → fica "no anúncio/site").
 * Idempotente: re-adicionar a mesma URL atualiza (onConflict loja_id,sku_loja).
 */

const LOJA_POR_DOMINIO: Record<string, { slug: string; nome: string }> = {
  "carrefour.com.br": { slug: "carrefour", nome: "Carrefour" },
  "mercadolivre.com.br": { slug: "mercadolivre", nome: "Mercado Livre" },
  "mercadolibre.com.br": { slug: "mercadolivre", nome: "Mercado Livre" },
  "meli.la": { slug: "mercadolivre", nome: "Mercado Livre" },
  "amazon.com.br": { slug: "amazon", nome: "Amazon" },
  "amzn.to": { slug: "amazon", nome: "Amazon" },
  "shopee.com.br": { slug: "shopee", nome: "Shopee" },
  "shope.ee": { slug: "shopee", nome: "Shopee" },
  "aliexpress.com": { slug: "aliexpress", nome: "AliExpress" },
  "diesel.com.br": { slug: "diesel", nome: "Diesel" },
};

/** Deduz a loja pelo domínio. Em deeplink Awin, olha o destino real (?ued=). */
function lojaDaUrl(raw: string): { slug: string; nome: string } {
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "awin1.com") {
      const ued = u.searchParams.get("ued");
      if (ued) return lojaDaUrl(decodeURIComponent(ued));
      return { slug: "curadoria", nome: "Curadoria" };
    }
    if (LOJA_POR_DOMINIO[host]) return LOJA_POR_DOMINIO[host]!;
    for (const [dom, loja] of Object.entries(LOJA_POR_DOMINIO)) {
      if (host === dom || host.endsWith(`.${dom}`)) return loja;
    }
  } catch { /* url inválida tratada no POST */ }
  return { slug: "curadoria", nome: "Curadoria" };
}

export async function POST(req: NextRequest) {
  if (!podeColetar((await papelAtual())?.papel)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: { url?: string; titulo?: string; categoria?: string; preco?: number; imagemUrl?: string } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Corpo inválido." }, { status: 400 }); }

  const url = (body.url ?? "").trim();
  const titulo = (body.titulo ?? "").trim();
  const categoria = (body.categoria ?? "").trim();
  const imagemUrl = (body.imagemUrl ?? "").trim();

  if (!/^https?:\/\/.+/i.test(url)) return NextResponse.json({ error: "Cole uma URL válida (com https://)." }, { status: 400 });
  if (titulo.length < 3) return NextResponse.json({ error: "Dê um título ao produto." }, { status: 400 });
  if (!categoria) return NextResponse.json({ error: "Escolha uma categoria." }, { status: 400 });

  const sb = createAdminClient();

  const { data: cat } = await sb.from("categorias").select("id").eq("slug", categoria).maybeSingle();
  if (!cat) return NextResponse.json({ error: `Categoria "${categoria}" não existe.` }, { status: 400 });

  const loja = lojaDaUrl(url);
  let { data: lojaRow } = await sb.from("lojas").select("id,nome").eq("adapter_key", loja.slug).maybeSingle();
  if (!lojaRow) {
    let base = "https://promodetec.com.br";
    try { base = new URL(url).origin; } catch { /* mantém fallback */ }
    const { data: nova, error } = await sb.from("lojas")
      .insert({ slug: loja.slug, nome: loja.nome, base_url: base, adapter_key: loja.slug, ativo: true, selo: "oficial" })
      .select("id,nome").single();
    if (error) return NextResponse.json({ error: "Falha ao registrar a loja: " + error.message }, { status: 500 });
    lojaRow = nova;
  }

  const preco = typeof body.preco === "number" && Number.isFinite(body.preco) && body.preco > 0 ? body.preco : null;

  const { error } = await sb.from("produtos").upsert({
    loja_id: lojaRow.id,
    categoria_id: cat.id,
    sku_loja: `manual:${url}`.slice(0, 240),
    titulo: titulo.slice(0, 500),
    marca: lojaRow.nome,
    url,
    imagem_url: imagemUrl || null,
    preco_atual: preco,
    preco_original: null,
    desconto_pct: 0,
    em_estoque: true,
    promo_score: 90, // curadoria humana entra em destaque
    visto_em: new Date().toISOString(),
  }, { onConflict: "loja_id,sku_loja" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, loja: lojaRow.nome });
}
