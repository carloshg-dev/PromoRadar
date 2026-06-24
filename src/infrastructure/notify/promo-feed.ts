/**
 * Feed de promoções para os USUÁRIOS (Telegram + Discord público).
 *
 * Diferente do `avisarDiscordColeta` (que avisa o DONO sobre a saúde da coleta),
 * aqui anunciamos as OFERTAS NOVAS detectadas na rodada — só quando o preço
 * realmente CAIU em relação à observação anterior (auto-dedup: não repete a cada
 * coleta, só dispara em queda real). Canais lidos do ambiente; ausentes = no-op.
 *
 * Variáveis de ambiente (opcionais — sem elas, nada é enviado):
 *   • TELEGRAM_BOT_TOKEN + TELEGRAM_FEED_CHAT_ID → canal PÚBLICO de ofertas no Telegram
 *   • DISCORD_DEALS_WEBHOOK_URL                  → webhook de um canal público de ofertas
 *
 * (As mensagens de OPERAÇÃO do dono — coletas/cadastros — são outro módulo,
 * `owner.ts`, com TELEGRAM_CHAT_ID/DISCORD_WEBHOOK_URL próprios — não se misturam.)
 */

export interface DealNovo {
  titulo: string;
  lojaNome: string;
  url: string;
  precoAtual: number;
  precoAnterior: number;
  /** queda (%) em relação ao preço anterior — a "magnitude" da promoção nova */
  quedaPct: number;
  score: number;
}

const SITE = "https://promodetec.vercel.app";
const fmt = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Anuncia as melhores ofertas novas da rodada nos canais de usuário. */
export async function avisarPromocoesNovas(deals: DealNovo[]): Promise<void> {
  if (!deals.length) return;
  // melhores primeiro: maior score, depois maior queda
  const top = [...deals].sort((a, b) => b.score - a.score || b.quedaPct - a.quedaPct).slice(0, 8);
  await Promise.allSettled([enviarTelegram(top), enviarDiscordDeals(top)]);
}

async function enviarTelegram(deals: DealNovo[]): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_FEED_CHAT_ID;
  if (!token || !chat) return;

  const linhas = deals.map((d) =>
    `🔥 <b>${escHtml(d.titulo)}</b>\n` +
    `${fmt(d.precoAtual)} <s>${fmt(d.precoAnterior)}</s> · −${d.quedaPct}% · ${escHtml(d.lojaNome)} · score ${d.score}\n` +
    `<a href="${d.url}">ver oferta »</a>`,
  ).join("\n\n");
  const text = `🛰️ <b>Novas promoções no PromoDetec</b>\n\n${linhas}\n\n${SITE}`;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: text.slice(0, 4000), parse_mode: "HTML", disable_web_page_preview: true }),
    });
  } catch { /* nunca derruba a coleta */ }
}

async function enviarDiscordDeals(deals: DealNovo[]): Promise<void> {
  const url = process.env.DISCORD_DEALS_WEBHOOK_URL;
  if (!url) return;

  const linhas = deals.map((d) =>
    `🔥 **${d.titulo}**\n${fmt(d.precoAtual)} ~~${fmt(d.precoAnterior)}~~ · −${d.quedaPct}% · ${d.lojaNome} · score ${d.score}\n<${d.url}>`,
  ).join("\n\n");
  const content = `🛰️ **Novas promoções**\n\n${linhas}`;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.slice(0, 1900), username: "PromoDetec Ofertas" }),
    });
  } catch { /* nunca derruba a coleta */ }
}
