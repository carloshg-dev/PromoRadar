import type { summarizeAwinTransactions } from "../affiliate-report";
import { assertDiscordReport, rankedReportLines, reportCount, reportCsv, reportDate, reportLabel, reportMoney, type CsvCell, type DiscordEmbed, type DiscordReportPayload } from "./presentation";

type Ranking = Array<[string, number]>;
type ProductRanking = Array<{ title: string; count: number }>;
export interface BusinessReport {
  generatedAt: string; days: number; since: string; until: string; discordSent: boolean;
  movement: {
    totalEventos: number; counts: Record<string, number>; mobile: number; desktop: number;
    registrations: number; redirectRequests: number; topBuscas: Ranking; topCategorias: Ranking;
    topProducts: ProductRanking; rankingLimited: boolean; complete: boolean;
  };
  clicks: { stores: Ranking; products: ProductRanking; rankingLimited: boolean; complete: boolean };
  financeStatus: "ok" | "unavailable" | "not_configured";
  finance: ReturnType<typeof summarizeAwinTransactions> | null;
}

const STATUS = [
  ["pending", "🟡 Pendentes"], ["approved", "🟢 Aprovadas"], ["declined", "🔴 Recusadas"],
  ["deleted", "⚪ Excluídas"], ["unknown", "❔ Não reconhecidas"],
] as const;
const pairs = (rows: ProductRanking): Ranking => rows.map(({ title, count }) => [title, count]);

export function presentBusinessReport(report: BusinessReport) {
  if (![1, 7].includes(report.days) || !report.movement.complete || !report.clicks.complete || report.movement.mobile + report.movement.desktop > report.movement.totalEventos || (report.financeStatus === "ok") !== (report.finance !== null)) throw new Error("report_incomplete");
  const { movement, clicks, finance } = report;
  const frequency = report.days === 1 ? "diário" : "semanal";
  const period = `${reportDate(report.since)}${report.days === 7 ? ` a ${reportDate(Date.parse(report.until) - 1000)}` : ""} · Brasília`;
  const event = (key: string) => movement.counts[key] ?? 0;
  const metric = (name: string, value: number) => ({ name, value: `**${reportCount(value)}**`, inline: true });
  const embeds: DiscordEmbed[] = [{
    title: `📊 PromoDetec | Relatório ${frequency}`, color: 0xff7a00,
    description: `📅 **${period}**\nDias completos. Confira o movimento antes de abrir os rankings.`,
    fields: [
      metric("🧭 Ações consentidas", movement.totalEventos), metric("📄 Páginas abertas", event("visita")), metric("📦 Produtos vistos", event("ver_produto")),
      metric("🔎 Buscas", event("busca")), metric("❤️ Ofertas salvas", event("salvar_produto")), metric("🎟️ Cupons copiados", event("copiar_cupom")),
      metric("↗️ Saídas registradas", movement.redirectRequests), metric("👤 Novos cadastros", movement.registrations), metric("🔍 Buscas sem resultado", event("busca_sem_resultado")),
      { name: "📱 Dispositivos · contagem de ações", value: `Celular: **${reportCount(movement.mobile)}**\nDesktop: **${reportCount(movement.desktop)}**\nNão classificado: **${reportCount(Math.max(0, movement.totalEventos - movement.mobile - movement.desktop))}**` },
    ], footer: { text: "Ações e páginas abertas não são pessoas únicas. Saídas registradas não são compras." }, timestamp: report.generatedAt,
  }, {
    title: "🔎 Interesse do público | Rankings", color: 0x5865f2,
    description: "Top 5 por bloco. O CSV preserva todos os itens retornados pelo agregador.",
    fields: [
      { name: "01 · 🔍 Buscas mais feitas", value: rankedReportLines(movement.topBuscas, ["busca", "buscas"], "Nenhuma busca registrada no período.") },
      { name: "02 · 👀 Produtos mais vistos", value: rankedReportLines(pairs(movement.topProducts), ["visualização", "visualizações"], "Nenhuma visualização de produto registrada.") },
      { name: "03 · 🏪 Lojas mais clicadas", value: rankedReportLines(clicks.stores.map(([key, n]) => [reportLabel(key), n]), ["saída", "saídas"], "Nenhuma saída para loja registrada.") },
      { name: "04 · ↗️ Produtos com mais saídas", value: rankedReportLines(pairs(clicks.products), ["saída", "saídas"], "Nenhuma saída por produto registrada.") },
      { name: "05 · 🗂️ Categorias mais vistas", value: rankedReportLines(movement.topCategorias.map(([key, n]) => [reportLabel(key), n]), ["ação", "ações"], "Nenhuma ação de categoria registrada.") },
    ], footer: { text: movement.rankingLimited || clicks.rankingLimited ? "⚠️ Teto de agregação atingido: rankings parciais, inclusive nos anexos." : "Rankings limitados ao recorte retornado. Cliques não comprovam compra ou preferência de pessoas únicas." },
  }];
  const sales: DiscordEmbed = { title: "💰 Vendas e comissões | Awin · BRL", color: finance ? 0x219b63 : 0xe5ab32, fields: [],
    description: "Período pela data da transação. Situações financeiras permanecem separadas." };
  if (finance) {
    for (const [status, label] of STATUS) {
      const bucket = finance.statuses[status];
      if (!bucket) continue;
      sales.fields.push({ name: label, value: `Compras: **${reportCount(bucket.transactions)}**\nValor das compras: **${reportMoney(bucket.sales)}**\nComissão: **${reportMoney(bucket.commission)}**`, inline: true });
    }
    if (!finance.brlRows) sales.fields.push({ name: "🧾 Resultado da consulta", value: "Nenhuma venda BRL retornada nesta janela." });
    sales.fields.push({ name: "🛍️ Produtos nas compras rastreadas", value: rankedReportLines(finance.topProducts, ["unidade", "unidades"], "Awin não forneceu nomes de produtos nesta janela. Não foram inferidos pelos cliques.") });
    if (finance.otherCurrency) sales.fields.push({ name: "🌐 Outras moedas", value: `${reportCount(finance.otherCurrency)} transações fora dos totais BRL.` });
  } else sales.fields.push({ name: "⚠️ Cobertura financeira", value: `${report.financeStatus === "unavailable" ? "Consulta Awin indisponível" : "Acesso Awin não configurado"}. Ausência de dados não significa zero vendas.` });
  sales.fields.push({ name: "ℹ️ Como interpretar", value: "• Comissão pendente ou aprovada não comprova pagamento.\n• Vendas de Shopee, Amazon e Lomadee ainda não estão integradas.\n• Ranking de compras usa unidades informadas, pendentes/aprovadas." });
  sales.footer = { text: "📎 CSV: abrir no Excel e filtrar por seção. JSON: dados agregados para IA. Sem contatos ou pedidos individuais." };
  embeds.push(sales);
  const payload: DiscordReportPayload = { username: "PromoDetec | Relatórios", allowed_mentions: { parse: [] }, embeds };
  assertDiscordReport(payload);

  const headers = ["inicio_utc", "fim_exclusivo_utc", "periodo_brt", "frequencia", "secao", "indicador", "posicao", "item", "quantidade", "valor_brl", "comissao_brl", "fonte", "status_dado", "observacao"];
  const rows: CsvCell[][] = [];
  const add = (section: string, indicator: string, item: string, quantity: number | null, source: string, state = "observado", note = "", rank: number | null = null, value: number | null = null, commission: number | null = null) => rows.push([report.since, report.until, period, frequency, section, indicator, rank, item, quantity, value, commission, source, state, note]);
  for (const [key, count] of Object.entries(movement.counts)) add("movimento", key, "", count, "eventos_consentidos", "observado", "Ações, não pessoas únicas.");
  add("movimento", "total_acoes", "", movement.totalEventos, "eventos_consentidos");
  add("movimento", "novos_cadastros", "", movement.registrations, "usuarios_agregado");
  add("movimento", "saidas_registradas", "", movement.redirectRequests, "cliques_agregado", "observado", "Redirecionamentos, não compras.");
  add("dispositivos", "acoes", "mobile", movement.mobile, "eventos_consentidos");
  add("dispositivos", "acoes", "desktop", movement.desktop, "eventos_consentidos");
  add("dispositivos", "acoes", "nao_classificado", Math.max(0, movement.totalEventos - movement.mobile - movement.desktop), "eventos_consentidos");
  const ranking = (name: string, values: Ranking, source: string, limited: boolean, emptyState = "sem_registros") => {
    if (!values.length) add("rankings", name, "", null, source, emptyState, "Nenhum item retornado pelo agregador.");
    values.forEach(([label, count], index) => add("rankings", name, label, count, source, limited ? "parcial" : "observado", "Ranking limitado ao recorte do agregador.", index + 1));
  };
  ranking("buscas", movement.topBuscas, "eventos_consentidos", movement.rankingLimited);
  ranking("produtos_vistos", pairs(movement.topProducts), "eventos_consentidos", movement.rankingLimited);
  ranking("categorias", movement.topCategorias, "eventos_consentidos", movement.rankingLimited);
  ranking("lojas_clicadas", clicks.stores, "cliques_agregado", clicks.rankingLimited);
  ranking("produtos_com_saidas", pairs(clicks.products), "cliques_agregado", clicks.rankingLimited);
  if (finance) {
    for (const [status] of STATUS) {
      const bucket = finance.statuses[status] ?? { transactions: 0, sales: 0, commission: 0 };
      add("financeiro", "compras_por_status", status, bucket.transactions, "awin", "observado", "Valores em BRL. Comissão não comprova pagamento.", null, bucket.sales / 100, bucket.commission / 100);
    }
    ranking("produtos_em_compras", finance.topProducts, "awin_unidades_pendentes_aprovadas", false, finance.brlRows ? "nomes_nao_fornecidos" : "sem_registros");
    add("cobertura", "transacoes_outras_moedas", "", finance.otherCurrency, "awin", "excluido_dos_totais_brl");
    add("cobertura", "registros_nao_venda", "", finance.nonSale, "awin", "excluido_dos_totais_vendas");
  } else add("financeiro", "compras_e_comissoes", "", null, "awin", report.financeStatus, "Consulta sem dados disponíveis; valores vazios não significam zero.");
  for (const source of ["shopee", "amazon", "lomadee"]) add("cobertura", "compras_e_comissoes", "", null, source, "nao_integrado");
  add("cobertura", "comissao_paga", "", null, "awin", "nao_integrado", "Pagamento não é deduzido de aprovação.");
  const markdown = embeds.map(embed => [`## ${embed.title}`, embed.description, ...embed.fields.map(field => `### ${field.name}\n\n${field.value}`), embed.footer?.text].filter(Boolean).join("\n\n")).join("\n\n---\n\n") + "\n";
  const { discordSent: _delivery, ...data } = report;
  const json = JSON.stringify({ schemaVersion: 1,
    units: { financeAmounts: "centavos_de_BRL", csvAmounts: "BRL", movement: "acoes_nao_pessoas_unicas", redirects: "requisicoes_nao_compras", basketProducts: "unidades_pendentes_ou_aprovadas" },
    coverage: { finance: "somente_Awin", otherNetworks: "nao_integradas", payment: "nao_integrado", events: "somente_acoes_consentidas" }, ...data }, null, 2);
  return { payload, csv: reportCsv(headers, rows), markdown, json };
}
