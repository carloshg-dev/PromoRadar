import { assertDiscordReport, type DiscordReportPayload } from "@/core/reporting/presentation";

export interface ReportAttachment { filename: string; text: string; contentType: string }

/** Um único envio mantém os blocos e os arquivos do mesmo período juntos. */
export async function sendDiscordReport(hook: string, payload: DiscordReportPayload, files: ReportAttachment[] = [], timeoutMs = 15000): Promise<void> {
  if (!/^https:\/\/(?:discord\.com|discordapp\.com)\/api\/(?:v\d+\/)?webhooks\/[0-9]+\/[A-Za-z0-9_-]+$/.test(hook)) throw new Error("report_discord_configuration_missing");
  assertDiscordReport(payload);
  if (files.length > 3 || files.some(file => !/^[a-z0-9_.-]{1,100}$/.test(file.filename) || new TextEncoder().encode(file.text).length > 512 * 1024)) throw new Error("report_attachment_invalid");
  const url = new URL(hook); url.searchParams.set("wait", "true");
  const form = new FormData();
  form.set("payload_json", JSON.stringify({ ...payload, attachments: files.map((file, id) => ({ id, filename: file.filename })) }));
  files.forEach((file, id) => form.set(`files[${id}]`, new Blob([file.text], { type: file.contentType }), file.filename));
  const response = await fetch(url, { method: "POST", body: form, redirect: "error", signal: AbortSignal.timeout(timeoutMs) });
  await response.body?.cancel();
  if (!response.ok) throw new Error(`discord_report_http_${response.status}`);
}
