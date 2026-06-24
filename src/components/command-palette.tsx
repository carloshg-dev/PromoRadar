"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, LayoutDashboard, Tag, Flame } from "lucide-react";
import { formatBRL } from "@/lib/utils";

interface Hit { id: string; titulo: string; loja_nome: string; preco_atual: number; promo_score: number | null; categoria_emoji: string | null }

const ATALHOS = [
  { label: "Melhores ofertas", href: "/ofertas", icon: <Flame className="h-4 w-4" /> },
  { label: "Categorias", href: "/#categorias", icon: <Tag className="h-4 w-4" /> },
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [active, setActive] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 30); else { setQ(""); setHits([]); setActive(0); } }, [open]);

  useEffect(() => {
    if (q.trim().length < 2) { setHits([]); return; }
    const t = setTimeout(async () => {
      try { const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`); const j = await r.json(); setHits(j.produtos ?? []); setActive(0); } catch {}
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  const go = useCallback((href: string) => { setOpen(false); router.push(href); }, [router]);

  const itens = q.trim().length >= 2
    ? hits.map((h) => ({ key: h.id, href: `/produto/${h.id}`, node: (
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 truncate"><span>{h.categoria_emoji ?? "🛒"}</span><span className="truncate">{h.titulo}</span></span>
          <span className="flex shrink-0 items-center gap-2 text-xs text-muted">{h.loja_nome}<span className="font-semibold text-emerald-400">{formatBRL(h.preco_atual)}</span></span>
        </div>) }))
    : ATALHOS.map((a) => ({ key: a.href, href: a.href, node: <span className="flex items-center gap-2">{a.icon}{a.label}</span> }));

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, itens.length - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          if (e.key === "Enter" && itens[active]) go(itens[active]!.href);
        }}>
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-4 w-4 text-muted" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produtos, categorias…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted" />
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {itens.length === 0 && <div className="px-3 py-8 text-center text-xs text-muted">{q.length >= 2 ? "Nenhum resultado." : "Digite para buscar."}</div>}
          {itens.map((it, i) => (
            <button key={it.key} onMouseEnter={() => setActive(i)} onClick={() => go(it.href)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm ${i === active ? "bg-brand/15 text-white" : "text-zinc-300"}`}>
              <span className="min-w-0 flex-1">{it.node}</span>
              <ArrowRight className={`ml-2 h-3.5 w-3.5 shrink-0 ${i === active ? "opacity-70" : "opacity-0"}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
