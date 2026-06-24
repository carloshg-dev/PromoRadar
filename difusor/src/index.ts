import cron from "node-cron";
import { config } from "./config";
import { buscarMelhoresOfertas, type Oferta } from "./feed";
import { jaPublicado, marcarPublicado, salvar } from "./store";
import { publicar, sleep } from "./publishers";
import { fmtPreco } from "./format";

/** Uma varredura: le o balde, filtra o que ja foi postado, publica o lote da rodada. */
async function rodada(): Promise<void> {
  console.log(`\n🛰️  [${new Date().toISOString()}] Difusor: varrendo ofertas...`);

  let pool: Oferta[] = [];
  try {
    pool = await buscarMelhoresOfertas();
  } catch (e) {
    console.error(`❌ Falha ao ler vw_ofertas: ${(e as Error).message}`);
    return; // erro de rede/banco nunca derruba o agendador
  }

  const novas: Oferta[] = [];
  for (const o of pool) {
    if (novas.length >= config.batch) break;
    if (await jaPublicado(o.id)) continue;
    novas.push(o);
  }

  if (!novas.length) {
    console.log(`   nada novo (balde: ${pool.length} · desconto>=${config.minDesconto}%). Ate a proxima.`);
    return;
  }

  console.log(`   ${novas.length} oferta(s) nova(s) de ${pool.length} candidata(s):`);
  let ok = 0;
  for (const o of novas) {
    try {
      await publicar(o);
      await marcarPublicado(o.id, o.precoAtual);
      ok++;
      console.log(`   ✅ ${fmtPreco(o.precoAtual)} · ${o.lojaNome} · ${o.titulo.slice(0, 60)}`);
    } catch (e) {
      console.warn(`   ❌ pulei "${o.titulo.slice(0, 40)}": ${(e as Error).message}`);
    }
    await sleep(config.postDelayMs); // respeita o rate-limit do Telegram
  }
  await salvar();
  console.log(`   ✔️  ${ok}/${novas.length} publicadas.`);
}

async function main(): Promise<void> {
  const canais = [
    config.telegram.token && config.telegram.chatId ? "Telegram" : null,
    config.discordWebhook ? "Discord" : null,
  ].filter(Boolean).join(" + ");
  console.log("🦖 Detec Difusor iniciado.");
  console.log(`   site=${config.siteUrl} · lote=${config.batch} · desconto>=${config.minDesconto}% · canais=${canais}`);

  await rodada(); // roda 1x ao subir (feedback imediato)

  if (config.runOnce) {
    console.log("👋 RUN_ONCE=true — encerrando.");
    return;
  }
  if (!cron.validate(config.cron)) {
    console.error(`❌ CRON invalido: "${config.cron}". Use algo como "0 */3 * * *".`);
    process.exit(1);
  }
  cron.schedule(config.cron, () => void rodada().catch((e) => console.error("❌ rodada:", e)));
  console.log(`⏰ Agendado ("${config.cron}"). Mantendo o processo vivo...`);
}

main().catch((e) => {
  console.error("❌ fatal:", e);
  process.exit(1);
});
