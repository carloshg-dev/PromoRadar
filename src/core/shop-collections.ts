/** Coleções editoriais sobre o catálogo real; não criam produtos ou categorias no banco. */
export const SHOP_COLLECTIONS = [
  { id: "doces", label: "Doces & snacks", description: "Brasileiros, japoneses e outras descobertas", terms: ["chocolate", "bala ", "balas", "doce ", "doces", "paçoca", "pacoca", "biscoito", "snack", "pocky", "mochi", "kitkat", "guloseima"] },
  { id: "casa", label: "Casa que facilita", description: "Cozinha, organização e utilidades", terms: ["organizador", "cozinha", "utensílio", "utensilio", "pote ", "escorredor", "esponja", "limpeza", "gancho", "luminária", "luminaria"] },
  { id: "trabalho", label: "Mesa & trabalho", description: "Pequenas soluções para a rotina", terms: ["suporte", "escritório", "escritorio", "mouse", "teclado", "webcam", "caneta", "caderno", "cabo usb", "hub usb"] },
] as const;

export type ShopCollectionId = typeof SHOP_COLLECTIONS[number]["id"];
export function shopCollection(value: unknown) { return SHOP_COLLECTIONS.find(item => item.id === value); }
export function collectionForTitle(title: string): ShopCollectionId | null {
  const text = title.toLocaleLowerCase("pt-BR");
  return SHOP_COLLECTIONS.find(item => item.terms.some(term => text.includes(term)))?.id ?? null;
}
export function collectionQuery(value: unknown): string | null {
  const collection = shopCollection(value);
  return collection ? collection.terms.map(term => `titulo.ilike.*${term}*`).join(",") : null;
}
