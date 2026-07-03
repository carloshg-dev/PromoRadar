"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, Scale } from "lucide-react";
import { VERTICAIS } from "@/lib/navigation";

const DIRETOS = [
  { href: "/ofertas", label: "Ofertas" },
  { href: "/comparar", label: "Comparador" },
  { href: "/cupons", label: "Cupons" },
] as const;

/** Menu mobile: links diretos + verticais em accordion (mesma fonte do desktop). */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [aberta, setAberta] = useState<string | null>("fit"); // Mundo Fit aberto por padrão (novidade)
  const fechar = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir menu"
        aria-expanded={open}
        className="grid h-9 w-9 place-items-center rounded-lg border border-line text-zinc-200 transition hover:bg-bg-soft hover:text-white"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <>
          <button aria-hidden tabIndex={-1} onClick={fechar} className="fixed inset-0 top-[57px] z-40 cursor-default bg-black/70" />
          <nav className="absolute left-0 right-0 top-full z-50 border-b border-line bg-bg-card shadow-2xl">
            <div className="mx-auto flex max-w-page flex-col gap-1 px-4 py-3">
              <Link href={DIRETOS[0].href} onClick={fechar} className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-bg-soft hover:text-white">{DIRETOS[0].label}</Link>

              {/* Comparador — accordion com as seções (comparar por vertical) */}
              <div className="rounded-lg">
                <button
                  onClick={() => setAberta(aberta === "comparador" ? null : "comparador")}
                  aria-expanded={aberta === "comparador"}
                  className="flex w-full items-center justify-between rounded-lg border border-brand/40 bg-brand/10 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-brand/20"
                >
                  <span className="inline-flex items-center gap-2"><Scale className="h-4 w-4 text-brand-2" /> Comparador</span>
                  <ChevronDown className={`h-4 w-4 text-brand-2 transition-transform ${aberta === "comparador" ? "rotate-180" : ""}`} />
                </button>
                {aberta === "comparador" && (
                  <div className="mb-1 ml-3 grid gap-1 border-l border-line pl-3 pt-1">
                    {VERTICAIS.map((v) => (
                      <Link
                        key={v.slug}
                        href={`/comparar?vertical=${v.slug}`}
                        onClick={fechar}
                        className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-zinc-300 transition hover:bg-bg-soft hover:text-white"
                      >
                        <span className={`h-2 w-2 shrink-0 rounded-full ${v.accent.dot}`} />{v.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {VERTICAIS.map((v) => {
                const exp = aberta === v.slug;
                return (
                  <div key={v.slug} className="rounded-lg">
                    <button
                      onClick={() => setAberta(exp ? null : v.slug)}
                      aria-expanded={exp}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-bg-soft ${v.accent.text} ${v.accent.textHover}`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${v.accent.dot}`} />{v.label}
                      </span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${exp ? "rotate-180" : ""}`} />
                    </button>
                    {exp && (
                      <div className="mb-1 ml-3 grid grid-cols-2 gap-1 border-l border-line pl-3 pt-1">
                        {v.categorias.map(({ slug, nome, Icon }) => (
                          <Link
                            key={slug}
                            href={`/categoria/${slug}`}
                            onClick={fechar}
                            className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-zinc-300 transition hover:bg-bg-soft hover:text-white"
                          >
                            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md bg-gradient-to-br text-white ${v.accent.grad}`}>
                              <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                            </span>
                            {nome}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <Link href={DIRETOS[2].href} onClick={fechar} className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-bg-soft hover:text-white">{DIRETOS[2].label}</Link>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
