import type { Produto } from "@/core/domain/types";
import { ProdutoCard } from "@/components/produto-card";

/**
 * Grid "burro" — só recebe produtos e desenha. É o CORE da vitrine: estável,
 * sem lógica, sem estado. Módulos (como o filtro de lojas) envolvem isto por
 * fora; se um módulo quebrar, este grid continua de pé sozinho.
 */
export function GridProdutos({ produtos }: { produtos: Produto[] }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {produtos.map((p) => <ProdutoCard key={p.id} p={p} />)}
    </div>
  );
}
