import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";
import { PrivacySettings } from "@/components/analytics/cookie-consent";
import { SUPPORT_EMAIL } from "@/lib/site";

const navigation = [
  {
    title: "Explore",
    links: [
      { href: "/ofertas", label: "Ofertas" },
      { href: "/comparar", label: "Comparador" },
      { href: "/cupons", label: "Cupons" },
      { href: "/noticias", label: "Notícias" },
    ],
  },
  {
    title: "Institucional",
    links: [
      { href: "/sobre", label: "Sobre" },
      { href: "/contato", label: "Contato" },
      { href: "/privacidade", label: "Privacidade" },
      { href: "/termos", label: "Termos" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer aria-label="Rodapé do PromoDetec" className="mt-12 bg-ink text-white">
      <div className="mx-auto max-w-page px-4 sm:px-6 lg:px-10">
        <div className="grid gap-x-6 gap-y-8 py-8 sm:grid-cols-2 sm:gap-y-10 sm:py-12 lg:grid-cols-12 lg:py-14">
          <div className="lg:col-span-4">
            <Link prefetch={false} href="/" aria-label="PromoDetec — início" className="inline-flex min-h-11 items-center font-display text-3xl font-semibold tracking-tight focus-visible:outline-lime">
              Promo<span className="text-lime">Detec.</span>
            </Link>
            <p className="mt-1 text-sm leading-6 text-white/70">Detecte. Compare. Escolha.</p>
            <h2 className="mt-6 max-w-[19ch] font-display text-2xl font-medium leading-tight tracking-tight sm:text-3xl">
              Encontre seu próximo bom negócio.
            </h2>
            <Link prefetch={false} href="/comparar" className="mt-5 inline-flex min-h-11 items-center justify-center gap-5 rounded-lg bg-lime px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-white focus-visible:outline-lime">
              Comparar preços<ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-6 lg:col-span-4">
            {navigation.map(group => (
              <nav key={group.title} aria-label={group.title}>
                <h2 className="mb-3 text-sm font-semibold leading-6">{group.title}</h2>
                <ul>
                  {group.links.map(link => (
                    <li key={link.href}>
                      <Link prefetch={false} href={link.href} className="inline-flex min-h-11 items-center py-2 text-sm leading-6 text-white/75 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-lime">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <div className="border-t border-white/15 pt-6 sm:col-span-2 sm:grid sm:grid-cols-2 sm:gap-6 lg:col-span-4 lg:block lg:border-t-0 lg:pl-6 lg:pt-0">
            <div>
              <h2 className="text-sm font-semibold leading-6">Atendimento</h2>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-3 flex min-h-11 w-fit max-w-full items-center gap-3 py-2 text-sm leading-6 text-white/75 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-lime">
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="break-all">{SUPPORT_EMAIL}</span>
              </a>
            </div>
            <div className="mt-5 border-t border-white/15 pt-4 sm:mt-0 sm:border-t-0 sm:pt-0 lg:mt-5 lg:border-t lg:pt-4">
              <PrivacySettings />
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-t border-white/15 py-6 text-xs leading-5 text-white/70 sm:leading-6 lg:grid-cols-12 lg:gap-6">
          <p className="lg:col-span-4">© {new Date().getFullYear()} PromoDetec</p>
          <p className="max-w-[90ch] lg:col-span-8">
            O PromoDetec não vende produtos: comparamos preços públicos e direcionamos você à loja oficial.{" "}
            Preços e disponibilidade são da loja e podem mudar — ofertas válidas enquanto durarem os estoques.{" "}
            Podemos ganhar comissão de afiliado quando você compra pelos nossos links, sem custo extra pra você.
          </p>
        </div>
      </div>
    </footer>
  );
}
