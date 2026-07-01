"use client";

import { Component, useMemo, useState, type ReactNode } from "react";
import type { Produto } from "@/core/domain/types";
import { corLoja } from "@/lib/utils";
import { GridProdutos } from "@/components/vitrine/grid-produtos";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * MÓDULO — Filtro de lojas (pill menu). Estrutura Modular com Núcleo Central:
 * este componente NÃO importa Supabase, repositório ou busca — só recebe os
 * produtos que a página (o núcleo) já buscou, e filtra no CLIENTE (instantâneo,
 * zero rede). As lojas do menu são deduzidas dos próprios produtos recebidos —
 * adicionar uma loja nova ao site não exige tocar neste arquivo.
 *
 * Isolamento: um ErrorBoundary local envolve a parte interativa. Se o filtro
 * quebrar por qualququer motivo, cai de volta pro grid completo sem pílulas —
 * "o shopping não fecha".
 */

interface Pill { slug: string; nome: string; cor: string; total: number }

function calcularPills(produtos: Produto[]): Pill[] {
  const porLoja = new Map<string, Pill>();
  for (const p of produtos) {
    const slug = p.lojaSlug ?? p.lojaNome;
    const atual = porLoja.get(slug);
    if (atual) atual.total++;
    else porLoja.set(slug, { slug, nome: p.lojaNome, cor: corLoja(p.lojaSlug ?? p.lojaNome), total: 1 });
  }
  return [...porLoja.values()].sort((a, b) => b.total - a.total);
}

function FiltroLojasInner({ produtos }: { produtos: Produto[] }) {
  const [lojaAtiva, setLojaAtiva] = useState<string | null>(null);
  const pills = useMemo(() => calcularPills(produtos), [produtos]);
  const filtrados = useMemo(
    () => (lojaAtiva ? produtos.filter((p) => (p.lojaSlug ?? p.lojaNome) === lojaAtiva) : produtos),
    [produtos, lojaAtiva],
  );

  if (pills.length < 2) return <GridProdutos produtos={produtos} />; // 1 loja só = pílulas não ajudam

  return (
    <>
      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por loja">
        <button type="button" role="tab" aria-selected={lojaAtiva === null} onClick={() => setLojaAtiva(null)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            lojaAtiva === null ? "border-brand bg-brand/15 text-brand-2" : "border-line text-muted hover:bg-bg-soft hover:text-white"
          }`}>
          Todas <span className="opacity-70">· {produtos.length}</span>
        </button>
        {pills.map((pill) => {
          const on = lojaAtiva === pill.slug;
          return (
            <button key={pill.slug} type="button" role="tab" aria-selected={on} onClick={() => setLojaAtiva(pill.slug)}
              style={on ? { borderColor: pill.cor, backgroundColor: `${pill.cor}22`, color: pill.cor } : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                on ? "" : "border-line text-muted hover:bg-bg-soft hover:text-white"
              }`}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: pill.cor }} />
              {pill.nome} <span className="opacity-70">· {pill.total}</span>
            </button>
          );
        })}
      </div>

      {filtrados.length ? (
        <GridProdutos produtos={filtrados} />
      ) : (
        <EmptyState className="mt-6" icon="🔍" title="Sem produtos dessa loja nesta página"
          hint="Tente 'Todas' ou vá pra próxima página." />
      )}
    </>
  );
}

class LimiteDeFalha extends Component<{ fallback: ReactNode; children: ReactNode }, { falhou: boolean }> {
  override state = { falhou: false };
  static getDerivedStateFromError() { return { falhou: true }; }
  override componentDidCatch(erro: unknown) { console.error("[FiltroLojas] módulo falhou, caindo pro grid completo:", erro); }
  override render() { return this.state.falhou ? this.props.fallback : this.props.children; }
}

/** Export público: filtro de lojas com blindagem — nunca derruba a vitrine abaixo. */
export function VitrineComFiltroLoja({ produtos }: { produtos: Produto[] }) {
  return (
    <LimiteDeFalha fallback={<GridProdutos produtos={produtos} />}>
      <FiltroLojasInner produtos={produtos} />
    </LimiteDeFalha>
  );
}
