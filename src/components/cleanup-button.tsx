"use client";
import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { formatBRL } from "@/lib/utils";

interface Amostra { titulo: string; preco_atual: number | null }

/**
 * Limpeza de peças/acessórios (super admin). Fluxo seguro em 2 passos:
 *  1) "Analisar" → preview (quantos + exemplos) sem tocar no banco.
 *  2) "Confirmar remoção" → DELETE de fato (só aparece após o preview).
 */
export function CleanupButton() {
  const [estado, setEstado] = useState<"idle" | "analisando" | "previa" | "removendo" | "ok" | "erro">("idle");
  const [total, setTotal] = useState(0);
  const [amostra, setAmostra] = useState<Amostra[]>([]);
  const [msg, setMsg] = useState("");

  async function analisar() {
    setEstado("analisando"); setMsg("");
    try {
      const r = await fetch("/api/admin/limpar-pecas");
      const j = await r.json();
      if (!r.ok) { setEstado("erro"); setMsg(j.error ?? "falhou"); return; }
      setTotal(j.total); setAmostra(j.amostra ?? []);
      setEstado(j.total > 0 ? "previa" : "ok");
      if (j.total === 0) setMsg("Nada a limpar — o catálogo já está limpo.");
    } catch (e) { setEstado("erro"); setMsg((e as Error).message); }
  }

  async function remover() {
    setEstado("removendo"); setMsg("");
    try {
      const r = await fetch("/api/admin/limpar-pecas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmar: true }),
      });
      const j = await r.json();
      if (j.ok) { setEstado("ok"); setMsg(`${j.removidos} peças removidas.`); setTotal(0); setAmostra([]); }
      else { setEstado("erro"); setMsg(j.error ?? "falhou"); }
    } catch (e) { setEstado("erro"); setMsg((e as Error).message); }
  }

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex items-center gap-2 label-mono text-[11px] text-amber-300">
        <AlertTriangle className="h-3.5 w-3.5" /> Limpeza de peças &amp; acessórios
      </div>
      <p className="mt-1 text-xs text-muted">
        Remove itens que poluem eletro/ferramentas (ex: &quot;Grade para Forno&quot;, &quot;Mangueira da Lavadora&quot;).
        Ação destrutiva — analise antes de confirmar.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={analisar} disabled={estado === "analisando" || estado === "removendo"}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-bg-soft disabled:opacity-50">
          {estado === "analisando" ? "Analisando…" : "Analisar"}
        </button>
        {estado === "previa" && (
          <button onClick={remover}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/50 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20">
            <Trash2 className="h-3.5 w-3.5" /> Confirmar remoção de {total}
          </button>
        )}
        {estado === "removendo" && <span className="text-xs text-muted">Removendo…</span>}
        {msg && <span className={`text-xs ${estado === "erro" ? "text-rose-300" : "text-emerald-300"}`}>{msg}</span>}
      </div>

      {estado === "previa" && amostra.length > 0 && (
        <div className="mt-3 max-h-40 overflow-auto rounded-lg border border-line bg-bg-card/60 p-2">
          <div className="mb-1 label-mono text-[10px] text-muted">{total} itens · exemplos (mais baratos primeiro):</div>
          {amostra.map((a, i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-0.5 text-[11px]">
              <span className="line-clamp-1 text-zinc-300">{a.titulo}</span>
              <span className="shrink-0 tabular-nums text-muted">{formatBRL(a.preco_atual)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
