import { CATALOG_PRICE_OPTIONS } from "@/core/catalog-policy";
import { formatBRL } from "@/lib/utils";

export function CatalogPriceFilter({ value, id }: { value: number | null; id: string }) {
  return <div className="flex items-center gap-2">
    <label htmlFor={id} className="text-sm text-muted">Preço até</label>
    <select id={id} name="ate" defaultValue={value === null ? "todos" : String(value)} className="min-h-11 rounded-lg border border-line bg-white px-3 text-base text-ink focus-visible:outline-brand">
      {CATALOG_PRICE_OPTIONS.map(price => <option key={price} value={price}>{formatBRL(price)}</option>)}
      <option value="todos">Todos os preços</option>
    </select>
  </div>;
}
