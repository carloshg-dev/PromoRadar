import { config } from "./config";
import type { Oferta } from "./feed";

/** Formatacao dos cards. Marca consistente em todo post = reconhecimento do nome. */

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const fmtPreco = (n: number | null): string => (n == null ? "—" : BRL.format(n));

const escHtml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Link PUBLICO rastreado: /r/{id} loga o clique (tabela cliques) e embrulha o
 * afiliado — a MESMA rota que o site usa. `o` marca a origem do clique, entao
 * voce ve na tabela cliques QUAL canal converte (tg = Telegram, dc = Discord).
 */
export const linkRastreado = (id: string, origem: "tg" | "dc"): string =>
  `${config.siteUrl}/r/${id}?o=${origem}`;

const selo = (o: Oferta): string => (o.promoScore != null ? ` · 🔎 score ${Math.round(o.promoScore)}` : "");
const descontoTxt = (o: Oferta): string => (o.descontoPct != null ? ` (−${Math.round(o.descontoPct)}%)` : "");
const temDePor = (o: Oferta): boolean =>
  Boolean(o.precoOriginal && o.precoAtual && o.precoOriginal > o.precoAtual);

/** Legenda do card no Telegram (HTML, cortada em 1024 chars do sendPhoto). */
export function captionTelegram(o: Oferta): string {
  const emoji = o.categoriaEmoji ? `${o.categoriaEmoji} ` : "";
  const preco = temDePor(o)
    ? `${fmtPreco(o.precoAtual)} <s>${fmtPreco(o.precoOriginal)}</s>${descontoTxt(o)}`
    : fmtPreco(o.precoAtual);
  return (
    `🔥 <b>${escHtml(o.titulo)}</b>\n` +
    `💸 ${preco}\n` +
    `${emoji}🏪 ${escHtml(o.lojaNome)}${selo(o)}\n\n` +
    `👉 <a href="${linkRastreado(o.id, "tg")}">Pegar oferta no PromoDetec »</a>\n\n` +
    `🛰️ <i>PromoDetec — a gente investiga, voce economiza.</i>`
  ).slice(0, 1024);
}

/** Embed do Discord: card com imagem grande e link rastreado. */
export function embedDiscord(o: Oferta): Record<string, unknown> {
  const link = linkRastreado(o.id, "dc");
  const partes = [`💸 **${fmtPreco(o.precoAtual)}**`];
  if (temDePor(o)) partes.push(`~~${fmtPreco(o.precoOriginal)}~~${descontoTxt(o)}`);
  partes.push(`🏪 ${o.lojaNome}${selo(o)}`);
  return {
    title: o.titulo.slice(0, 250),
    url: link,
    description: `${partes.join(" · ")}\n\n👉 [Pegar oferta no PromoDetec »](${link})`,
    color: config.brandColor,
    image: o.imagemUrl ? { url: o.imagemUrl } : undefined,
    footer: { text: "PromoDetec — a gente investiga, voce economiza." },
  };
}
