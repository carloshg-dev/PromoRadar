"use client";
import { useState } from "react";
import type { Coupon } from "@/core/coupons";
import { CupomCard } from "./cupom-card";

export function CouponDirectory({ coupons }: { coupons: Coupon[] }) {
  const [brand, setBrand] = useState("all"), [codesOnly, setCodesOnly] = useState(false);
  const brands = [...new Set(coupons.map(c => c.marca))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const visible = coupons.filter(c => (brand === "all" || c.marca === brand) && (!codesOnly || c.codigo));
  return <section aria-label="Cupons das lojas"><div className="mb-5 flex flex-wrap items-center gap-4 rounded-xl bg-bg-soft p-4"><label className="flex min-w-0 max-w-full items-center gap-3 text-sm">Loja<select value={brand} onChange={e => setBrand(e.target.value)} className="min-h-11 min-w-0 max-w-[220px] rounded-lg border border-line bg-bg-card px-3"><option value="all">Todas as lojas</option>{brands.map(b => <option key={b}>{b}</option>)}</select></label><label className="inline-flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={codesOnly} onChange={e => setCodesOnly(e.target.checked)} className="h-4 w-4 accent-orange-500" />Só com código</label><p className="text-xs text-muted" role="status">{visible.length} {visible.length === 1 ? "campanha" : "campanhas"}</p></div>
    {visible.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visible.map(c => <CupomCard key={c.id} cupom={c} />)}</div> : <p className="py-8 text-sm text-muted">Nenhuma campanha com esse filtro. Escolha outra loja ou inclua ofertas sem código.</p>}
  </section>;
}
