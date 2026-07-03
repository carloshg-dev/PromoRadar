/**
 * TRADUÇÃO DE TÍTULOS — módulo isolado (Núcleo + Módulos). REGRA DO DONO
 * (02/07/2026): todo título de produto, independente da marca/empresa, deve
 * estar em português. Feeds gringos (AliExpress, skincare coreano da Shopee…)
 * chegam em inglês — este glossário traduz os termos de e-commerce no ponto de
 * estrangulamento da coleta (collection.service + motor Shopee).
 *
 * É tradução por GLOSSÁRIO (determinística, grátis, auditável): termo a termo
 * com fronteira de palavra, multipalavra primeiro, preservando maiúscula
 * inicial, números, códigos e nomes de marca. Não reordena a frase — um título
 * muito "inglês" fica legível, não perfeito. Tradução natural de frase inteira
 * exigiria API paga (decisão futura). Termo novo aparecendo nos feeds = 1 linha.
 */

const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** [inglês, português] — MULTIPALAVRA PRIMEIRO (senão "sun cream" vira "sol creme"). */
const GLOSSARIO: Array<[string, string]> = [
  // ---- GUARDAS: nomes consagrados que as regras soltas mutilariam (no-op) ----
  ["apple watch", "Apple Watch"],
  ["galaxy watch", "Galaxy Watch"],
  ["mi watch", "Mi Watch"],
  ["smart watch", "smartwatch"],
  ["ring light", "ring light"],
  ["mouse pad", "mousepad"],
  // ---- multipalavra / expressões ----
  ["sun cream", "protetor solar"],
  ["sunscreen", "protetor solar"],
  ["screen protector", "película de tela"],
  ["phone case", "capa de celular"],
  ["development board", "placa de desenvolvimento"],
  ["power supply", "fonte de alimentação"],
  ["led strip", "fita LED"],
  ["night light", "luminária noturna"],
  ["makeup brush", "pincel de maquiagem"],
  ["facial mask", "máscara facial"],
  ["face mask", "máscara facial"],
  ["lifting mask", "máscara lifting"],
  ["eye cream", "creme para os olhos"],
  ["hand cream", "creme para as mãos"],
  ["body lotion", "loção corporal"],
  ["body wash", "sabonete líquido corporal"],
  ["hair care", "cuidados capilares"],
  ["nail polish", "esmalte"],
  ["yoga mat", "tapete de yoga"],
  ["resistance band", "faixa elástica"],
  ["water bottle", "garrafa de água"],
  ["stainless steel", "aço inox"],
  ["high quality", "alta qualidade"],
  ["new arrival", "novidade"],
  ["hot sale", "promoção"],
  ["free shipping", ""], // ruído de marketing — some
  ["fast delivery", ""],
  ["for women", "feminino"],
  ["for men", "masculino"],
  ["for kids", "infantil"],
  ["2 piece", "2 peças"],
  ["3 piece", "3 peças"],
  ["4 piece", "4 peças"],
  // ---- vestuário / acessórios ----
  ["women's", "feminino"],
  ["womens", "feminino"],
  ["women", "feminino"],
  ["men's", "masculino"],
  ["mens", "masculino"],
  ["men", "masculino"],
  ["kids", "infantil"],
  ["children", "infantil"],
  ["baby", "bebê"],
  ["clothes", "roupas"],
  ["clothing", "roupas"],
  ["dress", "vestido"],
  ["dresses", "vestidos"],
  ["shoes", "sapatos"],
  ["sneakers", "tênis"],
  ["boots", "botas"],
  ["sandals", "sandálias"],
  ["slippers", "chinelos"],
  ["t-shirt", "camiseta"],
  ["tshirt", "camiseta"],
  ["shirt", "camisa"],
  ["blouse", "blusa"],
  ["pants", "calça"],
  ["trousers", "calça"],
  ["jeans", "jeans"],
  ["jacket", "jaqueta"],
  ["coat", "casaco"],
  ["hoodie", "moletom"],
  ["sweater", "suéter"],
  ["sweatshirt", "moletom"],
  ["skirt", "saia"],
  ["socks", "meias"],
  ["underwear", "roupa íntima"],
  ["swimsuit", "maiô"],
  ["bikini", "biquíni"],
  ["suits", "conjuntos"],
  ["sets", "conjuntos"],
  ["set", "conjunto"],
  ["bag", "bolsa"],
  ["bags", "bolsas"],
  ["handbag", "bolsa de mão"],
  ["backpack", "mochila"],
  ["wallet", "carteira"],
  ["belt", "cinto"],
  ["hat", "chapéu"],
  // "cap" NÃO entra: mutila nomes de linha estrangeiros (L'Occitane "Cap Cedrat" → "Boné"…)
  ["scarf", "cachecol"],
  ["gloves", "luvas"],
  ["watch", "relógio"],
  ["ring", "anel"],
  ["rings", "anéis"],
  ["necklace", "colar"],
  ["earrings", "brincos"],
  ["bracelet", "pulseira"],
  ["sunglasses", "óculos de sol"],
  ["jewelry", "bijuteria"],
  ["fashion", "moda"],
  // ---- beleza ----
  ["cream", "creme"],
  ["serum", "sérum"],
  ["mask", "máscara"],
  ["lipstick", "batom"],
  ["fragrance", "fragrância"],
  ["moisturizer", "hidratante"],
  ["cleanser", "sabonete facial"],
  ["collagen", "colágeno"],
  ["whitening", "clareador"],
  ["anti-aging", "antissinais"],
  ["vitamin", "vitamina"],
  ["hair", "cabelo"],
  ["skin", "pele"],
  // ---- eletrônicos / casa ----
  ["wireless", "sem fio"],
  ["waterproof", "à prova d'água"],
  ["rechargeable", "recarregável"],
  ["portable", "portátil"],
  ["foldable", "dobrável"],
  ["folding", "dobrável"],
  ["adjustable", "ajustável"],
  ["earphones", "fones de ouvido"],
  ["earphone", "fone de ouvido"],
  ["earbuds", "fones sem fio"],
  ["headphones", "fones de ouvido"],
  ["headphone", "fone de ouvido"],
  ["headset", "headset"],
  ["speaker", "caixa de som"],
  ["charger", "carregador"],
  ["cable", "cabo"],
  ["keyboard", "teclado"],
  ["screen", "tela"],
  ["display", "tela"],
  ["battery", "bateria"],
  ["flashlight", "lanterna"],
  ["lamp", "luminária"],
  ["light", "luz"],
  ["fan", "ventilador"],
  ["holder", "suporte"],
  ["stand", "suporte"],
  ["storage", "organizador"],
  ["kitchen", "cozinha"],
  ["bathroom", "banheiro"],
  ["bedroom", "quarto"],
  ["garden", "jardim"],
  ["tools", "ferramentas"],
  ["tool", "ferramenta"],
  ["toys", "brinquedos"],
  ["toy", "brinquedo"],
  ["gift", "presente"],
  ["leather", "couro"],
  ["cotton", "algodão"],
  ["plush", "pelúcia"],
  // ---- cores ----
  ["black", "preto"],
  ["white", "branco"],
  ["red", "vermelho"],
  ["blue", "azul"],
  ["green", "verde"],
  ["yellow", "amarelo"],
  ["pink", "rosa"],
  ["purple", "roxo"],
  ["gray", "cinza"],
  ["grey", "cinza"],
  ["brown", "marrom"],
  ["golden", "dourado"],
  ["gold", "dourado"],
  ["silver", "prateado"],
  // ---- fit ----
  ["dumbbell", "halter"],
  ["protein", "proteína"],
  ["gym", "academia"],
  ["running", "corrida"],
  ["sports", "esportivo"],
  ["sport", "esporte"],
  // ---- quantidades ----
  ["pieces", "peças"],
  ["piece", "peça"],
  ["pcs", "peças"],
  ["pair", "par"],
];

// Fronteira de palavra à prova de acento: nada de letra/dígito colado dos lados.
const REGRAS = GLOSSARIO.map(([en, pt]) => ({
  re: new RegExp(`(?<![a-z0-9])${escapar(en)}(?![a-z0-9])`, "gi"),
  pt,
}));

/** Preserva a capitalização inicial do termo original ("Women" → "Feminino"). */
function comCasing(original: string, pt: string): string {
  if (!pt) return pt;
  return /^[A-Z]/.test(original) ? pt.charAt(0).toUpperCase() + pt.slice(1) : pt;
}

/** Traduz os termos de e-commerce do título pro português. Título já PT = no-op. */
export function traduzirTitulo(titulo: string): string {
  let out = titulo;
  for (const { re, pt } of REGRAS) {
    out = out.replace(re, (m) => comCasing(m, pt));
  }
  return out
    .replace(/\b(\p{L}+)(?: \1\b)+/giu, "$1") // "Conjuntos Conjuntos" → "Conjuntos" (sinônimos EN viram a mesma palavra PT)
    .replace(/\s{2,}/g, " ")
    .replace(/^\s*[-—·,]\s*/, "")
    .trim();
}
