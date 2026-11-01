import type { CollectionResult } from "@/services/collection.service";
import { reportCount, reportCsv, reportDateTime, reportLabel, reportText, type CsvCell, type DiscordField } from "@/core/reporting/presentation";
import { sendDiscordReport } from "./discord-report";

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
  descricao?: string;
  campos: Array<{ nome: string; valor: string; inline?: boolean }>;
  rodape?: string;
  planilha?: { arquivo: string; colunas: string[]; linhas: CsvCell[][] };
}

async function enviarDiscord(e: Embed): Promise<void> {
  // Aceita o nome padrão OU o que o dono já cadastrou (PROMODETEC_LEADS_...).
  const url = process.env.DISCORD_WEBHOOK_URL || process.env.PROMODETEC_LEADS_DISCORD_WEBHOOK_URL;
  if (!url) return;
  const fields: DiscordField[] = [];
  for (const campo of e.campos) {
    let value = "", part = 1;
    const append = () => { fields.push({ name: `${campo.nome}${part > 1 ? " · continuação" : ""}`, value: value || "—", inline: campo.inline ?? false }); part++; value = ""; };
    for (const line of campo.valor.split("\n")) {
      if (line.length > 900) throw new Error("owner_report_line_invalid");
      if (value.length + line.length + 1 > 900) append();
      value += (value ? "\n" : "") + line;
    }
    append();
  }
  await sendDiscordReport(url, {
    username: "PromoDetec | Operação", allowed_mentions: { parse: [] },
    embeds: [{
      title: e.titulo, description: e.descricao, color: e.cor, fields,
      footer: { text: [e.planilha ? "📎 CSV completo anexo" : null, e.rodape].filter(Boolean).join(" · ") || SITE },
      timestamp: new Date().toISOString(),
    }],
  }, e.planilha ? [{ filename: e.planilha.arquivo, text: reportCsv(e.planilha.colunas, e.planilha.linhas), contentType: "text/csv;charset=utf-8" }] : [], 4000);
}

async function enviarTelegram(e: Embed): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  const corpo = e.campos
    .map((c) => { const value = esc(c.valor).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>"); return c.valor.includes("\n") ? `<b>${esc(c.nome)}</b>\n${value}` : `<b>${esc(c.nome)}:</b> ${value}`; })
    .join("\n\n");
  const text = `${esc(e.titulo)}${e.descricao ? `\n${esc(e.descricao)}` : ""}\n\n${corpo}${e.rodape ? `\n\n<i>${esc(e.rodape)}</i>` : ""}`;
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

  const sources = Object.entries(r.porAdapter).sort((a, b) => b[1].salvos - a[1].salvos);
  const porLoja = sources.slice(0, 8)
    .map(([k, s]) => `${s.erros ? "⚠️" : s.salvos ? "✅" : "ℹ️"} **${reportText(k, 50)}**\nRecebidos: ${reportCount(s.coletados)} · salvos: ${reportCount(s.salvos)} · descartados: ${reportCount(s.descartados)} · erros: ${reportCount(s.erros)}`)
    .join("\n");

  await avisar({
    titulo: `🛰️ Coleta | ${emoji} ${status.toLocaleUpperCase("pt-BR")}`,
    cor: COR[status],
    descricao: "Atualização do catálogo. Este aviso não representa vendas ou comissões.",
    campos: [
      { nome: "📥 Itens recebidos", valor: `**${reportCount(r.coletados)}**`, inline: true },
      { nome: "💾 Itens salvos", valor: `**${reportCount(r.salvos)}**`, inline: true },
      { nome: "⚠️ Erros", valor: `**${reportCount(r.erros)}**`, inline: true },
      { nome: "🧾 Resultado por fonte · até 8", valor: porLoja || "Nenhuma fonte retornada nesta execução." },
    ],
    rodape: `Execução ${r.jobId.slice(0, 8)} · ${SITE}`,
    planilha: { arquivo: `coleta-${r.jobId.slice(0, 8)}.csv`, colunas: ["gerado_em_utc", "execucao", "fonte", "coletados", "salvos", "descartados", "erros", "situacao"],
      linhas: sources.map(([source, value]) => [new Date().toISOString(), r.jobId, source, value.coletados, value.salvos, value.descartados, value.erros, value.erros ? "com_erros" : "sem_erros_reportados"]) },
  });
}

/**
 * Inventário cadastrado das lojas com rede configurada; não comprova recência,
 * estoque no checkout, atribuição de cada link ou receita recebida.
 */
export async function notificarAfiliacao(
  linhas: Array<{ loja: string; rede: string | null; produtos: number }>,
  guilhotinadas: string[] = [],
): Promise<void> {
  if (!linhas.length && !guilhotinadas.length) return;
  const afil = linhas.filter((l) => l.rede).sort((a, b) => b.produtos - a.produtos);
  const totAfil = afil.reduce((s, l) => s + l.produtos, 0);
  const campos = [
    { nome: "🏪 Lojas com rede configurada", valor: `**${reportCount(afil.length)}**`, inline: true },
    { nome: "📦 Produtos no cadastro", valor: `**${reportCount(totAfil)}**`, inline: true },
    { nome: "🗂️ Maiores inventários · até 8", valor: afil.length ? afil.slice(0, 8).map((l, index) => `**${index + 1}. ${reportText(l.loja, 70)}**\nRede: ${reportText(l.rede ?? "", 40)} · produtos: **${reportCount(l.produtos)}**`).join("\n") : "Nenhuma loja com rede configurada neste recorte.", inline: false },
  ];
  if (guilhotinadas.length) {
    campos.push({ nome: "⚠️ Lojas retiradas nesta execução", valor: guilhotinadas.slice(0, 8).map((g) => `• ${reportText(g, 70)}`).join("\n"), inline: false });
  }
  await avisar({
    titulo: "🏪 Afiliadas | Inventário cadastrado",
    cor: COR.info,
    descricao: "Produtos marcados em estoque na base. Esta contagem não aplica o filtro de sete dias da vitrine e não garante comissão.",
    campos,
    rodape: SITE,
    planilha: { arquivo: "afiliadas-inventario.csv", colunas: ["gerado_em_utc", "loja", "rede_configurada", "produtos_cadastrados_em_estoque", "situacao", "observacao"],
      linhas: [...afil.map(l => [new Date().toISOString(), l.loja, l.rede, l.produtos, "rede_configurada", "Sem filtro de recência; não comprova comissão."] as CsvCell[]), ...guilhotinadas.map(loja => [new Date().toISOString(), loja, null, null, "retirada_nesta_execucao", ""] as CsvCell[])] },
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
  semResultado?: number; salvos?: number; compartilhamentos?: number; saidas?: number; redirects?: number;
  since?: string; until?: string;
}): Promise<void> {
  const buscas = d.topBuscas.length ? d.topBuscas.slice(0, 5).map(([t, n], i) => `**${i + 1}.** ${reportText(t, 80)} — **${reportCount(n)}** ${n === 1 ? "busca" : "buscas"}`).join("\n") : "Nenhuma busca registrada.";
  const cats = d.topCategorias.length ? d.topCategorias.slice(0, 5).map(([c, n], i) => `**${i + 1}.** ${reportText(reportLabel(c), 60)} — **${reportCount(n)}** ${n === 1 ? "ação" : "ações"}`).join("\n") : "Nenhuma ação de categoria registrada.";
  const metrics: Array<[string, number]> = [["acoes", d.eventos], ["buscas", d.buscas], ["produtos_vistos", d.produtosVistos], ["novos_cadastros", d.novosUsuarios], ["buscas_sem_resultado", d.semResultado ?? 0], ["ofertas_salvas", d.salvos ?? 0], ["compartilhamentos", d.compartilhamentos ?? 0], ["intencoes_saida", d.saidas ?? 0], ["redirecionamentos", d.redirects ?? 0]];
  await avisar({
    titulo: "🧭 Movimento | Últimas 24 horas",
    cor: COR.info,
    descricao: `${d.since && d.until ? `📅 ${reportDateTime(d.since)} até ${reportDateTime(d.until)} · Brasília\n` : ""}Janela móvel de 24 horas, diferente do relatório de dias completos. Ações consentidas e totais agregados.`,
    campos: [
      { nome: "🧭 Ações consentidas", valor: `**${reportCount(d.eventos)}**`, inline: true },
      { nome: "🔎 Buscas", valor: `**${reportCount(d.buscas)}**`, inline: true },
      { nome: "📦 Produtos vistos", valor: `**${reportCount(d.produtosVistos)}**`, inline: true },
      { nome: "👤 Cadastros", valor: `**${reportCount(d.novosUsuarios)}**`, inline: true },
      { nome: "↗️ Saídas registradas", valor: `**${reportCount(d.redirects ?? 0)}**`, inline: true },
      { nome: "❤️ Ofertas salvas", valor: `**${reportCount(d.salvos ?? 0)}**`, inline: true },
      { nome: "🔍 Pontos de atenção", valor: `Buscas sem resultado: **${reportCount(d.semResultado ?? 0)}**\nCompartilhamentos: **${reportCount(d.compartilhamentos ?? 0)}**\nIntenções de saída: **${reportCount(d.saidas ?? 0)}**` },
      { nome: "01 · 🔎 Buscas mais feitas", valor: buscas },
      { nome: "02 · 🗂️ Categorias mais vistas", valor: cats },
    ],
    rodape: `Ações não são pessoas únicas; saídas não são vendas · ${SITE}`,
    planilha: { arquivo: "movimento-24h.csv", colunas: ["inicio_utc", "fim_exclusivo_utc", "secao", "indicador", "item", "quantidade", "unidade"],
      linhas: [...metrics.map(([key, value]) => [d.since ?? null, d.until ?? null, "resumo", key, "", value, "contagem"] as CsvCell[]), ...d.topBuscas.map(([term, count]) => [d.since ?? null, d.until ?? null, "buscas", "busca", term, count, "acoes"] as CsvCell[]), ...d.topCategorias.map(([category, count]) => [d.since ?? null, d.until ?? null, "categorias", "ver_categoria", category, count, "acoes"] as CsvCell[])] },
  });
}
