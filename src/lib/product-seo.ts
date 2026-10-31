import type { Metadata } from "next";
import type { Produto } from "@/core/domain/types";
import { SITE_URL, SITE_NAME } from "./site";
import { formatBRL } from "./utils";
import { hasRecentPrice } from "@/core/offer-freshness";
import { verifiedBrlPrice } from "@/core/catalog-policy";

export function productMetadata(product: Produto): Metadata {
  const url = `${SITE_URL}/produto/${product.id}`;
  const description = `${product.titulo}. ${verifiedBrlPrice(product.lojaSlug) && product.precoAtual && product.precoAtual > 0 ? `Preço coletado: ${formatBRL(product.precoAtual)} em ${product.lojaNome}. ` : ""}Consulte o histórico disponível e compare antes de comprar.`.slice(0, 280);
  const image = product.imagemUrl && /^https?:\/\//.test(product.imagemUrl) ? product.imagemUrl : `${SITE_URL}/opengraph-image.png`;
  return {
    title: product.titulo.slice(0, 100), description,
    alternates: { canonical: url },
    openGraph: { type: "website", siteName: SITE_NAME, title: product.titulo, description, url, images: [{ url: image, alt: product.titulo }] },
    twitter: { card: "summary_large_image", title: product.titulo, description, images: [image] },
  };
}

export function productStructuredData(product: Produto, now = Date.now()): unknown[] {
  const url = `${SITE_URL}/produto/${product.id}`;
  return [{
    "@context": "https://schema.org", "@type": "Product", "@id": `${url}#product`,
    name: product.titulo, url,
    ...(product.imagemUrl && /^https?:\/\//.test(product.imagemUrl) ? { image: [product.imagemUrl] } : {}),
    ...(product.marca ? { brand: { "@type": "Brand", name: product.marca } } : {}),
    ...(verifiedBrlPrice(product.lojaSlug) && hasRecentPrice(product.atualizadoEm, now) && product.precoAtual !== null && Number.isFinite(product.precoAtual) && product.precoAtual > 0 ? {
      offers: { "@type": "Offer", url, priceCurrency: "BRL", price: product.precoAtual,
        availability: `https://schema.org/${product.emEstoque ? "InStock" : "OutOfStock"}`,
        seller: { "@type": "Organization", name: product.lojaNome } },
    } : {}),
  }, {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
      ...(product.categoriaSlug ? [{ "@type": "ListItem", position: 2, name: product.categoriaNome ?? "Categoria", item: `${SITE_URL}/categoria/${product.categoriaSlug}` }] : []),
      { "@type": "ListItem", position: product.categoriaSlug ? 3 : 2, name: product.titulo, item: url },
    ],
  }];
}

export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
