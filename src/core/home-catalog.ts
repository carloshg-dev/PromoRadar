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

/** Vitrine de fragrâncias pessoais não inclui aromatizadores automotivos. */
export function perfumePessoalNaHome(produto: Produto): boolean {
  const titulo = produto.titulo.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return !/\b(aromatizador|odorizador|automotivo|automotiva|cheirinho|helicoptero)\b/.test(titulo)
    && !/\b(para|de) (carro|carros|veiculo|veiculos)\b/.test(titulo);
}

/** Seleção limitada aos pools já lidos: diversidade primeiro, vantagem histórica depois. */
export function selecionarAchadosHome(produtos: readonly Produto[], limite = 8, now = Date.now()): Produto[] {
  const unicos = new Map<string, Produto>();
  for (const produto of produtos) {
    if (!unicos.has(produto.id) && permitidoNaHome(produto, now)) unicos.set(produto.id, produto);
  }
  const candidatos = [...unicos.values()];
  const selecionados: Produto[] = [];
  const lojas = new Map<string, number>();
  const categorias = new Map<string, number>();
  const vantagem = (p: Produto) => p.precoAtual !== null && p.precoMinHist !== null && p.precoMaxHist !== null
    && p.precoMaxHist > p.precoMinHist && p.precoAtual <= p.precoMinHist ? 1 : 0;
  const score = (p: Produto) => p.promoScore !== null && Number.isFinite(p.promoScore) ? Math.max(0, Math.min(100, p.promoScore)) : 0;
  const comparar = (a: Produto, b: Produto) => (lojas.get(a.lojaSlug) ?? 0) - (lojas.get(b.lojaSlug) ?? 0)
    || (categorias.get(a.categoriaSlug ?? "outras") ?? 0) - (categorias.get(b.categoriaSlug ?? "outras") ?? 0)
    || vantagem(b) - vantagem(a) || score(b) - score(a)
    || Date.parse(b.atualizadoEm) - Date.parse(a.atualizadoEm) || a.id.localeCompare(b.id);
  const quantidade = Math.max(0, Math.min(8, Math.trunc(limite) || 0));
  while (selecionados.length < quantidade && candidatos.length) {
    let melhor = 0;
    for (let i = 1; i < candidatos.length; i++) if (comparar(candidatos[i]!, candidatos[melhor]!) < 0) melhor = i;
    const produto = candidatos.splice(melhor, 1)[0]!;
    selecionados.push(produto);
    lojas.set(produto.lojaSlug, (lojas.get(produto.lojaSlug) ?? 0) + 1);
    const categoria = produto.categoriaSlug ?? "outras";
    categorias.set(categoria, (categorias.get(categoria) ?? 0) + 1);
  }
  return selecionados;
}
