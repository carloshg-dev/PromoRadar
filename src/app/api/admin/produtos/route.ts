import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/infrastructure/supabase/admin";
import { papelAtual, podeColetar } from "@/infrastructure/auth/roles";
import { lojaDaUrl } from "@/lib/analise-produto";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Adicionar oferta MANUAL pelo painel (v4.0). Resolve o "trabalho escravo": em vez
 * de mandar link pro dev e esperar deploy, o staff cola o link de afiliado (visto ou
 * pré-preenchido por /api/admin/produtos/analisar), escolhe categoria e o produto
 * entra DIRETO no banco (vw_ofertas serve o site na hora).
 *
 * O link é gravado CRU — o CTA decide monetização por ehLinkMonetizado() no clique
 * (Dois Níveis). A loja é deduzida do domínio (badge/cor certas); desconhecida → Curadoria.
 * Preço é opcional (Carrefour/ML não expõem preço → fica "no anúncio/site").
 * Idempotente: re-adicionar a mesma URL atualiza (onConflict loja_id,sku_loja).
 * sku_loja = "manual:<url>" — é a marca que a BLINDAGEM (stale-sweep da Shopee/Diesel)
 * usa pra nunca apagar o que foi adicionado aqui.
 */
export async function POST(req: NextRequest) {
  if (!podeColetar((await papelAtual())?.papel)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: {
    url?: string; titulo?: string; categoria?: string; preco?: number; imagemUrl?: string;
    marca?: string; descricao?: string; slug?: string; palavrasChave?: string;
  } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Corpo inválido." }, { status: 400 }); }

  const url = (body.url ?? "").trim();
  const titulo = (body.titulo ?? "").trim();
  const categoria = (body.categoria ?? "").trim();
  const imagemUrl = (body.imagemUrl ?? "").trim();
  const marcaInformada = (body.marca ?? "").trim();
  const descricao = (body.descricao ?? "").trim();
  const slug = (body.slug ?? "").trim();
  const palavrasChave = (body.palavrasChave ?? "").trim();

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

  const linhaBase = {
    loja_id: lojaRow.id,
    categoria_id: cat.id,
    sku_loja: `manual:${url}`.slice(0, 240),
    titulo: titulo.slice(0, 500),
    marca: marcaInformada || lojaRow.nome,
    url,
    imagem_url: imagemUrl || null,
    preco_atual: preco,
    preco_original: null,
    desconto_pct: 0,
    em_estoque: true,
    promo_score: 90, // curadoria humana entra em destaque
    visto_em: new Date().toISOString(),
  };

  // descricao/slug/palavras_chave são colunas NOVAS (SEO — Fatia 2). Tenta gravar com
  // elas; se ainda não existirem no banco (42703 = coluna indefinida), regrava sem —
  // o cadastro básico nunca fica bloqueado esperando uma migração.
  const linhaComSeo = {
    ...linhaBase,
    ...(descricao ? { descricao: descricao.slice(0, 300) } : {}),
    ...(slug ? { slug: slug.slice(0, 80) } : {}),
    ...(palavrasChave ? { palavras_chave: palavrasChave.slice(0, 300) } : {}),
  };

  let { error } = await sb.from("produtos").upsert(linhaComSeo, { onConflict: "loja_id,sku_loja" });
  if (error?.code === "42703") {
    ({ error } = await sb.from("produtos").upsert(linhaBase, { onConflict: "loja_id,sku_loja" }));
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, loja: lojaRow.nome });
}
