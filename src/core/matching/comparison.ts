import type { Produto, CategoriaSlug } from "@/core/domain/types";
import { assinatura, rotuloClasse } from "./match";

/** Comparação de uma classe de produto entre lojas (matching por assinatura de modelo). */
export interface Comparacao {
  chave: string;
  rotulo: string;
  categoriaSlug: string | null;
  categoriaNome: string | null;
  categoriaEmoji: string | null;
  ofertas: Produto[]; // 1 por loja (a mais barata), ordenadas por preço asc
  lojas: number;
  menorPreco: number;
  maiorPreco: number;
  economia: number;
  economiaPct: number;
  melhorScore: number | null;
}

export function agruparComparacoes(produtos: Produto[], limit: number): Comparacao[] {
  const grupos = new Map<string, Produto[]>();
  for (const p of produtos) {
    if (p.precoAtual == null || !p.emEstoque) continue;
    const sig = assinatura(p.titulo, p.categoriaSlug as CategoriaSlug | null, p.marca);
    if (!sig) continue;
    const arr = grupos.get(sig);
    if (arr) arr.push(p);
    else grupos.set(sig, [p]);
  }

  const out: Comparacao[] = [];
  for (const [chave, itens] of grupos) {
    // a oferta mais barata de cada loja
    const porLoja = new Map<string, Produto>();
    for (const p of itens) {
      const cur = porLoja.get(p.lojaSlug);
      if (!cur || (p.precoAtual as number) < (cur.precoAtual ?? Infinity)) porLoja.set(p.lojaSlug, p);
    }
    if (porLoja.size < 2) continue;

    let ofertas = [...porLoja.values()].sort((a, b) => (a.precoAtual as number) - (b.precoAtual as number));
    // Filtro de outlier: descarta ofertas > 3× o menor preço da classe. Diferença
    // dessa magnitude no mesmo modelo é quase sempre mismatch (ex: um PC montado
    // do catálogo do ML caindo na classe de um componente).
    const menorDoGrupo = ofertas[0]!.precoAtual as number;
    ofertas = ofertas.filter((o) => (o.precoAtual as number) <= menorDoGrupo * 3);
    if (ofertas.length < 2) continue;
    const precos = ofertas.map((o) => o.precoAtual as number);
    const menor = Math.min(...precos);
    const maior = Math.max(...precos);
    const ref = ofertas[0]!;
    const scores = ofertas.map((o) => o.promoScore ?? 0);
    out.push({
      chave,
      rotulo: rotuloClasse(ref.titulo, ref.categoriaSlug as CategoriaSlug | null, ref.marca),
      categoriaSlug: ref.categoriaSlug,
      categoriaNome: ref.categoriaNome,
      categoriaEmoji: ref.categoriaEmoji,
      ofertas,
      lojas: ofertas.length,
      menorPreco: menor,
      maiorPreco: maior,
      economia: maior - menor,
      economiaPct: maior > 0 ? Math.round((1 - menor / maior) * 100) : 0,
      melhorScore: Math.max(...scores) || null,
    });
  }

  out.sort((a, b) => b.lojas - a.lojas || b.economia - a.economia);
  return out.slice(0, limit);
}
