/**
 * URL pública canônica do site — FONTE ÚNICA. Trocar de domínio = mudar aqui
 * (ou setar NEXT_PUBLIC_SITE_URL no ambiente, que tem prioridade).
 *
 * Usada por: metadados/OG (layout), canonical, sitemap, robots e o fallback do
 * redirect OAuth do Mercado Livre.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.promodetec.com.br";
