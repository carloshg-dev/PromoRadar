import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { TODAS_CATEGORIAS } from "@/lib/navigation";
import { listarUrlsProdutos } from "@/infrastructure/repositories/produtos.repo";

export const revalidate = 86400;

/** Sitemap: páginas estáticas + uma URL por categoria de cada vertical. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const estaticas = ["", "/ofertas", "/comparar", "/cupons", "/noticias", "/sobre"].map((p) => ({
    url: `${SITE_URL}${p}`,
    changeFrequency: "daily" as const,
    priority: p === "" ? 1 : 0.8,
  }));
  const categorias = TODAS_CATEGORIAS.map((c) => ({
    url: `${SITE_URL}/categoria/${c.slug}`,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));
  const products = await listarUrlsProdutos();
  const urls = products.map((product) => ({
    url: `${SITE_URL}/produto/${product.id}`,
    ...(Number.isFinite(Date.parse(product.atualizadoEm)) ? { lastModified: new Date(product.atualizadoEm) } : {}),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));
  return [...estaticas, ...categorias, ...urls];
}
