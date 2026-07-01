import type { Produto } from "@/core/domain/types";
import { ProdutoCard } from "@/components/produto-card";

/**
 * Grid "burro" — só recebe produtos e desenha. É o CORE da vitrine: estável,
 * sem lógica, sem estado. Módulos (como o filtro de lojas) envolvem isto por
 * fora; se um módulo quebrar, este grid continua de pé sozinho.
 */
export function GridProdutos({ produtos }: { produtos: Produto[] }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {produtos.map((p) => <ProdutoCard key={p.id} p={p} />)}
    </div>
  );
}
