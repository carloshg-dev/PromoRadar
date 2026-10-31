import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CommandPalette } from "@/components/command-palette";
import { Clarity } from "@/components/analytics/clarity";
import { CookieConsent } from "@/components/analytics/cookie-consent";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { Journey } from "@/components/analytics/journey";
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
import { CampaignProvider } from "@/components/campaign-provider";
import { scriptTemaSazonal, temaSazonal } from "@/lib/seasonal";


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
  const theme = temaSazonal();
  return (
    <html lang="pt-BR" className={GeistSans.variable} data-campaign={theme?.id ?? "neutro"} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: scriptTemaSazonal() }} /></head>
      <body className="min-h-screen font-sans antialiased">
        <CampaignProvider initialTheme={theme}>
        <Clarity />
        <GoogleAnalytics />
        <Journey />
        <Navbar />
        <CommandPalette />
        {children}
        <Footer />
        <CookieConsent />
        </CampaignProvider>
      </body>
    </html>
  );
}
