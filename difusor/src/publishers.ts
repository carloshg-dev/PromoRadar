import { config } from "./config";
import type { Oferta } from "./feed";
import { captionTelegram, embedDiscord } from "./format";

export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function tg(metodo: string, body: Record<string, unknown>): Promise<void> {
  const res = await fetch(`https://api.telegram.org/bot${config.telegram.token}/${metodo}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { ok: boolean; description?: string };
  if (!json.ok) throw new Error(`Telegram ${metodo}: ${json.description ?? res.status}`);
}

/** Publica no canal do Telegram: card com foto quando ha imagem; senao, texto. */
export async function publicarTelegram(o: Oferta): Promise<void> {
  if (!config.telegram.token || !config.telegram.chatId) return;
  const base = { chat_id: config.telegram.chatId, parse_mode: "HTML" as const };
  if (o.imagemUrl) {
    try {
      await tg("sendPhoto", { ...base, photo: o.imagemUrl, caption: captionTelegram(o) });
      return;
    } catch {
      // Imagem que o Telegram nao conseguiu baixar -> cai pro texto, nunca perde a oferta.
    }
  }
  await tg("sendMessage", { ...base, text: captionTelegram(o), disable_web_page_preview: false });
}

/** Publica no canal do Discord via webhook (embed com imagem). */
export async function publicarDiscord(o: Oferta): Promise<void> {
  if (!config.discordWebhook) return;
  const res = await fetch(config.discordWebhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "PromoDetec Ofertas", embeds: [embedDiscord(o)] }),
  });
  if (!res.ok && res.status !== 204) throw new Error(`Discord webhook: ${res.status}`);
}

/** Publica em todos os canais; um canal que falha nao derruba o outro. */
export async function publicar(o: Oferta): Promise<void> {
  const r = await Promise.allSettled([publicarTelegram(o), publicarDiscord(o)]);
  const rejeitados = r.filter((x): x is PromiseRejectedResult => x.status === "rejected");
  for (const e of rejeitados) console.warn(`   ⚠️  ${String(e.reason?.message ?? e.reason)}`);
  if (rejeitados.length === r.length) throw new Error("todos os canais falharam");
}
