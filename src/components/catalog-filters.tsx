"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

export function CatalogFilters({ selection, children }: { selection: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <section aria-label="Filtros de ofertas" className="mt-5">
      <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(value => !value)}
        className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-line bg-bg-card px-4 py-3 text-left text-ink lg:hidden">
        <SlidersHorizontal className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
        <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Filtrar ofertas</span><span className="block truncate text-xs text-muted">{selection}</span></span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      <div id={panelId} className={`${open ? "block" : "hidden"} lg:block`}>{children}</div>
    </section>
  );
}
