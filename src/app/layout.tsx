import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Inter, JetBrains_Mono } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { CommandPalette } from "@/components/command-palette";
import { Clarity } from "@/components/analytics/clarity";
import { CookieConsent, PrivacySettings } from "@/components/analytics/cookie-consent";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { Journey } from "@/components/analytics/journey";
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_TITLE, SITE_URL, SUPPORT_EMAIL } from "@/lib/site";

// Geist (display) via pacote oficial self-hosted; Inter (corpo) e JetBrains (mono)
// via next/font/google. Geist não existe em next/font/google nesta versão do Next.
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

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
  themeColor: "#0A0A0C",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${mono.variable} ${GeistSans.variable} dark`}>
      <body className="min-h-screen font-sans antialiased">
        <Clarity />
        <GoogleAnalytics />
        <Journey />
        <Navbar />
        <CommandPalette />
        {children}
        
        <footer className="mx-auto max-w-page px-4 py-10 text-center text-xs text-muted sm:px-6 lg:px-10">
          <nav className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link prefetch={false} href="/sobre" className="transition hover:text-zinc-200">Sobre</Link>
            <Link prefetch={false} href="/comparar" className="transition hover:text-zinc-200">Comparador</Link>
            <Link prefetch={false} href="/noticias" className="transition hover:text-zinc-200">Notícias</Link>
            <Link prefetch={false} href="/privacidade" className="transition hover:text-zinc-200">Privacidade</Link>
            <PrivacySettings />
            <Link prefetch={false} href="/termos" className="transition hover:text-zinc-200">Termos</Link>
            <Link prefetch={false} href="/contato" className="transition hover:text-zinc-200">Contato</Link>
          </nav>
          PromoDetec · detecte, compare, economize · {new Date().getFullYear()}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-2 block text-[11px] text-brand-2 transition hover:text-white">
            Atendimento: {SUPPORT_EMAIL}
          </a>
          <span className="mt-1 block text-[10px] text-muted/70">
            O PromoDetec não vende produtos: comparamos preços públicos e direcionamos você à loja oficial.
            Preços e disponibilidade são da loja e podem mudar — ofertas válidas enquanto durarem os estoques.
            Podemos ganhar comissão de afiliado quando você compra pelos nossos links, sem custo extra pra você.
          </span>
        </footer>
        <CookieConsent />
      </body>
    </html>
  );
}
