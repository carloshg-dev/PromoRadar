import { Radar, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export function AuthAside() {
  return <aside className="hidden flex-col justify-between rounded-2xl bg-lime p-10 lg:flex">
    <div><Radar className="h-10 w-10 text-brand" strokeWidth={1.5} /><h2 className="mt-10 max-w-[15ch] font-display text-4xl font-semibold leading-tight tracking-tight">Mais informação.<br />Uma escolha sua.</h2><p className="mt-5 max-w-[42ch] text-sm leading-7 text-brand">Encontre ofertas, consulte o histórico disponível e compare antes de abrir a loja.</p></div>
    <dl className="my-10"><div className="border-t border-brand/20 py-5"><dt className="font-medium">Preços lado a lado</dt><dd className="mt-1 text-sm leading-6 text-brand">Confira as ofertas de cada loja e as características do produto.</dd></div><div className="border-t border-brand/20 py-5"><dt className="font-medium">Histórico para decidir</dt><dd className="mt-1 text-sm leading-6 text-brand">Consulte as variações registradas, quando disponíveis.</dd></div><div className="border-y border-brand/20 py-5"><dt className="font-medium">Seu radar de achados</dt><dd className="mt-1 text-sm leading-6 text-brand">Salve ofertas neste navegador para voltar a elas depois.</dd></div></dl>
    <Link prefetch={false} href="/ofertas" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-brand">Continuar explorando as ofertas<ArrowUpRight className="h-4 w-4" /></Link>
  </aside>;
}
