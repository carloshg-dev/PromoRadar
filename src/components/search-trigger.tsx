"use client";
import { Search } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";

export function SearchTrigger() {
  const open = () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
  return (
    <button onClick={open}
      className="flex items-center gap-2 rounded-xl border border-line bg-bg-soft px-3 py-1.5 text-sm text-muted transition hover:border-brand/40 hover:text-zinc-200">
      <Search className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Buscar…</span>
      <span className="hidden items-center gap-0.5 sm:flex"><Kbd>Ctrl</Kbd><Kbd>K</Kbd></span>
    </button>
  );
}
