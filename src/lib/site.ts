/**
 * URL pública canônica do site — FONTE ÚNICA. Trocar de domínio = mudar aqui
 * (ou setar NEXT_PUBLIC_SITE_URL no ambiente, que tem prioridade).
 *
 * Usada por: metadados/OG (layout), canonical, sitemap, robots e o fallback do
 * redirect OAuth do Mercado Livre.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://promodetec.com.br";
export const SITE_NAME = "PromoDetec";
export const SITE_TITLE = "PromoDetec - Ofertas verificadas em tecnologia, beleza e mais";
export const SITE_DESCRIPTION =
  "Compare preços reais e descubra promoções verificadas de hardware, smartphones, smartwatches, gadgets, perfumes, skincare, cabelo e muito mais.";
export const SITE_KEYWORDS = [
  "promoções",
  "ofertas verificadas",
  "comparador de preços",
  "hardware",
  "smartphones",
  "smartwatches",
  "gadgets",
  "perfumes",
  "skincare",
  "cabelo",
  "beleza",
  "histórico de preços",
];
export const SUPPORT_EMAIL = "suporte@promodetec.com.br";
