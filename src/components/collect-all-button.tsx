"use client";
import { useState } from "react";
import { PlayCircle } from "lucide-react";

/**
 * Coleta TODAS as lojas de uma vez (opcional). Dispara o endpoint por-loja em
 * sequência — assim cada loja recebe seu próprio orçamento de tempo serverless
 * (lojas de browser/Firecrawl podem demorar) e mostramos o progresso ao vivo.
 * Mantenha a aba aberta até terminar.
 */
export function CollectAllButton({ adapters }: { adapters: readonly string[] }) {
  const [rodando, setRodando] = useState(false);
  const [feito, setFeito] = useState(0);
  const [atual, setAtual] = useState("");
  const [salvos, setSalvos] = useState(0);
  const [erros, setErros] = useState(0);

  async function coletarTudo() {
    if (rodando) return;
    setRodando(true); setFeito(0); setSalvos(0); setErros(0);
    let s = 0, e = 0, n = 0;
    for (const k of adapters) {
      setAtual(k);
      try {
        const r = await fetch(`/api/scrape/${k}`, { method: "POST" });
        const j = await r.json();
        if (j.ok) s += j.salvos ?? 0; else e += 1;
      } catch { e += 1; }
      n += 1; setFeito(n); setSalvos(s); setErros(e);
    }
    setAtual(""); setRodando(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={coletarTudo} disabled={rodando}
        className="inline-flex items-center gap-1.5 rounded-lg border border-brand/50 bg-brand/10 px-3 py-2 text-xs font-semibold text-brand-2 transition hover:bg-brand/20 disabled:opacity-50">
        <PlayCircle className="h-4 w-4" />
        {rodando ? `Coletando ${feito}/${adapters.length}…` : "Coletar todas as lojas"}
      </button>
      {rodando && atual && <span className="text-xs text-muted">agora: {atual}</span>}
      {(salvos > 0 || erros > 0) && (
        <span className="text-xs text-muted">
          <span className="text-emerald-300">{salvos} salvos</span>
          {erros > 0 && <span className="text-rose-300"> · {erros} lojas com erro</span>}
        </span>
      )}
    </div>
  );
}
