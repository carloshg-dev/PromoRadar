/** Só valores agregados das redes. Referências de pedido/cliente nunca entram no relatório. */
export function summarizeAwinTransactions(rows: unknown[]) {
  const statuses: Record<string, { transactions: number; sales: number; commission: number }> = {};
  const products = new Map<string, number>(); let brlRows = 0, otherCurrency = 0, nonSale = 0;
  const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};
  for (const value of rows) {
    const row = object(value), sale = object(row.saleAmount), commission = object(row.commissionAmount);
    if (!["Sale", "Mobile Sale", "Mobile App Purchase"].includes(String(row.type))) { nonSale++; continue; }
    if (sale.currency !== "BRL" || commission.currency !== "BRL") { otherCurrency++; continue; }
    const total = Number(sale.amount), earned = Number(commission.amount);
    if (!Number.isFinite(total) || !Number.isFinite(earned)) throw new Error("awin_transaction_amount_invalid");
    const status = ["pending", "approved", "declined", "deleted"].includes(String(row.commissionStatus)) ? String(row.commissionStatus) : "unknown";
    const bucket = statuses[status] ?? (statuses[status] = { transactions: 0, sales: 0, commission: 0 });
    bucket.transactions++; bucket.sales += Math.round(total * 100); bucket.commission += Math.round(earned * 100); brlRows++;
    if (!["approved", "pending"].includes(status)) continue;
    for (const item of (Array.isArray(row.basketProducts) ? row.basketProducts : []).slice(0, 100)) {
      const product = object(item), name = typeof product.productName === "string" ? product.productName.trim().slice(0, 140) : "";
      const quantity = Number(product.quantity);
      if (!name || !Number.isInteger(quantity) || quantity <= 0 || quantity > 1000 || (!products.has(name) && products.size >= 500)) continue;
      products.set(name, (products.get(name) ?? 0) + quantity);
    }
  }
  return { statuses, brlRows, otherCurrency, nonSale, topProducts: [...products].sort((a, b) => b[1] - a[1]).slice(0, 8) };
}

/** Dias completos em Brasília, não janela móvel a partir do horário do runner. */
export function reportWindow(days: number, now = new Date()) {
  if (![1, 7].includes(days)) throw new Error("report_window_invalid");
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const end = new Date(`${day}T00:00:00-03:00`);
  return { since: new Date(end.getTime() - days * 86400000).toISOString(), until: end.toISOString() };
}
