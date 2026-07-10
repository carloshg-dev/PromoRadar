"use client";
import type { Produto } from "@/core/domain/types";
import { ProdutoCard } from "@/components/produto-card";
import { useShuffled } from "@/components/use-shuffled";

/**
 * Grade de produtos embaralhada NO CLIENTE — wrapper reutilizável para vitrines
 * da home. O servidor manda um pool amplo (ex: 20 produtos), o componente pega
 * `exibir` aleatórios a cada montagem — cada F5 mostra itens diferentes mesmo
 * com ISR cacheado.
 */
export function ShuffledGrid({
  pool,
  exibir,
  className,
}: {
  pool: Produto[];
  exibir: number;
  className?: string;
}) {
  const shuffled = useShuffled(pool, exibir);
  if (!shuffled.length) return null;
  return (
    <div className={className}>
      {shuffled.map((p) => <ProdutoCard key={p.id} p={p} />)}
    </div>
  );
}
