import type { Produto } from "@/core/domain/types";
import { validProductImage } from "@/core/catalog-policy";

export const SELECT_PRODUTO = `id,titulo,marca,url,imagem_url,preco_atual,preco_original,desconto_pct,
  promo_score,preco_min_hist,preco_max_hist,preco_avg_hist,em_estoque,atualizado_em,
  loja_nome,loja_slug,loja_logo,categoria_nome,categoria_slug,categoria_emoji`;

export function mapProduto(r: Record<string, unknown>): Produto {
  return {
    id: r.id as string,
    titulo: r.titulo as string,
    marca: (r.marca as string) ?? null,
    url: r.url as string,
    imagemUrl: validProductImage(r.imagem_url as string) ? r.imagem_url as string : null,
    precoAtual: (r.preco_atual as number) ?? null,
    precoOriginal: (r.preco_original as number) ?? null,
    descontoPct: (r.desconto_pct as number) ?? null,
    promoScore: (r.promo_score as number) ?? null,
    precoMinHist: (r.preco_min_hist as number) ?? null,
    precoMaxHist: (r.preco_max_hist as number) ?? null,
    precoAvgHist: (r.preco_avg_hist as number) ?? null,
    emEstoque: Boolean(r.em_estoque),
    atualizadoEm: r.atualizado_em as string,
    lojaNome: r.loja_nome as string,
    lojaSlug: r.loja_slug as string,
    categoriaNome: (r.categoria_nome as string) ?? null,
    categoriaSlug: (r.categoria_slug as string) ?? null,
    categoriaEmoji: (r.categoria_emoji as string) ?? null,
  };
}
