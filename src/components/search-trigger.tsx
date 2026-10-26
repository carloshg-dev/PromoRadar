"use client";
import { Search } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";

export function SearchTrigger() {
  const open = () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
  return (
    <button type="button" onClick={open} aria-label="Buscar produtos" aria-haspopup="dialog"
      className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border border-line bg-bg-soft px-3 py-1.5 text-sm text-muted transition hover:border-brand/40 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
      <Search className="h-3.5 w-3.5" />
      <span className="hidden md:inline">Buscar…</span>
      <span className="hidden items-center gap-0.5 md:flex"><Kbd>Ctrl</Kbd><Kbd>K</Kbd></span>
    </button>
  );
}
