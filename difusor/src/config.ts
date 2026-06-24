import "dotenv/config";

/**
 * Configuracao do Difusor lida do ambiente. Reaproveita os MESMOS nomes de
 * variaveis que o site ja usa (TELEGRAM_FEED_CHAT_ID, DISCORD_DEALS_WEBHOOK_URL)
 * para que, se voce ja configurou o feed publico, o Difusor fale nos mesmos canais.
 */

function req(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    console.error(`❌ Falta a variavel de ambiente ${name}. Veja .env.example.`);
    process.exit(1);
  }
  return v;
}
function opt(name: string, fallback: string): string {
  const v = process.env[name]?.trim();
  return v && v.length ? v : fallback;
}
function num(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) ? v : fallback;
}

export const config = {
  // Supabase: SO LEITURA. Anon key = a mesma chave publica do site (RLS ja libera a vw_ofertas).
  supabaseUrl: req("SUPABASE_URL"),
  supabaseKey: req("SUPABASE_ANON_KEY"),

  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN?.trim() || "",
    chatId: process.env.TELEGRAM_FEED_CHAT_ID?.trim() || "",
  },
  discordWebhook: process.env.DISCORD_DEALS_WEBHOOK_URL?.trim() || "",

  siteUrl: opt("SITE_URL", "https://promodetec.vercel.app").replace(/\/+$/, ""),
  cron: opt("CRON", "0 */3 * * *"),
  runOnce: /^(1|true|sim|yes)$/i.test(process.env.RUN_ONCE ?? ""),

  batch: num("BATCH", 6),
  pool: num("POOL", 80),
  minDesconto: num("MIN_DESCONTO", 10),
  minScore: num("MIN_SCORE", 0),
  postDelayMs: num("POST_DELAY_MS", 1200),
  stateTtlDays: num("STATE_TTL_DAYS", 30),
  brandColor: Number(opt("BRAND_COLOR", "0xFF6A39")) || 0xff6a39,
  stateFile: opt("STATE_FILE", "data/posted.json"),
};

// Precisa de pelo menos um canal, senao nao ha o que fazer.
const temTelegram = Boolean(config.telegram.token && config.telegram.chatId);
if (!temTelegram) console.warn("⚠️  Telegram off (faltam TELEGRAM_BOT_TOKEN + TELEGRAM_FEED_CHAT_ID).");
if (!config.discordWebhook) console.warn("⚠️  Discord off (falta DISCORD_DEALS_WEBHOOK_URL).");
if (!temTelegram && !config.discordWebhook) {
  console.error("❌ Nenhum canal configurado (Telegram nem Discord). Nada a publicar.");
  process.exit(1);
}
