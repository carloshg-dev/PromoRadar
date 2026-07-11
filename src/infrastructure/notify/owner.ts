import type { CollectionResult } from "@/services/collection.service";

/**
 * Avisos OPERACIONAIS para o DONO (não para usuários): coletas e novos cadastros.
 * Enviados ao Discord (embed rico) e ao Telegram (HTML), bem formatados.
 *
 * Variáveis de ambiente (todas opcionais — ausência = no-op, nunca quebra):
 *   • DISCORD_WEBHOOK_URL  → canal privado do dono no Discord
 *   • TELEGRAM_BOT_TOKEN   → token do @PROMODETEC_BOT (via @BotFather)
 *   • TELEGRAM_CHAT_ID     → chat do DONO (seu privado com o bot, ou grupo/canal de ops)
 *
 * (O feed PÚBLICO de ofertas é outro módulo — `promo-feed.ts` — com chaves próprias.)
 */

const COR = { sucesso: 0x2ecc71, parcial: 0xf1c40f, falha: 0xe74c3c, info: 0x5865f2 } as const;
const SITE = "https://promodetec.com.br";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** POST JSON com timeout curto — webhook lento nunca segura a request/coleta. */
async function postJson(url: string, body: unknown): Promise<void> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 4000);
  try {
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ac.signal });
  } catch { /* avisos nunca derrubam o fluxo principal */ }
  finally { clearTimeout(t); }
}

interface Embed {
  titulo: string;
  cor: number;
  campos: Array<{ nome: string; valor: string }>;
  rodape?: string;
}

async function enviarDiscord(e: Embed): Promise<void> {
  // Aceita o nome padrão OU o que o dono já cadastrou (PROMODETEC_LEADS_...).
  const url = process.env.DISCORD_WEBHOOK_URL || process.env.PROMODETEC_LEADS_DISCORD_WEBHOOK_URL;
  if (!url) return;
  await postJson(url, {
    username: "PromoDetec",
    embeds: [{
      title: e.titulo,
      color: e.cor,
      fields: e.campos.map((c) => ({ name: c.nome, value: c.valor.slice(0, 1024) || "—", inline: false })),
      footer: e.rodape ? { text: e.rodape } : undefined,
      timestamp: new Date().toISOString(),
    }],
  });
}

async function enviarTelegram(e: Embed): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  const corpo = e.campos
    .map((c) => (c.valor.includes("\n") ? `<b>${esc(c.nome)}</b>\n${esc(c.valor)}` : `<b>${esc(c.nome)}:</b> ${esc(c.valor)}`))
    .join("\n\n");
  const text = `${esc(e.titulo)}\n\n${corpo}${e.rodape ? `\n\n<i>${esc(e.rodape)}</i>` : ""}`;
  await postJson(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chat, parse_mode: "HTML", disable_web_page_preview: true, text: text.slice(0, 4000),
  });
}

async function avisar(e: Embed): Promise<void> {
  await Promise.allSettled([enviarDiscord(e), enviarTelegram(e)]);
}

/** Avisa o dono ao fim de uma coleta (resumo + quebra por loja). */
export async function notificarColeta(r: CollectionResult): Promise<void> {
  const status = r.erros > 0 && r.salvos > 0 ? "parcial" : r.salvos > 0 ? "sucesso" : "falha";
  const emoji = status === "sucesso" ? "✅" : status === "parcial" ? "⚠️" : "❌";

  const porLoja = Object.entries(r.porAdapter)
    .sort((a, b) => b[1].salvos - a[1].salvos)
    .filter(([, s]) => s.salvos > 0 || s.erros > 0)
    .slice(0, 16)
    .map(([k, s]) => `• ${k}: ${s.salvos} salvos${s.erros ? ` · ${s.erros} erros` : ""}`)
    .join("\n");

  await avisar({
    titulo: `🛰️ Coleta concluída — ${emoji} ${status}`,
    cor: COR[status],
    campos: [
      { nome: "Resumo", valor: `${r.salvos} salvos · ${r.coletados} coletados · ${r.erros} erros` },
      { nome: "Por loja", valor: porLoja || "nenhuma loja salvou itens" },
    ],
    rodape: `job ${r.jobId.slice(0, 8)} · ${SITE}`,
  });
}

/**
 * "Lista real de afiliação" — as lojas ATIVAS que monetizam + as guilhotinadas
 * nesta rodada (cortadas por volume < 200). Reflete o estado real pós-guilhotina.
 */
export async function notificarAfiliacao(
  linhas: Array<{ loja: string; rede: string | null; produtos: number }>,
  guilhotinadas: string[] = [],
): Promise<void> {
  if (!linhas.length && !guilhotinadas.length) return;
  const afil = linhas.filter((l) => l.rede).sort((a, b) => b.produtos - a.produtos);
  const totAfil = afil.reduce((s, l) => s + l.produtos, 0);
  const campos = [
    { nome: `✅ Monetizadas — ${afil.length} lojas · ${totAfil} produtos`, valor: afil.length ? afil.map((l) => `• ${l.loja} — ${l.rede} (${l.produtos})`).join("\n") : "—" },
  ];
  if (guilhotinadas.length) {
    campos.push({ nome: `⚔️ Guilhotinadas nesta rodada (< 200 produtos)`, valor: guilhotinadas.map((g) => `• ${g}`).join("\n") });
  }
  await avisar({
    titulo: "💰 Lista real de afiliação",
    cor: COR.info,
    campos,
    rodape: `Todas já monetizam — deeplink embrulhado no clique (/r/) · ${SITE}`,
  });
}

/** Avisa o dono quando um novo usuário se cadastra. */
export async function notificarNovoUsuario(u: { nome?: string | null; email?: string | null; via?: string | null; totalUsuarios?: number | null }): Promise<void> {
  const campos = [
    { nome: "Nome", valor: u.nome || "—" },
    { nome: "E-mail", valor: u.email || "—" },
    { nome: "Via", valor: u.via === "google" ? "Google" : u.via || "e-mail" },
  ];
  if (typeof u.totalUsuarios === "number") campos.push({ nome: "Total de usuários", valor: String(u.totalUsuarios) });
  await avisar({ titulo: "🎉 Novo usuário no PromoDetec", cor: COR.info, campos, rodape: SITE });
}

/** Resumo diário de movimento do site (interações/buscas/novos usuários). */
export async function notificarResumoDiario(d: {
  eventos: number; buscas: number; produtosVistos: number; novosUsuarios: number;
  topBuscas: Array<[string, number]>; topCategorias: Array<[string, number]>;
}): Promise<void> {
  const buscas = d.topBuscas.length ? d.topBuscas.map(([t, n]) => `• ${t} (${n})`).join("\n") : "—";
  const cats = d.topCategorias.length ? d.topCategorias.map(([c, n]) => `• ${c.replace(/-/g, " ")} (${n})`).join("\n") : "—";
  await avisar({
    titulo: "📊 Movimento do site — últimas 24h",
    cor: COR.info,
    campos: [
      { nome: "Resumo", valor: `${d.eventos} interações · ${d.buscas} buscas · ${d.produtosVistos} produtos vistos · ${d.novosUsuarios} novos usuários` },
      { nome: "Buscas mais feitas", valor: buscas },
      { nome: "Categorias mais vistas", valor: cats },
    ],
    rodape: SITE,
  });
}
