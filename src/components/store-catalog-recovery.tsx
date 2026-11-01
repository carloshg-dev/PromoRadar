import Link from "next/link";
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import type { Produto } from "@/core/domain/types";
import { formatBRL } from "@/core/formatting";
import { GridProdutos } from "@/components/vitrine/grid-produtos";
import { Button } from "@/components/ui/button";
import { HOME_HIGHLIGHT_PRICE_LIMIT } from "@/core/catalog-policy";

export function StoreCatalogRecovery({ nome, available, produtos, mesmaLoja, maxPrice }: {
  nome: string; available: boolean; produtos: Produto[]; mesmaLoja: boolean; maxPrice: number | null;
}) {
  const ceiling = Math.min(maxPrice ?? HOME_HIGHLIGHT_PRICE_LIMIT, HOME_HIGHLIGHT_PRICE_LIMIT);
  return (
    <section className="mt-8" aria-labelledby="store-recovery-title" data-store-recovery={mesmaLoja ? "same-store" : "other-stores"}>
      <div className="mb-7 flex flex-col gap-5 rounded-2xl border border-line bg-bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand"><ShoppingBag aria-hidden="true" className="h-5 w-5" /></span>
          <div>
            <h2 id="store-recovery-title" className="font-display text-lg font-semibold">{available ? `Não encontramos produtos de ${nome} neste filtro.` : `As ofertas de ${nome} não carregaram agora.`}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{mesmaLoja
              ? "Explore outros produtos da mesma loja, fora dos filtros de busca e categoria."
              : "Explore achadinhos de outras lojas, identificadas em cada produto."} {maxPrice === null
                ? `Selecionamos opções até ${formatBRL(ceiling)}.`
                : `Selecionamos opções até ${formatBRL(ceiling)}, dentro do teto escolhido.`} Preços coletados recentemente.</p>
          </div>
        </div>
        <Link href="/cupons" prefetch={false} className="shrink-0"><Button variant="outline" size="sm">Explorar cupons <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button></Link>
      </div>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="font-display text-xl font-semibold">{mesmaLoja ? `Mais achadinhos em ${nome}` : "Outros achadinhos para explorar"}</h3>
        <span className="text-sm font-medium text-brand">Até {formatBRL(ceiling)}</span>
      </div>
      <GridProdutos produtos={produtos} />
    </section>
  );
}
