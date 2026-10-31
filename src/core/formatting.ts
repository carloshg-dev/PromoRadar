// Objetos imutáveis compartilhados; nenhum estado do visitante fica no módulo.
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const shortDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });

export function formatBRL(value: number | null | undefined): string {
  return value == null ? "—" : currency.format(value);
}

export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? date.toString() : shortDate.format(date);
}
