import { StoreAdapter, type AdapterContext } from "@/infrastructure/scraping/core/adapter";
import { coletarVtex, type VtexBusca } from "@/infrastructure/scraping/core/vtex";
import type { RawProduct } from "@/core/domain/types";

/**
 * Época Cosméticos — loja VTEX (HTTP-puro, mesmo helper de Americanas/FG),
 * âncora da vertical BELEZA. Cobre perfumes (árabes + importados) e cosméticos
 * de verdade — maquiagem, skincare e cabelos — com preço e foto (≠ Lomadee, que
 * não dá produto/preço das marcas). A categoria vem do termo buscado; o `valida`
 * confirma o subtipo no título p/ não misturar (ex: máscara de cílios ≠ capilar).
 */

const SITE = "https://www.epocacosmeticos.com.br";
const ehPerfume = /perfum|eau de|\bedp\b|\bedt\b|\bedc\b|parfum|col[ôo]nia/i;
const ehMaquiagem = /base|batom|m[áa]scara de c[íi]lios|sombra|corretivo|p[óo] (compacto|facial)|delineador|blush|primer|gloss|l[áa]pis (de olho|labial)|r[íi]mel|paleta|ilumin|maquiagem/i;
const ehSkincare = /s[ée]rum|hidratante|protetor solar|[áa]cido (hialur|gli|salic)|limpeza facial|t[ôo]nico facial|esfoliante|antissinais|sabonete facial|[óo]leo facial|creme (facial|para o rosto|para a pele)|gel de limpeza|niacinamida|vitamina c|skincare/i;
const ehCabelo = /shampoo|condicionador|m[áa]scara (capilar|de tratamento|de nutri|de hidrata)|leave[- ]?in|finalizador|[óo]leo capilar|progressiva|reconstru|cabelos?|capilar/i;

const BUSCAS: readonly VtexBusca[] = [
  // árabes
  { termo: "lattafa", slug: "perfumes-arabes", valida: ehPerfume },
  { termo: "armaf", slug: "perfumes-arabes", valida: ehPerfume },
  { termo: "al haramain", slug: "perfumes-arabes", valida: ehPerfume },
  { termo: "maison alhambra", slug: "perfumes-arabes", valida: ehPerfume },
  { termo: "rasasi", slug: "perfumes-arabes", valida: ehPerfume },
  { termo: "afnan", slug: "perfumes-arabes", valida: ehPerfume },
  // importados
  { termo: "dior perfume", slug: "perfumes-importados", valida: ehPerfume },
  { termo: "paco rabanne", slug: "perfumes-importados", valida: ehPerfume },
  { termo: "carolina herrera perfume", slug: "perfumes-importados", valida: ehPerfume },
  { termo: "versace perfume", slug: "perfumes-importados", valida: ehPerfume },
  { termo: "jean paul gaultier", slug: "perfumes-importados", valida: ehPerfume },
  { termo: "azzaro perfume", slug: "perfumes-importados", valida: ehPerfume },
  // maquiagem
  { termo: "base facial", slug: "maquiagem", valida: ehMaquiagem },
  { termo: "batom", slug: "maquiagem", valida: ehMaquiagem },
  { termo: "paleta de sombras", slug: "maquiagem", valida: ehMaquiagem },
  { termo: "máscara de cílios", slug: "maquiagem", valida: ehMaquiagem },
  // skincare
  { termo: "protetor solar facial", slug: "skincare", valida: ehSkincare },
  { termo: "sérum facial", slug: "skincare", valida: ehSkincare },
  { termo: "hidratante facial", slug: "skincare", valida: ehSkincare },
  { termo: "ácido hialurônico", slug: "skincare", valida: ehSkincare },
  // cabelos
  { termo: "shampoo", slug: "cabelos", valida: ehCabelo },
  { termo: "condicionador", slug: "cabelos", valida: ehCabelo },
  { termo: "máscara capilar", slug: "cabelos", valida: ehCabelo },
  { termo: "leave-in", slug: "cabelos", valida: ehCabelo },
];

export class EpocaCosmeticosAdapter extends StoreAdapter {
  readonly key = "epocacosmeticos" as const;
  readonly nome = "Época Cosméticos";

  async coletar(ctx: AdapterContext): Promise<RawProduct[]> {
    const out = await coletarVtex(SITE, BUSCAS, { log: ctx.log });
    ctx.log("info", `Época Cosméticos: ${out.length} itens coletados`);
    return out;
  }
}
