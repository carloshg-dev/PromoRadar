import type { CategoriaSlug } from "@/core/domain/types";

/**
 * Classifica um suplemento nas categorias rastreadas pelo vertical Mundo Fit,
 * a partir do título (e, quando houver, do tipo/categoria da loja). Whey tem
 * prioridade (combos "whey + creatina" contam como whey). Retorna null para
 * itens fora do escopo (barras, vitaminas, roupas, acessórios…), que são
 * descartados pelos adapters.
 */
export function classificarSuplemento(...partes: Array<string | null | undefined>): CategoriaSlug | null {
  const t = partes.filter(Boolean).join(" ").toLowerCase();
  if (/\bwhey\b/.test(t)) return "whey-protein";
  if (/\bcreatin[ae]\b/.test(t)) return "creatina";
  if (/pr[eé][\s-]?treino|pre[\s-]?workout/.test(t)) return "pre-treino";
  return null;
}

/** Grandes aparelhos profissionais de academia — fora do escopo do "Outros". */
const APARELHO_GRANDE =
  /\b(esteira|el[íi]ptic\w*|leg ?press|smith|crossover|gaiola|power ?rack|estac[aã]o de muscula\w*|prensa|cadeira (extensora|flexora|abdutora)|banco (supino|reto|articulado|romano)|sup[ií]no (reto|inclinado|articulado)|agachamento smith)\b/i;

/**
 * Classificação ABRANGENTE para fontes de catálogo completo (Shopify
 * products.json, catálogo VTEX por marca). Devolve a categoria específica
 * quando reconhece (whey/creatina/pré-treino) e, para qualquer outro item da
 * loja fit (BCAA, barra, vitamina, coqueteleira, elástico, roupa, puxador…),
 * devolve "fit-outros". Só descarta grandes aparelhos profissionais.
 */
export function classificarFit(...partes: Array<string | null | undefined>): CategoriaSlug | null {
  const especifica = classificarSuplemento(...partes);
  if (especifica) return especifica;
  const t = partes.filter(Boolean).join(" ").toLowerCase();
  if (!t.trim() || APARELHO_GRANDE.test(t)) return null;
  return "fit-outros";
}
