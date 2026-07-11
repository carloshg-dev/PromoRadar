import { readFileSync } from "node:fs";
import { listarPorStatus, atualizarCampanha, type Campanha } from "@/pipeline/campanhas.repo";

/**
 * SERVIÇO PUBLISHER (etapa 3) — MODULAR. Lê campanhas READY e publica a ARTE
 * (PNG renderizado, upload multipart — não a URL crua) nos canais. Hoje Telegram
 * + Discord; adicionar um canal = uma função `postarX` + entrada no mapa. O
 * estado de "já postei" é a própria tabela `campanhas` (status PUBLISHED) — nunca
 * mais um posted.json paralelo. Um canal que falha não derruba o outro.
 */

type Canal = (pngPath: string, legenda: string) => Promise<void>;

/** Telegram sendPhoto (upload do arquivo). Canal público de ofertas. */
const telegram: Canal = async (pngPath, legenda) => {
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_FEED_CHAT_ID;
  if (!token || !chat) return; // canal não configurado → skip silencioso (não é erro)
  const form = new FormData();
  form.append("chat_id", chat);
  form.append("caption", legenda.slice(0, 1024));
  form.append("photo", new Blob([readFileSync(pngPath)]), "achado.png");
  const r = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, { method: "POST", body: form });
  const j = (await r.json()) as { ok: boolean; description?: string };
  if (!j.ok) throw new Error(`Telegram: ${j.description ?? r.status}`);
};

/** Discord webhook (upload do arquivo + texto). */
const discord: Canal = async (pngPath, legenda) => {
  const wh = process.env.DISCORD_DEALS_WEBHOOK_URL;
  if (!wh) return;
  const form = new FormData();
  form.append("payload_json", JSON.stringify({ username: "PromoDetec Achados", content: legenda.slice(0, 1900) }));
  form.append("files[0]", new Blob([readFileSync(pngPath)]), "achado.png");
  const r = await fetch(wh, { method: "POST", body: form });
  if (!r.ok && r.status !== 204) throw new Error(`Discord: ${r.status}`);
};

const CANAIS: Record<string, Canal> = { telegram, discord };

export async function publicar(dryRun = false): Promise<{ ok: number; falhas: number }> {
  const prontas = await listarPorStatus("READY", 10);
  let ok = 0, falhas = 0;

  for (const c of prontas) {
    const png = c.imagens.feed;
    if (!png) { await atualizarCampanha(c.id, "FAILED", { erro: "sem imagem feed" }); falhas++; continue; }
    try {
      if (dryRun) {
        console.log(`[dry-run] publicaria campanha ${c.id} em [${c.plataformas.join(", ")}]`);
      } else {
        const alvos = (c.plataformas.length ? c.plataformas : ["telegram", "discord"]).filter((p) => CANAIS[p]);
        const res = await Promise.allSettled(alvos.map((p) => CANAIS[p]!(png, c.legenda ?? "")));
        if (res.length && res.every((r) => r.status === "rejected")) {
          throw new Error(res.map((r) => (r as PromiseRejectedResult).reason?.message).join(" | "));
        }
      }
      await atualizarCampanha(c.id, "PUBLISHED", { publicadoEm: new Date().toISOString() });
      ok++;
      await new Promise((r) => setTimeout(r, 1500)); // ritmo entre posts (rate-limit)
    } catch (e) {
      await atualizarCampanha(c.id, "FAILED", { erro: `publish: ${(e as Error).message}` });
      falhas++;
    }
  }
  return { ok, falhas };
}
