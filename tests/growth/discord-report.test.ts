import test from "node:test";
import assert from "node:assert/strict";
import { sendDiscordReport } from "../../src/infrastructure/notify/discord-report";
import { notificarAfiliacao, notificarColeta, notificarResumoDiario } from "../../src/infrastructure/notify/owner";
import type { DiscordReportPayload } from "../../src/core/reporting/presentation";

const hook = "https://discord.com/api/webhooks/123/fixture_not_a_real_secret";
const payload: DiscordReportPayload = { username: "Fixture", allowed_mentions: { parse: [] }, embeds: [{ title: "Resumo", color: 1, fields: [{ name: "Ações", value: "35" }] }] };

test("envio junta embeds e anexos, bloqueia menções e exige confirmação HTTP sem chamadas externas", async context => {
  let calls = 0;
  context.mock.method(globalThis, "fetch", async (input: unknown, init?: RequestInit) => {
    calls++; assert.equal(new URL(String(input)).searchParams.get("wait"), "true"); assert.equal(init?.redirect, "error"); assert.ok(init?.signal);
    const body = init?.body as FormData;
    const posted = JSON.parse(String(body.get("payload_json")));
    assert.deepEqual(posted.allowed_mentions, { parse: [] }); assert.equal(posted.embeds[0].title, "Resumo");
    assert.equal(posted.attachments[0].filename, "relatorio.csv");
    const file = body.get("files[0]") as File;
    assert.deepEqual([...new Uint8Array(await file.arrayBuffer()).slice(0, 3)], [0xef, 0xbb, 0xbf]);
    assert.equal(await file.text(), "indicador;quantidade\r\nacoes;35\r\n");
    return Response.json({ id: "fixture-message" });
  });
  await sendDiscordReport(hook, payload, [{ filename: "relatorio.csv", text: "\ufeffindicador;quantidade\r\nacoes;35\r\n", contentType: "text/csv;charset=utf-8" }]);
  assert.equal(calls, 1);
});

test("HTTP de falha não vira sucesso e configuração/anexo inválido é recusado antes do POST", async context => {
  let calls = 0;
  context.mock.method(globalThis, "fetch", async () => { calls++; return Response.json({}, { status: 429 }); });
  await assert.rejects(sendDiscordReport(hook, payload), /discord_report_http_429/); assert.equal(calls, 1);
  await assert.rejects(sendDiscordReport("https://external.test/hook", payload), /configuration_missing/);
  await assert.rejects(sendDiscordReport(hook, payload, [{ filename: "../segredo.csv", text: "x", contentType: "text/csv" }]), /attachment_invalid/);
  await assert.rejects(sendDiscordReport(hook, payload, [{ filename: "big.csv", text: "x".repeat(512 * 1024 + 1), contentType: "text/csv" }]), /attachment_invalid/);
  assert.equal(calls, 1);
});

test("avisos operacionais mantêm tópicos e CSV de todas as linhas, sem confirmar receita ou recência pelo cadastro", async context => {
  const saved = { hook: process.env.DISCORD_WEBHOOK_URL, lead: process.env.PROMODETEC_LEADS_DISCORD_WEBHOOK_URL, token: process.env.TELEGRAM_BOT_TOKEN, chat: process.env.TELEGRAM_CHAT_ID };
  process.env.DISCORD_WEBHOOK_URL = hook; delete process.env.TELEGRAM_BOT_TOKEN; delete process.env.TELEGRAM_CHAT_ID;
  const messages: Array<{ payload: DiscordReportPayload; csv: string }> = [];
  context.mock.method(globalThis, "fetch", async (_url: unknown, init?: RequestInit) => {
    const body = init?.body as FormData, file = body.get("files[0]") as File;
    messages.push({ payload: JSON.parse(String(body.get("payload_json"))), csv: await file.text() });
    return Response.json({ id: "fixture-message" });
  });
  try {
    const perAdapter = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`fonte-${i}`, { coletados: 5, salvos: 4, descartados: 1, erros: 0 }]));
    await notificarColeta({ jobId: "12345678-1234", coletados: 60, salvos: 48, erros: 0, porAdapter: perAdapter });
    await notificarAfiliacao(Array.from({ length: 12 }, (_, i) => ({ loja: `Loja ${i}`, rede: "Rede", produtos: i + 1 })));
    await notificarResumoDiario({ eventos: 35, buscas: 5, produtosVistos: 8, novosUsuarios: 0, topBuscas: [["fone", 3]], topCategorias: [["casa", 2]], since: "2026-10-31T12:00:00Z", until: "2026-11-01T12:00:00Z" });
    assert.equal(messages.length, 3);
    assert.equal(messages[0]!.csv.trim().split("\r\n").length, 13); assert.equal(messages[1]!.csv.trim().split("\r\n").length, 13);
    assert.ok(messages[0]!.payload.embeds[0]!.fields.some(f => f.inline));
    assert.match(messages[1]!.payload.embeds[0]!.description!, /não aplica o filtro de sete dias/);
    assert.match(messages[2]!.payload.embeds[0]!.description!, /31\/10\/2026.*01\/11\/2026.*Brasília/);
    for (const message of messages) assert.deepEqual(message.payload.allowed_mentions, { parse: [] });
    assert.doesNotMatch(JSON.stringify(messages), /Todas já monetizam|guilhotinadas/);
  } finally {
    for (const [key, value] of Object.entries({ DISCORD_WEBHOOK_URL: saved.hook, PROMODETEC_LEADS_DISCORD_WEBHOOK_URL: saved.lead, TELEGRAM_BOT_TOKEN: saved.token, TELEGRAM_CHAT_ID: saved.chat })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test("canal Telegram existente conserva HTML legível sem prometer um anexo do Discord", async context => {
  const saved = { hook: process.env.DISCORD_WEBHOOK_URL, lead: process.env.PROMODETEC_LEADS_DISCORD_WEBHOOK_URL, token: process.env.TELEGRAM_BOT_TOKEN, chat: process.env.TELEGRAM_CHAT_ID };
  delete process.env.DISCORD_WEBHOOK_URL; delete process.env.PROMODETEC_LEADS_DISCORD_WEBHOOK_URL;
  process.env.TELEGRAM_BOT_TOKEN = "fixture_token"; process.env.TELEGRAM_CHAT_ID = "fixture_chat";
  let text = "";
  context.mock.method(globalThis, "fetch", async (url: unknown, init?: RequestInit) => {
    assert.equal(String(url), "https://api.telegram.org/botfixture_token/sendMessage");
    const body = JSON.parse(String(init?.body)); assert.equal(body.parse_mode, "HTML"); text = body.text;
    return Response.json({ ok: true });
  });
  try {
    await notificarResumoDiario({ eventos: 35, buscas: 5, produtosVistos: 8, novosUsuarios: 0, topBuscas: [["fone", 1]], topCategorias: [] });
    assert.match(text, /<b>35<\/b>/); assert.doesNotMatch(text, /\*\*35\*\*|CSV completo anexo/); assert.match(text, /1<\/b> busca/);
  } finally {
    for (const [key, value] of Object.entries({ DISCORD_WEBHOOK_URL: saved.hook, PROMODETEC_LEADS_DISCORD_WEBHOOK_URL: saved.lead, TELEGRAM_BOT_TOKEN: saved.token, TELEGRAM_CHAT_ID: saved.chat })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
