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
 *   • Shopee → rastreio embutido na COLETA (src/core/shopee-afiliado.ts) → passa direto.
 *   • Awin → ATIVO: 12 anunciantes aprovados (fonte única src/core/awin-anunciantes.ts);
 *     produtos do feed já chegam com aw_deep_link; o wrapper cobre links manuais.
 */

import { midsPorDominio } from "@/core/awin-anunciantes";

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
  mercadolivre: "Mercado Livre Afiliados", // dono é afiliado OFICIAL (links meli.la por produto)
  lomadee: "Lomadee",  // lojas multi-loja (Sieno, Bio Bran, Casa do Fitness…)
  awin: "Awin",        // lojas do feed multi-loja (AliExpress, Panasonic, Extra…)
  carrefour: "Awin",   // scraper VTEX intelligent-search; deeplink Awin mid 17665 no /r/
  kabum: "Awin",       // scraper API interna; deeplink Awin mid 17729 no /r/ (aprovada 11/07)
  diesel: "Awin",      // cron próprio (scripts/ingest-awin-diesel.js), mesma rede
  shopee: "Shopee Afiliados", // rastreio embutido na coleta (an_18318451097)
};

/** Rede de afiliado da loja, ou null se ainda não monetiza. */
export function redeAfiliada(adapterKey: string): string | null {
  return REDE_POR_LOJA[adapterKey] ?? null;
}

/** awinmid por domínio — gerado da fonte única src/core/awin-anunciantes.ts (12
 *  anunciantes aprovados). Anunciante novo = 1 entrada lá, e o wrapper acompanha. */
const AWIN_MIDS: Record<string, string> = midsPorDominio();

/**
 * Mercado Livre — links de afiliado gerados no PAINEL (meli.la), 1 por produto.
 * Não há API pública pra cunhar link nem "tag" stateless como a Amazon: o código
 * meli.la é OPACO (gerado no servidor do ML). Logo, não dá pra COMPUTAR o link a
 * partir da URL — só PROCURAR neste mapa (MLB id → link manual). Popular conforme
 * o dono gera no painel. Automação real de verdade só com a API ML Afiliados.
 */
const ML_AFILIADO: Record<string, string> = {
  // "MLB56655816": "https://meli.la/2MTTvCN",  // exemplo de entrada (MLB id → meli.la)
};

/** Extrai o id de catálogo/anúncio (MLB + dígitos) de uma URL do Mercado Livre, ou null. */
function extrairMLB(u: URL): string | null {
  const m = (u.pathname + u.search).toUpperCase().match(/MLB-?(\d{6,})/);
  return m ? `MLB${m[1]}` : null;
}

export function linkAfiliado(url: string, _lojaSlug?: string | null): string {
  let u: URL;
  try { u = new URL(url); } catch { return url; }
  const host = u.hostname.replace(/^www\./, "").toLowerCase();

  // Já é link de afiliado pronto → não mexe (Lomadee encurtado; Shopee manual).
  // Shopee: a Open API deles ainda não liberou pra gente, então os links curtos
  // shope.ee/... entram como URL final estática (já carregam o afiliado embutido).
  if (host === "lmdee.link" || host === "awin1.com" || host === "meli.la" || host === "shope.ee" || host.endsWith("shopee.com.br")) return url;

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

  // Mercado Livre — só PROCURA o link manual (meli.la) no mapa por MLB id. Sem
  // entrada → devolve a URL crua e o "Dois Níveis" capa o CTA na vitrine.
  if (host === "mercadolivre.com.br" || host.endsWith(".mercadolivre.com.br")
      || host === "mercadolibre.com.br" || host.endsWith(".mercadolibre.com.br")) {
    const mlb = extrairMLB(u);
    if (mlb && ML_AFILIADO[mlb]) return ML_AFILIADO[mlb];
    return url;
  }

  return url;
}

/**
 * O link de SAÍDA deste produto carrega o nosso ID de afiliado? Fonte única da
 * verdade do modelo "Dois Níveis": true → CTA "Ver oferta" (redirect /r/);
 * false → CTA capado "Comparar preço" (sem redirect externo). Decide pela URL,
 * não pelo slug da loja (que diverge do adapter_key no banco).
 */
export function ehLinkMonetizado(url: string | null | undefined): boolean {
  if (!url) return false;
  let u: URL;
  try { u = new URL(url); } catch { return false; }
  const host = u.hostname.replace(/^www\./, "").toLowerCase();
  // já vem como link de afiliado pronto
  if (host === "lmdee.link" || host === "awin1.com" || host === "meli.la"
      || host === "shope.ee" || host.endsWith("shopee.com.br")) return true;
  // Amazon (tag) e Awin (MID aprovado) — embrulháveis no clique
  if (host === "amazon.com.br" || host.endsWith(".amazon.com.br") || host === "amzn.to") return true;
  if (AWIN_MIDS[host]) return true;
  // Mercado Livre — sempre monetizado. O linkAfiliado() embrulha com meli.la
  // quando há entrada manual no mapa; senão, redireciona à URL crua do produto
  // (o usuário sempre chega na loja — mesma experiência de Shopee/Awin).
  if (host === "mercadolivre.com.br" || host.endsWith(".mercadolivre.com.br")
      || host === "mercadolibre.com.br" || host.endsWith(".mercadolibre.com.br")) {
    return true;
  }
  return false;
}
