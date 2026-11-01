import { formatBRL } from "../formatting";

export interface DiscordField { name: string; value: string; inline?: boolean }
export interface DiscordEmbed {
  title: string; description?: string; color: number; fields: DiscordField[];
  footer?: { text: string }; timestamp?: string;
}
export interface DiscordReportPayload {
  username: string; content?: string; allowed_mentions: { parse: never[] }; embeds: DiscordEmbed[];
}
export type CsvCell = string | number | null;

// O callback de login importa os avisos; formatadores do digest só nascem ao usá-los.
let integers: Intl.NumberFormat | undefined;
let dates: Intl.DateTimeFormat | undefined;
let dateTimes: Intl.DateTimeFormat | undefined;

export const reportDate = (value: string | number) => (dates ??= new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short" })).format(new Date(value));
export const reportDateTime = (value: string) => (dateTimes ??= new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })).format(new Date(value));
export function reportCount(value: number): string {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error("report_count_invalid");
  return (integers ??= new Intl.NumberFormat("pt-BR")).format(value);
}
export function reportMoney(cents: number): string {
  if (!Number.isSafeInteger(cents)) throw new Error("report_amount_invalid");
  return formatBRL(cents / 100);
}

/** Rótulos externos não criam títulos, links, menções ou linhas extras no Discord. */
export function reportText(value: string, max = 100): string {
  const clean = value.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, " ")
    .replace(/[@`<>*_[\]\\~|]/g, "").replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max - 1).replace(/[\uD800-\uDBFF]$/, "") + "…" : clean;
}

export const reportLabel = (value: string) => value.replace(/[-_]/g, " ").replace(/^./u, letter => letter.toLocaleUpperCase("pt-BR"));

export function rankedReportLines(rows: readonly [string, number][], unit: readonly [string, string], empty: string): string {
  return rows.slice(0, 5).map(([label, count], index) => `**${index + 1}.** ${reportText(label, 88)} — **${reportCount(count)}** ${unit[count === 1 ? 0 : 1]}`).join("\n") || empty;
}

/** CSV pequeno de agregados: BOM, CRLF e separador do Excel em português. */
export function reportCsv(headers: readonly string[], rows: readonly (readonly CsvCell[])[]): string {
  const cell = (value: CsvCell): string => {
    if (value === null) return "";
    if (typeof value === "number") {
      if (!Number.isFinite(value)) throw new Error("report_csv_number_invalid");
      return String(value).replace(".", ",");
    }
    let text = value.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, " ").trim();
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  if (rows.length > 1000 || rows.some(row => row.length !== headers.length)) throw new Error("report_csv_shape_invalid");
  return "\ufeff" + [headers, ...rows].map(row => row.map(cell).join(";")).join("\r\n") + "\r\n";
}

/** Valida o payload inteiro antes de enviar; nunca corta um relatório no meio. */
export function assertDiscordReport(payload: DiscordReportPayload): void {
  let characters = 0;
  if (!payload.embeds.length || payload.embeds.length > 10 || (payload.content?.length ?? 0) > 2000) throw new Error("discord_report_size_invalid");
  for (const embed of payload.embeds) {
    if (!embed.title || embed.title.length > 256 || (embed.description?.length ?? 0) > 4096 || embed.fields.length > 25 || (embed.footer?.text.length ?? 0) > 2048) throw new Error("discord_report_size_invalid");
    characters += embed.title.length + (embed.description?.length ?? 0) + (embed.footer?.text.length ?? 0);
    for (const field of embed.fields) {
      if (!field.name || field.name.length > 256 || !field.value || field.value.length > 1024) throw new Error("discord_report_size_invalid");
      characters += field.name.length + field.value.length;
    }
  }
  if (characters > 6000) throw new Error("discord_report_size_invalid");
}
