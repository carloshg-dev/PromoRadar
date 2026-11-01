import Link from "next/link";
import { DiscoverySearch } from "@/components/discovery-search";
import { ProductShelf } from "@/components/product-shelf";
import { CupomCard } from "@/components/cupom-card";
import { SavedRadar } from "@/components/saved-radar";
import { ProductSuggestion } from "@/components/product-quick-view";
import { criarLeituraVitrine, listarAfiliados, listarOfertas, listarVitrinePorLoja, aleatorioSemLojaSeguida } from "@/infrastructure/repositories/produtos.repo";
import type { Produto } from "@/core/domain/types";
import { permitidoNaHome, validarDisponibilidadeHome } from "@/core/home-catalog";
import { listarCuponsPublicos } from "@/infrastructure/repositories/coupon-snapshot.repo";
import { ehLinkMonetizado } from "@/lib/afiliados";
import { Candy, House, BriefcaseBusiness, Headphones, SprayCan, Shirt, Ticket, ShoppingBag, ArrowUpRight, Clock3, Scale } from "lucide-react";

export const revalidate = 1800;
export const metadata = { alternates: { canonical: "/" } };

const departments = [
  { label: "Até R$20", href: "/ofertas?ate=20", Icon: ShoppingBag },
  { label: "Doces & snacks", href: "/ofertas?colecao=doces&ate=100", Icon: Candy },
  { label: "Casa & utilidades", href: "/ofertas?colecao=casa&ate=100", Icon: House },
  { label: "Mesa & trabalho", href: "/ofertas?colecao=trabalho&ate=100", Icon: BriefcaseBusiness },
  { label: "Tech & acessórios", href: "/categoria/fones-bluetooth?ate=100", Icon: Headphones },
  { label: "Beleza", href: "/categoria/maquiagem?ate=100", Icon: SprayCan },
  { label: "Moda", href: "/categoria/moda?ate=100", Icon: Shirt },
  { label: "Cupons", href: "/cupons", Icon: Ticket },
] as const;

export default async function Home() {
  const leitura = criarLeituraVitrine();
  let failures = 0;
  async function load(read: () => Promise<Produto[]>) {
    try { return await read(); } catch (error) {
      failures++; const code = (error as { code?: unknown })?.code;
      console.warn("[home] source_unavailable", typeof code === "string" && /^[A-Z0-9_]{1,16}$/.test(code) ? code : "read_failed");
      return [];
    }
  }
  const [partners, shopee, general, couponData] = await Promise.all([
    load(() => listarAfiliados(160, leitura)),
    load(() => listarVitrinePorLoja("shopee", 80, leitura)),
    load(() => listarOfertas({ limit: 80 }, leitura)),
    listarCuponsPublicos().catch(() => ({ coupons: [], updatedAt: null })),
  ]);
  const products = new Map<string, Produto>();
  for (const product of [...partners, ...shopee, ...general]) if (permitidoNaHome(product, leitura.agora)) products.set(product.id, product);
  const pool = [...products.values()];
  validarDisponibilidadeHome([pool], failures);
  const cheap = aleatorioSemLojaSeguida(pool.filter(p => (p.precoAtual ?? Infinity) <= 50).sort((a, b) => (a.precoAtual ?? 0) - (b.precoAtual ?? 0)), 6);
  const used = new Set(cheap.map(p => p.id));
  const feed = [...cheap, ...aleatorioSemLojaSeguida(pool.filter(p => !used.has(p.id) && (p.precoAtual ?? Infinity) <= 300), 42)];
  const quick = cheap[0] ?? feed[0];
  const coupons = couponData.coupons.slice(0, 3);

  return <main data-public-cache={failures === 0 ? "ready" : "unavailable"} className="mx-auto max-w-page px-3 sm:px-6 lg:px-10">
    <DiscoverySearch products={cheap.slice(0, 3).map(({ id, titulo, imagemUrl, precoAtual }) => ({ id, titulo, imagemUrl, precoAtual }))} />
    <nav aria-label="Explorar categorias" className="shop-category-rail">{departments.map(({ label, href, Icon }) => <Link prefetch={false} href={href} key={label} className="shop-category"><Icon aria-hidden="true" />{label}</Link>)}</nav>
    <nav aria-label="Comprar por orçamento" className="shop-budget">
      <Link prefetch={false} href="/ofertas?ate=20">Até R$20</Link><Link prefetch={false} href="/ofertas?ate=50">Até R$50</Link><Link prefetch={false} href="/ofertas?ate=100">Até R$100</Link><Link prefetch={false} href="/ofertas?loja=shopee&ate=100">Achadinhos Shopee</Link><Link prefetch={false} href="/cupons">Pegar cupons</Link><Link prefetch={false} href="/comparar">Comparar antes de comprar</Link>
    </nav>
    <div className="shop-coupon-strip mt-2 flex flex-wrap items-center justify-between gap-3">
      <p className="flex items-center gap-3 text-sm font-semibold"><Ticket className="h-6 w-6 text-lime" />O achado fica melhor com cupom.</p>
      <Link prefetch={false} href="/cupons" className="inline-flex min-h-11 items-center gap-3 rounded-lg bg-lime px-4 text-sm font-semibold text-[#201b11]">Ver cupons e condições<ArrowUpRight className="h-4 w-4" /></Link>
    </div>
    <ProductShelf featured title="Achados que cabem no bolso" description="Preços reais coletados nas lojas parceiras." href="/ofertas?ate=300" products={feed.slice(0, 12)} limit={12} />
    {coupons.length > 0 && <section className="shop-coupon-strip my-4"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">Cupons para levar junto</h2><Link prefetch={false} href="/cupons" className="inline-flex min-h-11 items-center gap-2 text-sm text-brand">Ver todos<ArrowUpRight className="h-4 w-4" /></Link></div><div className="grid gap-3 md:grid-cols-3">{coupons.map(c => <CupomCard key={c.id} cupom={c} />)}</div></section>}
    <ProductShelf title="Continue garimpando" description="Casa, trabalho, beleza e outras descobertas de diferentes lojas. Consulte os detalhes antes de escolher." href="/ofertas?ate=300" products={feed.slice(12)} limit={36} />
    <div className="my-5 flex flex-wrap items-center justify-between gap-4 border-y border-line py-5">
      <p className="flex max-w-prose items-start gap-2 text-xs leading-5 text-muted"><Clock3 className="mt-0.5 h-4 w-4 shrink-0" /><span>Preços coletados nos últimos 7 dias. Frete, disponibilidade e condições são definidos pela loja. Confira o valor final antes de comprar.</span></p>
      <Link prefetch={false} href="/ofertas" className="shop-action inline-flex min-h-12 items-center gap-4 rounded-lg px-5 text-sm font-semibold">Explorar mais produtos<ArrowUpRight className="h-4 w-4" /></Link>
    </div>
    <section className="grid gap-4 py-5 md:grid-cols-2"><div><h2 className="text-2xl font-semibold">Gostou do preço? Consulte o histórico.</h2><p className="mt-2 text-sm leading-6 text-muted">Promoção boa começa com informação. Compare os preços coletados e as condições de cada loja.</p></div><Link prefetch={false} href="/comparar" className="inline-flex min-h-12 items-center gap-3 text-sm font-semibold text-brand md:justify-end"><Scale className="h-5 w-5" />Abrir comparador<ArrowUpRight className="h-4 w-4" /></Link></section>
    <SavedRadar />
    {quick && <ProductSuggestion product={{ id: quick.id, titulo: quick.titulo, imagemUrl: quick.imagemUrl, precoAtual: quick.precoAtual, lojaNome: quick.lojaNome, lojaSlug: quick.lojaSlug, atualizadoEm: quick.atualizadoEm, precoMinHist: quick.precoMinHist, monetizado: ehLinkMonetizado(quick.url) }} />}
  </main>;
}
