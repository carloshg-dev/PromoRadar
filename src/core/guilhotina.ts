/**
 * Guilhotina — piso de preço global do catálogo.
 *
 * Ofertas abaixo do piso (padrão R$ 9,00 desde 03/07 — o dono quer "achados
 * baratos" a partir de R$9 rodando na vitrine) são "iscas": preços irreais,
 * brindes, amostras de 1 unidade ou erro de moeda de feed. Não entram pra não
 * poluir. Fonte ÚNICA da verdade do piso — usada pela coleta ao vivo
 * (collection.service) e pela ingestão da Shopee/Diesel (scripts).
 *
 * ⚠️ Tradeoff: R$9 deixa entrar item barato de verdade (cabo, brinde-ish) que o
 * antigo piso de R$20 cortava; o filtro de qualidade (imagem obrigatória) e a
 * banda R$9–R$120 do carrossel seguram a vitrine. Ajuste por env PISO_PRECO_BRL.
 */
export const PISO_GUILHOTINA = Math.max(0, Number(process.env.PISO_PRECO_BRL) || 9);

/** true = a oferta é degolada (preço ausente, inválido, zero/negativo ou < piso). */
export function degolada(preco: number | null | undefined): boolean {
  return preco == null || !Number.isFinite(preco) || preco < PISO_GUILHOTINA;
}
