import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import type { Produto } from "@/core/domain/types";
import { ProdutoCard } from "@/components/produto-card";

/**
 * Vitrine de uma vertical em destaque na home (Beleza, Gadgets, Perfumes…).
 * Cabeçalho com a cor da vertical + grade de produtos reais. As classes de cor
 * são passadas literais (Tailwind JIT) pelo chamador.
 */
export function VitrineVertical({
  titulo, Icon, accentText, accentGrad, href, hrefLabel, produtos,
}: {
  titulo: string;
  Icon: LucideIcon;
  /** ex: "text-parfum-2" */ accentText: string;
  /** ex: "from-parfum to-fit" */ accentGrad: string;
  href: string;
  hrefLabel: string;
  produtos: Produto[];
}) {
  if (!produtos.length) return null;
  return (
    <section className="pb-14">
      <div className="mb-4 flex items-center justify-between">
        <h2 className={`flex items-center gap-2 text-base font-bold tracking-tight ${accentText}`}>
          <span className={`grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br ${accentGrad} text-white`}>
            <Icon className="h-4 w-4" />
          </span>
          {titulo}
        </h2>
        <Link href={href} className={`inline-flex items-center gap-1 text-xs ${accentText} hover:underline`}>
          {hrefLabel} <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {produtos.slice(0, 5).map((p) => <ProdutoCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}
