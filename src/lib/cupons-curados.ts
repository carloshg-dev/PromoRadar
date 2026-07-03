import { linkAfiliado } from "@/lib/afiliados";
import { awinLogoUrl } from "@/core/awin-anunciantes";
import type { CupomLomadee } from "@/lib/lomadee-cupons";

/**
 * CUPONS CURADOS à mão — campanhas que o dono recebe direto do anunciante (fora
 * da API da Lomadee, ex. Awin). O link cru da loja é embrulhado no afiliado
 * certo por `linkAfiliado` (Carrefour → deeplink Awin mid 17665) → comissão
 * garantida. Aparecem no TOPO de /cupons (curado=true). Cupom novo = 1 entrada.
 */
interface CupomCurado {
  marca: string;
  awinMid?: string;       // logo oficial no CDN da Awin
  titulo: string;
  codigo: string | null;
  urlLoja: string;        // URL CRUA da loja — embrulhada no afiliado aqui
  terminaEm?: string | null; // ISO; ausente = sem prazo declarado
}

const CURADOS: CupomCurado[] = [
  {
    marca: "Carrefour",
    awinMid: "17665",
    titulo: "R$ 200 OFF em Smart TVs selecionadas",
    codigo: "TV200",
    urlLoja: "https://www.carrefour.com.br/colecao/28786?map=productClusterIds&order=OrderByTopSaleDESC",
    terminaEm: null,
  },
];

export function cuponsCurados(): CupomLomadee[] {
  return CURADOS.map((c, i) => ({
    id: `curado-${c.codigo ?? i}`,
    marca: c.marca,
    marcaLogo: c.awinMid ? awinLogoUrl(c.awinMid) : null,
    titulo: c.titulo,
    codigo: c.codigo,
    link: linkAfiliado(c.urlLoja),
    terminaEm: c.terminaEm ?? null,
    destaque: true,
    curado: true,
  }));
}
