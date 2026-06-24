import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Script from "next/script";
import { Inter, JetBrains_Mono } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { CommandPalette } from "@/components/command-palette";
import { Clarity } from "@/components/analytics/clarity";
import { CookieConsent } from "@/components/analytics/cookie-consent";
import { SeasonalRibbon } from "@/components/seasonal-ribbon";
import { SITE_URL } from "@/lib/site";

// Geist (display) via pacote oficial self-hosted; Inter (corpo) e JetBrains (mono)
// via next/font/google. Geist não existe em next/font/google nesta versão do Next.
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "PromoDetec — Inteligência de Promoções de Hardware", template: "%s · PromoDetec" },
  description: "Monitore preços reais de hardware, detecte falsos descontos e descubra oportunidades com o PromoScore.",
  keywords: ["promoções", "hardware", "placa de vídeo", "histórico de preços", "kabum", "pichau", "terabyte", "mercado livre"],
  manifest: "/site.webmanifest",
  applicationName: "PromoDetec",
  openGraph: {
    type: "website",
    siteName: "PromoDetec",
    url: SITE_URL,
    title: "PromoDetec — Inteligência de Promoções de Hardware",
    description: "Preços reais, histórico próprio e PromoScore: a oportunidade antes do mercado.",
    images: [{ url: "/logo.png", width: 1536, height: 1024, alt: "PromoDetec — Detecte. Compare. Economize." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PromoDetec — Inteligência de Promoções de Hardware",
    description: "Preços reais, histórico próprio e PromoScore: a oportunidade antes do mercado.",
    images: ["/logo.png"],
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
        <SeasonalRibbon />
        <Navbar />
        <CommandPalette />
        {children}
        
        {/* Google Analytics */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-Z49LMP5ZKT"
        />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-Z49LMP5ZKT');
          `}
        </Script>

        <footer className="mx-auto max-w-page px-4 py-10 text-center text-xs text-muted sm:px-6 lg:px-10">
          <nav className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link href="/sobre" className="transition hover:text-zinc-200">Sobre</Link>
            <Link href="/comparar" className="transition hover:text-zinc-200">Comparador</Link>
            <Link href="/noticias" className="transition hover:text-zinc-200">Notícias</Link>
            <Link href="/privacidade" className="transition hover:text-zinc-200">Privacidade</Link>
            <Link href="/termos" className="transition hover:text-zinc-200">Termos</Link>
            <Link href="/contato" className="transition hover:text-zinc-200">Contato</Link>
          </nav>
          PromoDetec · detecte, compare, economize · {new Date().getFullYear()}
          <span className="mt-1 block text-[10px] text-muted/70">
            O PromoDetec não vende produtos: comparamos preços públicos e direcionamos você à loja oficial.
            Preços e disponibilidade são da loja e podem mudar — ofertas válidas enquanto durarem os estoques.
            Podemos ganhar comissão de afiliado quando você compra pelos nossos links, sem custo extra pra você.
          </span>
        </footer>
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  );
}