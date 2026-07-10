"use client";
import type { Produto } from "@/core/domain/types";
import { ProdutoCard } from "@/components/produto-card";
import { useShuffled } from "@/components/use-shuffled";

/**
 * Grade "Destaques de hoje" — embaralha o pool NO CLIENTE a cada montagem,
 * garantindo que o ISR cache do servidor (revalidate = 300s) não congele a
 * vitrine nos mesmos produtos. O servidor manda um pool amplo (ex: 60–120),
 * o componente pega `exibir` aleatórios e renderiza a grade.
 */
export function DestaquesGrid({
  pool,
  exibir = 12,
}: {
  pool: Produto[];
  exibir?: number;
}) {
  const shuffled = useShuffled(pool, exibir);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {shuffled.map((p, i) => <ProdutoCard key={p.id} p={p} rank={i + 1} />)}
    </div>
  );
}
