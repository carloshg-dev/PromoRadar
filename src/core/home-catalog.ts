import type { Produto } from "./domain/types";
import { hasRecentPrice } from "./offer-freshness";

export const LOJAS_SOMENTE_COMPARADOR = new Set(["kabum", "terabyteshop", "epocacosmeticos"]);

/** Falha de todas as vitrines não pode substituir uma página válida no cache ISR. */
export function validarDisponibilidadeHome(pools: readonly (readonly Produto[])[], falhas: number): void {
  if (falhas > 0 && pools.every((pool) => pool.length === 0)) throw new Error("home_catalog_unavailable");
}

/** Destaque exige observação recente; o catálogo completo mantém os demais itens. */
export function permitidoNaHome(produto: Produto, now = Date.now()): boolean {
  if (LOJAS_SOMENTE_COMPARADOR.has(produto.lojaSlug) || !produto.emEstoque
    || produto.precoAtual === null || !Number.isFinite(produto.precoAtual) || produto.precoAtual <= 0
    || !hasRecentPrice(produto.atualizadoEm, now) || !produto.imagemUrl
    || /(?:no[-_]?image|placeholder|sem[-_]?imagem|image[-_]?not[-_]?found)/i.test(produto.imagemUrl)) return false;
  try {
    const image = new URL(produto.imagemUrl);
    return ["https:", "http:"].includes(image.protocol) && !image.username && !image.password;
  } catch { return false; }
}
