import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { TODAS_CATEGORIAS } from "@/lib/navigation";

/** Sitemap: páginas estáticas + uma URL por categoria de cada vertical. */
export default function sitemap(): MetadataRoute.Sitemap {
  const estaticas = ["", "/ofertas", "/comparar", "/noticias"].map((p) => ({
    url: `${SITE_URL}${p}`,
    changeFrequency: "daily" as const,
    priority: p === "" ? 1 : 0.8,
  }));
  const categorias = TODAS_CATEGORIAS.map((c) => ({
    url: `${SITE_URL}/categoria/${c.slug}`,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));
  return [...estaticas, ...categorias];
}
