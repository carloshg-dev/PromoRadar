/**
 * Diagnóstico do Telegram. Uso:
 *   npm run tg         -> verifica o token, descobre chat_ids e (se houver
 *                         TELEGRAM_CHAT_ID) manda uma mensagem de teste.
 *
 * Passo a passo:
 *   1. Crie o bot no @BotFather → copie o TOKEN para .env.local (TELEGRAM_BOT_TOKEN=...).
 *   2. Crie um CANAL, adicione @PROMODETEC_BOT como ADMINISTRADOR (com permissão de
 *      "Publicar mensagens"). Poste qualquer coisa no canal.
 *   3. Rode `npm run tg` SEM TELEGRAM_CHAT_ID → ele lista os chats que o bot enxerga
 *      (procure o "id" do seu canal, algo como -1001234567890). Copie para .env.local
 *      em TELEGRAM_CHAT_ID=... (ou use @seucanal se o canal for público).
 *   4. Rode `npm run tg` de novo → deve chegar uma mensagem de teste no canal. 🎉
 */
import { config } from "dotenv";
config({ path: ".env.local" });

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT = process.env.TELEGRAM_CHAT_ID;

async function tg<T = unknown>(metodo: string, body?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${metodo}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return (await res.json()) as T;
}

async function main() {
  if (!TOKEN) {
    console.error("❌ Falta TELEGRAM_BOT_TOKEN no .env.local (pegue com o @BotFather).");
    process.exit(1);
  }

  const me = await tg<{ ok: boolean; result?: { username?: string }; description?: string }>("getMe");
  if (!me.ok) { console.error("❌ Token inválido:", me.description); process.exit(1); }
  console.log(`✅ Bot OK: @${me.result?.username}`);

  if (!CHAT) {
    console.log("\nℹ️  TELEGRAM_CHAT_ID ainda não definido. Procurando chats visíveis ao bot…");
    const up = await tg<{ ok: boolean; result?: Array<Record<string, any>> }>("getUpdates");
    const chats = new Map<string, string>();
    for (const u of up.result ?? []) {
      const c = u.message?.chat ?? u.channel_post?.chat ?? u.my_chat_member?.chat;
      if (c?.id) chats.set(String(c.id), `${c.title ?? c.username ?? c.type} (${c.type})`);
    }
    if (chats.size) {
      console.log("\n📋 Chats encontrados (copie o id para TELEGRAM_CHAT_ID):");
      for (const [id, nome] of chats) console.log(`   ${id}  →  ${nome}`);
    } else {
      console.log("   (nenhum) — adicione o bot ao canal como ADMIN e poste algo lá; depois rode de novo.");
    }
    return;
  }

  console.log(`\n✉️  Enviando mensagem de teste para ${CHAT}…`);
  const r = await tg<{ ok: boolean; description?: string }>("sendMessage", {
    chat_id: CHAT,
    parse_mode: "HTML",
    text: "🛰️ <b>PromoDetec conectado!</b>\nÉ aqui que vão chegar as novas promoções. 🔥",
  });
  console.log(r.ok ? "✅ Mensagem enviada — confira o canal!" : `❌ Falhou: ${r.description}`);
}

main().catch((e) => { console.error("❌", e); process.exit(1); });
