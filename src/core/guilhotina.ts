/**
 * Guilhotina — piso de preço global do catálogo.
 *
 * Ofertas abaixo do piso (padrão R$ 20,00) são "iscas": preços irreais, brindes,
 * amostras de 1 unidade ou erro de moeda de feed. Não entram na vitrine pra não
 * poluir as categorias nem o comparador. Fonte ÚNICA da verdade do piso — usada
 * pela coleta ao vivo (collection.service) e pela ingestão da Shopee (script).
 *
 * Ajuste por env PISO_PRECO_BRL (ex.: PISO_PRECO_BRL=15).
 */
export const PISO_GUILHOTINA = Math.max(0, Number(process.env.PISO_PRECO_BRL) || 20);

/** true = a oferta é degolada (preço ausente, inválido, zero/negativo ou < piso). */
export function degolada(preco: number | null | undefined): boolean {
  return preco == null || !Number.isFinite(preco) || preco < PISO_GUILHOTINA;
}
