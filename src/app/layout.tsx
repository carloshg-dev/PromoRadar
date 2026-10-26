import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { CommandPalette } from "@/components/command-palette";
import { Clarity } from "@/components/analytics/clarity";
import { CookieConsent, PrivacySettings } from "@/components/analytics/cookie-consent";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { Journey } from "@/components/analytics/journey";
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_TITLE, SITE_URL, SUPPORT_EMAIL } from "@/lib/site";


export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  manifest: "/site.webmanifest",
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "PromoDetec - ofertas verificadas em tecnologia, beleza e mais." }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image.png"],
  },
  // Verificação de canal da rede de afiliados Lomadee → <meta name="lomadee" content="...">
  other: { lomadee: "2324685" },
};

export const viewport: Viewport = {
  themeColor: "#f6f7f3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={GeistSans.variable}>
      <body className="min-h-screen font-sans antialiased">
        <Clarity />
        <GoogleAnalytics />
        <Journey />
        <Navbar />
        <CommandPalette />
        {children}
        
        <footer className="mt-10 border-t border-line bg-bg-soft text-sm text-muted">
        <div className="mx-auto max-w-page px-4 py-10 sm:px-6 lg:px-10">
          <div className="mb-8 flex flex-col justify-between gap-6 sm:flex-row sm:items-center"><div><Link prefetch={false} href="/" className="font-display text-2xl font-bold tracking-tight text-ink">Promo<span className="text-brand">Detec.</span></Link><p className="mt-2 text-sm">Detecte. Compare. Escolha.</p></div><Link prefetch={false} href="/comparar" className="inline-flex min-h-11 items-center gap-3 font-medium text-brand hover:underline">Encontre seu próximo bom negócio<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link></div>
          <nav aria-label="Institucional" className="mb-5 flex flex-wrap gap-x-5 gap-y-3">
            <Link prefetch={false} href="/sobre" className="transition hover:text-ink">Sobre</Link>
            <Link prefetch={false} href="/comparar" className="transition hover:text-ink">Comparador</Link>
            <Link prefetch={false} href="/noticias" className="transition hover:text-ink">Notícias</Link>
            <Link prefetch={false} href="/privacidade" className="transition hover:text-ink">Privacidade</Link>
            <PrivacySettings />
            <Link prefetch={false} href="/termos" className="transition hover:text-ink">Termos</Link>
            <Link prefetch={false} href="/contato" className="transition hover:text-ink">Contato</Link>
          </nav>
          <span className="text-xs">© {new Date().getFullYear()} PromoDetec</span>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-2 block text-[11px] text-brand-2 transition hover:text-ink">
            Atendimento: {SUPPORT_EMAIL}
          </a>
          <span className="mt-5 block max-w-[95ch] text-xs leading-6 text-muted">
            O PromoDetec não vende produtos: comparamos preços públicos e direcionamos você à loja oficial.
            Preços e disponibilidade são da loja e podem mudar — ofertas válidas enquanto durarem os estoques.
            Podemos ganhar comissão de afiliado quando você compra pelos nossos links, sem custo extra pra você.
          </span>
        </div></footer>
        <CookieConsent />
      </body>
    </html>
  );
}
