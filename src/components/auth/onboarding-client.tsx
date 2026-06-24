"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { salvarInteresses } from "@/app/onboarding/actions";
import {
  Gamepad2, Cpu, HardDrive, MemoryStick, Monitor, Laptop, Keyboard, Zap, Check, Sparkles,
  type LucideIcon,
} from "lucide-react";

const INTERESSES: ReadonlyArray<{ slug: string; nome: string; Icon: LucideIcon }> = [
  { slug: "placas-de-video", nome: "GPUs", Icon: Gamepad2 },
  { slug: "processadores", nome: "CPUs", Icon: Cpu },
  { slug: "ssds", nome: "SSDs", Icon: HardDrive },
  { slug: "memorias-ram", nome: "Memórias", Icon: MemoryStick },
  { slug: "monitores", nome: "Monitores", Icon: Monitor },
  { slug: "notebooks", nome: "Notebooks", Icon: Laptop },
  { slug: "perifericos", nome: "Periféricos", Icon: Keyboard },
  { slug: "fontes", nome: "Fontes", Icon: Zap },
];

export function OnboardingClient() {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const toggle = (s: string) =>
    setSel((p) => { const n = new Set(p); n.has(s) ? n.delete(s) : n.add(s); return n; });

  return (
    <div className="w-full animate-fade-up">
      <div className="text-center">
        <span className="label-mono inline-flex items-center gap-1.5 text-[11px] text-brand-2">
          <Sparkles className="h-3.5 w-3.5" /> Passo final
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">No que você tem interesse?</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Escolha as categorias que você acompanha. Vamos priorizar essas ofertas pra você (e, em breve, mandar alertas).
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {INTERESSES.map(({ slug, nome, Icon }) => {
          const on = sel.has(slug);
          return (
            <button key={slug} onClick={() => toggle(slug)} aria-pressed={on}
              className={`group relative flex flex-col items-center gap-2.5 rounded-2xl border p-4 transition
                ${on ? "border-neon/50 bg-neon/5 glow-green" : "border-line bg-bg-card/40 hover:border-brand/40 hover:bg-bg-soft/60"}`}>
              {on && (
                <span className="absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full bg-neon text-emerald-950">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
              <span className={`grid h-12 w-12 place-items-center rounded-2xl text-white transition-transform duration-300 group-hover:scale-110
                ${on ? "bg-gradient-to-br from-neon to-cyan shadow-[0_8px_24px_-8px_rgba(34,224,107,.6)]"
                     : "bg-gradient-to-br from-brand to-cyan shadow-[0_8px_24px_-8px_rgba(124,93,255,.55)]"}`}>
                <Icon className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <span className={`text-sm font-medium ${on ? "text-white" : "text-zinc-300"}`}>{nome}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button onClick={() => start(() => salvarInteresses([]))} className="text-xs text-muted hover:text-zinc-300">
          Pular por agora
        </button>
        <Button size="lg" disabled={sel.size === 0 || pending} onClick={() => start(() => salvarInteresses([...sel]))}>
          {pending ? "Salvando…" : `Continuar${sel.size ? ` (${sel.size})` : ""}`}
        </Button>
      </div>
    </div>
  );
}
