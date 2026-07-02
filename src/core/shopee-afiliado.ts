/**
 * AFILIADO SHOPEE — módulo isolado (Núcleo Central + Módulos). Envelopa a URL crua
 * de um produto Shopee com o rastreio de afiliado do dono, espelhando os parâmetros
 * do link oficial do painel (validado em 02/07/2026 expandindo 2 links reais gerados
 * pelo dono em "Gerar Link"):
 *
 *   utm_source=an_<id>    → a CHAVE da atribuição de comissão
 *   utm_medium=affiliates
 *   mmp_pid=an_<id>       → atribuição quando o clique abre o APP da Shopee
 *   utm_content=<sub_ids> → Sub_id1..5 do painel, separados por "-". Usamos
 *                           Sub_id1=promodetec pra etiquetar o tráfego do site
 *                           nos relatórios do painel.
 *
 * NÃO incluímos utm_campaign (no link real é um token por-link do servidor da
 * Shopee, ex. "id_HJuBpdgLSl" — impossível fabricar; valor inventado só polui)
 * nem uls_trackid/utm_term/gads_t_sig (tokens criptográficos por clique, idem).
 *
 * POR QUÊ o módulo existe: o datafeed traz `product_link` CRU (shopee.com.br/product/..)
 * e um `product_short link` = `shope.ee/an_redir?origin_link=<cru>` que é um redirect
 * GENÉRICO, SEM o ID de ninguém. Salvar isso = clique não atribui = 0 comissão.
 *
 * Mudou o formato de atribuição da Shopee? Edita SÓ este arquivo.
 */

/** Sub_id1 fixo — etiqueta o tráfego do site nos relatórios do painel Shopee. */
const SUB_ID1 = "promodetec";

/** Extrai o link CRU do produto: se vier o an_redir da Shopee, pega o `origin_link`. */
function urlCruaDoProduto(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    if (u.hostname.toLowerCase() === "shope.ee" && u.pathname.includes("an_redir")) {
      const origin = u.searchParams.get("origin_link");
      if (origin) {
        // searchParams.get já decodifica 1x; feeds double-encoded precisam de mais 1.
        try { return decodeURIComponent(origin); } catch { return origin; }
      }
    }
  } catch { /* url inválida → devolve como veio */ }
  return rawUrl;
}

/**
 * Devolve a URL do produto Shopee com o rastreio do afiliado embutido. Sem o ID
 * (env ausente), devolve a URL crua — o chamador decide o fallback.
 */
export function linkShopeeAfiliado(rawUrl: string, afId: string | null | undefined): string {
  if (!afId) return rawUrl;
  try {
    const u = new URL(urlCruaDoProduto(rawUrl));
    if (!/shopee\.com\.br$/i.test(u.hostname.replace(/^www\./, ""))) return rawUrl;
    const an = `an_${afId}`;
    u.searchParams.set("utm_source", an);
    u.searchParams.set("utm_medium", "affiliates");
    u.searchParams.set("utm_content", `${SUB_ID1}----`); // Sub_id1..5 separados por "-"
    u.searchParams.set("mmp_pid", an);
    return u.toString();
  } catch {
    return rawUrl;
  }
}

/** ID de afiliado Shopee lido do ambiente (SHOPEE_AFFILIATE_ID). */
export function shopeeAffiliateId(): string | null {
  return process.env.SHOPEE_AFFILIATE_ID?.trim() || null;
}
