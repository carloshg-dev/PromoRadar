import Link from "next/link";
import { Ticket, ArrowUpRight } from "lucide-react";
import { listarCuponsPublicos } from "@/infrastructure/repositories/coupon-snapshot.repo";
import { CouponDirectory } from "@/components/coupon-directory";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const metadata = { title: "Cupons e ofertas das lojas", alternates: { canonical: "/cupons" }, description: "Cupons e campanhas reais das redes parceiras. Confira código, validade e condições antes de usar na loja." };
export const revalidate = 300;

export default async function Cupons() {
  let data: Awaited<ReturnType<typeof listarCuponsPublicos>> = { coupons: [], updatedAt: null }, available = true;
  try { data = await listarCuponsPublicos(); } catch { available = false; }
  return <main className="mx-auto max-w-page px-4 py-6 sm:px-6 lg:px-10">
    <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Cupons" }]} />
    <div className="my-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="flex items-center gap-3 text-3xl font-bold sm:text-4xl"><Ticket className="h-8 w-8 text-lime" />Cupons para o seu próximo achado.</h1><p className="mt-3 max-w-prose text-sm leading-6 text-muted">Copie o código ou ative a oferta na loja. Valor mínimo, público elegível, frete e estoque podem mudar o resultado; confira as condições.</p></div><Link prefetch={false} href="/ofertas?ate=100" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand">Achados até R$100<ArrowUpRight className="h-4 w-4" /></Link></div>
    {data.coupons.length > 0 ? <CouponDirectory coupons={data.coupons} /> : <div className="rounded-xl border border-line bg-bg-card p-7"><h2 className="text-xl font-semibold">{available ? "Novos cupons estão a caminho" : "Não foi possível atualizar os cupons"}</h2><p className="mt-2 text-sm text-muted">Só exibimos campanhas recebidas das redes e verificadas recentemente. Volte em alguns instantes ou explore os produtos.</p><Link prefetch={false} href="/ofertas" className="shop-action mt-5 inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold">Ver ofertas</Link></div>}
    {data.updatedAt && <p className="mt-6 text-xs text-muted">Última consulta às redes: <time dateTime={data.updatedAt}>{new Date(data.updatedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</time> (Brasília). A aceitação do código é confirmada no checkout da loja.</p>}
  </main>;
}
