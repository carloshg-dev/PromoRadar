"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Scale, Ticket, Flame, X } from "lucide-react";
import { formatBRL } from "@/lib/utils";
import { track } from "./analytics/track";

interface Hit { id: string; titulo: string; loja_nome: string; preco_atual: number; categoria_emoji: string | null }
const SHORTCUTS = [
  { label: "Melhores ofertas", href: "/ofertas", Icon: Flame },
  { label: "Comparar entre lojas", href: "/comparar", Icon: Scale },
  { label: "Cupons", href: "/cupons", Icon: Ticket },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [active, setActive] = useState(0);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [retry, setRetry] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastSearch = useRef("");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) { setQ(""); setHits([]); setActive(0); setState("idle"); lastSearch.current = ""; return; }
    const trigger = document.activeElement;
    inputRef.current?.focus();
    track("abrir_busca", { origem: "atalho" });
    return () => { if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus(); };
  }, [open]);

  useEffect(() => {
    const term = q.trim();
    if (!open || term.length < 2) { setHits([]); setState("idle"); return; }
    const controller = new AbortController();
    setHits([]); setActive(0); setState("loading");
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("search");
        const result = await response.json() as { produtos: Hit[] };
        if (controller.signal.aborted) return;
        setHits(result.produtos); setState("ready");
        if (lastSearch.current !== term) {
          track("busca", { termo: term, origem: "atalho" });
          if (!result.produtos.length) track("busca_sem_resultado", { termo: term, origem: "atalho" });
          lastSearch.current = term;
        }
      } catch { if (!controller.signal.aborted) { setHits([]); setState("error"); } }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [q, open, retry]);

  const go = useCallback((href: string) => {
    if (href.startsWith("/produto/")) track("selecionar_busca", { produtoId: href.slice(9), termo: q.trim(), origem: "atalho" });
    setOpen(false); router.push(href);
  }, [router, q]);
  const searching = q.trim().length >= 2;
  const items = searching ? hits.map((hit) => ({ key: hit.id, href: `/produto/${hit.id}`, node: <>
    <span className="min-w-0 flex-1"><span className="line-clamp-2">{hit.titulo}</span><span className="mt-1 block text-xs text-muted">{hit.loja_nome}</span></span>
    <span className="shrink-0 text-sm font-semibold text-neon">{formatBRL(hit.preco_atual)}</span>
  </> })) : SHORTCUTS.map(({ label, href, Icon }) => ({ key: href, href, node: <span className="flex items-center gap-2"><Icon className="h-4 w-4" />{label}</span> }));
  if (!open) return null;
  return <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 p-4 pt-[10vh]" onClick={() => setOpen(false)}>
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="search-title"
      className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-bg-card shadow-2xl" onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          const controls = dialogRef.current?.querySelectorAll<HTMLElement>('input,button,a[href]');
          const first = controls?.[0], last = controls?.[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
        if (event.target !== inputRef.current) return;
        if (event.key === "ArrowDown") { event.preventDefault(); setActive((value) => Math.min(value + 1, Math.max(0, items.length - 1))); }
        if (event.key === "ArrowUp") { event.preventDefault(); setActive((value) => Math.max(value - 1, 0)); }
        if (event.key === "Enter" && items[active]) { event.preventDefault(); go(items[active]!.href); }
      }}>
      <h2 id="search-title" className="sr-only">Buscar produtos</h2>
      <div className="flex items-center gap-3 border-b border-line pl-4 pr-1">
        <Search className="h-4 w-4 shrink-0 text-muted" />
        <input ref={inputRef} value={q} maxLength={80} onChange={(event) => setQ(event.target.value)} placeholder="Qual produto você procura?" aria-label="Buscar produtos" autoComplete="off"
          role="combobox" aria-expanded={items.length > 0} aria-controls="search-results" aria-activedescendant={items[active] ? `search-hit-${active}` : undefined}
          className="h-14 min-w-0 flex-1 bg-transparent text-base text-zinc-100 outline-none placeholder:text-muted" />
        <button type="button" onClick={() => setOpen(false)} aria-label="Fechar busca" className="grid h-11 w-11 shrink-0 place-items-center text-muted hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"><X className="h-4 w-4" /></button>
      </div>
      <div role="status" aria-live="polite" className="px-4 pt-3 text-xs text-muted">
        {state === "loading" ? "Buscando ofertas…" : state === "error" ? "A busca não respondeu. Tente novamente." : searching && state === "ready" ? `${hits.length} sugestões com preço coletado nos últimos 7 dias.` : "Digite pelo menos duas letras ou escolha um atalho."}
      </div>
      {state === "error" && <button type="button" onClick={() => setRetry((value) => value + 1)} className="mx-4 mt-2 min-h-11 text-sm text-brand-2 underline">Tentar novamente</button>}
      <div id="search-results" role="listbox" aria-label="Resultados da busca" aria-busy={state === "loading"} className="max-h-[50vh] overflow-y-auto p-2">
        {items.map((item, index) => <button type="button" id={`search-hit-${index}`} role="option" aria-selected={index === active} key={item.key}
          onMouseEnter={() => setActive(index)} onClick={() => go(item.href)}
          className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${index === active ? "bg-brand/15 text-white" : "text-zinc-300"}`}>
          {item.node}<ArrowRight className="h-3.5 w-3.5 shrink-0" />
        </button>)}
      </div>
      {searching && <button type="button" onClick={() => go(`/ofertas?busca=${encodeURIComponent(q.trim())}`)} className="flex min-h-12 w-full items-center justify-between gap-2 border-t border-line px-4 py-3 text-left text-sm text-brand-2 hover:bg-bg-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">Ver todas as ofertas desta busca <ArrowRight className="h-4 w-4" /></button>}
    </div>
  </div>;
}
