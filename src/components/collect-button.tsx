"use client";
import { useState } from "react";
import type { AdapterKey } from "@/core/domain/types";

export function CollectButton({ adapter }: { adapter: AdapterKey }) {
  const [estado, setEstado] = useState<"idle" | "loading" | "ok" | "erro">("idle");
  const [msg, setMsg] = useState("");

  async function disparar() {
    setEstado("loading"); setMsg("");
    try {
      const r = await fetch(`/api/scrape/${adapter}`, { method: "POST" });
      const j = await r.json();
      if (j.ok) { setEstado("ok"); setMsg(`${j.salvos} salvos`); }
      else { setEstado("erro"); setMsg(j.error ?? "falhou"); }
    } catch (e) { setEstado("erro"); setMsg((e as Error).message); }
  }

  const cor = estado === "ok" ? "border-emerald-500/40 text-emerald-300"
    : estado === "erro" ? "border-rose-500/40 text-rose-300" : "border-line text-zinc-200";

  return (
    <button onClick={disparar} disabled={estado === "loading"}
      className={`rounded-lg border px-3 py-2 text-xs font-medium transition hover:bg-bg-soft disabled:opacity-50 ${cor}`}>
      {estado === "loading" ? "Coletando…" : `Coletar ${adapter}`}{msg && ` · ${msg}`}
    </button>
  );
}
