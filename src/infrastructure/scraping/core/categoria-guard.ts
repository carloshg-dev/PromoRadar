import type { CategoriaSlug } from "@/core/domain/types";

/**
 * Guarda de sanidade de categoria — impede que um produto caia na subcategoria
 * ERRADA. Aplicada centralmente na coleta, vale p/ TODOS os adapters (inclusive
 * futuros), resolvendo de uma vez:
 *   • notebook usado / PC gamer com "SSD 256gb" no nome entrando em "SSDs"
 *   • gabinete/caixa de SSD (acessório) entrando em "SSDs"
 *   • placa-mãe / processador (de carrossel "veja também") entrando em "SSDs"
 *
 * Regra: rejeita um produto da categoria X quando o título indica claramente
 * OUTRO tipo de produto — uma máquina completa (PC/notebook/gabinete) ou outra
 * categoria tech. Categorias não-tech (perfumes, suplementos, eletro,
 * ferramentas, gadgets) não têm marcador aqui → nunca são filtradas.
 */

// Marcador FORTE do tipo de cada categoria tech (o produto-alvo de fato).
const MARCADORES: Partial<Record<CategoriaSlug, RegExp>> = {
  "placas-de-video": /placa de v[íi]deo|geforce|radeon|\brtx ?\d|\bgtx ?\d|\brx ?\d{3,4}\b/i,
  processadores: /\bprocessador\b|\bryzen\b|core i\d|core ultra|\bcpu\b|threadripper|\bathlon\b/i,
  ssds: /\bssd\b|\bnvme\b/i,
  "memorias-ram": /\bmem[óo]ria\b|\bddr[345]\b|\bdimm\b/i,
  "placas-mae": /placa[ -]?m[ãa]e|motherboard/i,
  fontes: /\bfonte\b|\bpsu\b|80 ?plus/i,
  monitores: /\bmonitor\b/i,
  notebooks: /\bnotebook\b|\bultrabook\b|\bmacbook\b/i,
};

// Máquina completa (PC/notebook) ou gabinete — nunca é um componente avulso.
// Os lookbehinds evitam derrubar:
//   • acessórios legítimos: "SSD para Notebook", "Memória p/ Notebook"
//   • descritores: "Memória DE computador", "Placa-mãe DO computador"
// (nesses casos o componente é o produto e a máquina é só qualificador).
// "desktop" ficou de fora de propósito: aparece muito como adjetivo ("memória
// desktop", "gabinete desktop") e geraria falso positivo.
const MAQUINA =
  /(?<!de )(?<!do )(?<!da )(?<!para )(?<!p\/ )\b(pc gamer|pc montado|computador|all[ -]?in[ -]?one|mini ?pc|gabinete|notebook|ultrabook|macbook)\b/i;

// Categorias tech que são COMPONENTE avulso (não podem ser uma máquina inteira).
// Só elas passam pela guarda: notebooks (que é uma máquina e lista CPU/SSD/RAM no
// próprio nome) e as não-tech ficam de fora p/ não gerar falso positivo.
const COMPONENTES = new Set<CategoriaSlug>([
  "ssds", "fontes", "memorias-ram", "placas-de-video", "placas-mae", "processadores", "monitores",
]);

/** true = o título NÃO pertence à categoria `slug` (deve ser descartado). */
export function conflitaCategoria(slug: CategoriaSlug, titulo: string): boolean {
  // Só filtramos categorias de COMPONENTE avulso. Notebooks e não-tech listam
  // várias peças no nome legitimamente → ficam de fora p/ evitar falso positivo.
  if (!COMPONENTES.has(slug)) return false;

  const proprio = MARCADORES[slug]!;
  const mProprio = proprio.exec(titulo);
  const mMaquina = MAQUINA.exec(titulo);

  // 1) Máquina completa / gabinete ANTES do termo da própria categoria → é outra
  //    coisa. Comparar POSIÇÃO evita falso positivo: "Monitor PC Gamer LG" é um
  //    monitor (Monitor vem antes), mas "PC Gamer ... Monitor 24" é um PC.
  if (mMaquina && (!mProprio || mMaquina.index < mProprio.index)) return true;

  // 2) Confere com a própria categoria (e máquina não vem antes) → mantém.
  if (mProprio) return false;

  // 3) Conflito de tipo: não bate com a própria, mas bate FORTE com outro
  //    componente (ex: "Placa Mãe B550" ou "Processador i9" rotulados como SSD).
  for (const s of Object.keys(MARCADORES) as CategoriaSlug[]) {
    if (s !== slug && MARCADORES[s]!.test(titulo)) return true;
  }
  return false;
}
