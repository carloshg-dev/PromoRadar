import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { top5DoDia, type AchadoDoDia } from "@/infrastructure/repositories/produtos.repo";
import { montarCampanha } from "./campaign.service";
import { MARKETING_PRICE_LIMIT } from "@/core/catalog-policy";
import { collectionForTitle } from "@/core/shop-collections";

/** Texto público somente com dados reais; o arquivo não contém destinatários ou contatos. */
export function montarRascunho(product: AchadoDoDia, channel: "telegram" | "whatsapp") {
  const campaign = montarCampanha(product);
  const base = `https://promodetec.com.br/produto/${encodeURIComponent(product.id)}`;
  const link = new URL(base);
  link.search = new URLSearchParams({ utm_source: channel, utm_medium: "social", utm_campaign: "achados_do_dia" }).toString();
  return { channel, productId: product.id, title: product.titulo, store: product.lojaNome,
    priceBRL: product.precoAtual, collectedAt: product.atualizadoEm, image: product.imagemUrl,
    link: link.href, text: campaign.legenda.replace(base, link.href) };
}

/** Prévia de leitura: não cria campanhas, não muda status e não publica mensagens. */
export async function prepararRascunhos(directory = "reports/marketing-drafts") {
  const products = await top5DoDia(5, 0, MARKETING_PRICE_LIMIT);
  const drafts = products.flatMap(product => [montarRascunho(product, "telegram"), montarRascunho(product, "whatsapp")]);
  const report = { generatedAt: new Date().toISOString(), published: false, databaseWrites: false,
    selection: "Até cinco escolhas de uma amostra limitada de 400 produtos; não são os menores preços de todo o mercado.",
    products: products.length, drafts,
    suggestedHero: products.filter(p => collectionForTitle(p.titulo) || ["perfumes-importados", "perfumes-arabes", "skincare", "maquiagem", "cabelos"].includes(p.categoriaSlug ?? "")).slice(0, 3).map(p => ({ title: p.titulo, priceBRL: p.precoAtual, store: p.lojaNome, collectedAt: p.atualizadoEm, link: `https://promodetec.com.br/produto/${encodeURIComponent(p.id)}` })),
    limits: ["Rascunhos exigem revisão e destino autorizado antes de enviar", "WhatsApp preparado para publicação manual em canal da marca", "UTMs identificam os links; atribuição de vendas por canal depende dos relatórios das centrais", "Preço, estoque e frete são confirmados na loja", "Sugestões do hero não foram aplicadas ao site"],
  };
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "drafts.json"), JSON.stringify(report, null, 2) + "\n");
  for (const channel of ["telegram", "whatsapp"] as const) {
    const messages = drafts.filter(draft => draft.channel === channel).map((draft, index) => `POST ${index + 1} — RASCUNHO\n\n${draft.text}`);
    await writeFile(join(directory, `${channel}.txt`), messages.join("\n\n────────────────────────\n\n") + "\n");
  }
  await writeFile(join(directory, "README.md"), `# Prévia de divulgação PromoDetec\n\nGerada em ${report.generatedAt}. ${products.length} produtos reais. Nenhum envio ou escrita no banco.\n\n${report.limits.map(limit => `- ${limit}`).join("\n")}\n\nOs arquivos telegram.txt e whatsapp.txt contêm textos prontos para revisão.\n`);
  return { products: products.length, drafts: drafts.length, published: false, databaseWrites: false, directory };
}
