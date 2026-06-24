import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Páginas de máquina/privadas fora do índice; o resto é público. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin", "/onboarding", "/auth/", "/r/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
