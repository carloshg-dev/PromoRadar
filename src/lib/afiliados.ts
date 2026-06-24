/**
 * Wrapper de links de afiliado. Recebe a URL crua de saída de um produto e
 * devolve a versão MONETIZADA (com o ID de afiliado da rede certa). É aplicado
 * só no clique (rota /r/[id]) — não muda o que é coletado nem o que é exibido,
 * só o destino final. Se a loja não tem afiliação configurada, devolve a URL crua
 * (o usuário sempre chega no produto).
 *
 * Status por rede:
 *   • Amazon Associados → tag `promodetec-20` (ATIVO).
 *   • Lomadee → o produto já é coletado com a URL lmdee.link (afiliada na origem).
 *   • Awin → deeplink awinmid/awinaffid quando os anunciantes forem aprovados
 *     (hoje todos "Pending"); o publisher id 2936727 já está aqui pronto.
 */

const AMAZON_TAG = process.env.AMAZON_ASSOCIATE_TAG || "promodetec-20";
// Publisher (awinaffid) lido do ambiente — conta PJ/MEI. Fallback no ID atual
// (2936727 não é segredo: vai no deeplink público). Garante que 100% da comissão
// cai na conta certa, sem ID antigo hardcoded em cache.
const AWIN_PUBLISHER = process.env.AWIN_PUBLISHER_ID || "2936727";

/**
 * Mapa LOJA (adapter_key) → rede de afiliado ATIVA. Fonte única da verdade p/ o
 * monitor de afiliação (admin + Discord "Lista real de afiliação"). Adicionar a
 * loja aqui quando a afiliação dela for de fato ligada (link embrulhado).
 */
export const REDE_POR_LOJA: Record<string, string> = {
  amazon: "Amazon Associados",
  lomadee: "Lomadee",
  awin: "Awin", // loja AliExpress (feed de produtos Awin)
  // kabum/epocacosmeticos: "Awin" → ligar quando saírem de "Pending" no painel
};

/** Rede de afiliado da loja, ou null se ainda não monetiza. */
export function redeAfiliada(adapterKey: string): string | null {
  return REDE_POR_LOJA[adapterKey] ?? null;
}

/** awinmid por domínio de loja — preencher conforme cada anunciante for APROVADO. */
const AWIN_MIDS: Record<string, string> = {
  "aliexpress.com": process.env["AWIN_MID_AliexpressBR&LATAM"] || "18879", // AliExpress BR & LATAM
  "carrefour.com.br": "17665",   // Carrefour BR — APROVADO via Awin
  "docebeleza.com.br": "76888",  // Doce Beleza BR — APROVADO via Awin
  "sanavita.com.br": "117737",   // Sanavita — APROVADO via Awin
  "panasonic.com.br": "78382",   // Panasonic BR — APROVADO via Awin
  // "kabum.com.br": "XXXX",     // Kabum — em análise (Pending)
};

export function linkAfiliado(url: string, _lojaSlug?: string | null): string {
  let u: URL;
  try { u = new URL(url); } catch { return url; }
  const host = u.hostname.replace(/^www\./, "").toLowerCase();

  // Já é link de afiliado pronto → não mexe (Lomadee encurtado; Shopee manual).
  // Shopee: a Open API deles ainda não liberou pra gente, então os links curtos
  // shope.ee/... entram como URL final estática (já carregam o afiliado embutido).
  if (host === "lmdee.link" || host === "awin1.com" || host === "shope.ee" || host.endsWith("shopee.com.br")) return url;

  // Amazon Associados — tag no fim da URL.
  if (host === "amazon.com.br" || host.endsWith(".amazon.com.br") || host === "amzn.to") {
    u.searchParams.set("tag", AMAZON_TAG);
    return u.toString();
  }

  // Awin — deeplink quando a loja tem MID aprovado.
  const mid = AWIN_MIDS[host];
  if (mid) {
    const ued = encodeURIComponent(u.toString());
    return `https://www.awin1.com/cread.php?awinmid=${mid}&awinaffid=${AWIN_PUBLISHER}&ued=${ued}`;
  }

  return url;
}
