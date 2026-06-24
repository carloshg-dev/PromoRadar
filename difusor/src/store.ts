import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { config } from "./config";

/**
 * Estado local de dedup (arquivo JSON). O Difusor e AUTONOMO: nao cria tabela
 * nem escreve no banco do site. Guarda so os ids ja publicados p/ nao repetir.
 * Em Docker, monte um volume em /app/data para sobreviver a restart.
 * Entradas mais velhas que STATE_TTL_DAYS sao podadas (a oferta pode reaparecer).
 */
type Registro = { em: string; preco: number | null };
type Posted = Record<string, Registro>;

let cache: Posted | null = null;

async function load(): Promise<Posted> {
  if (cache) return cache;
  let bruto: Posted = {};
  try {
    bruto = JSON.parse(await readFile(config.stateFile, "utf8")) as Posted;
  } catch {
    bruto = {}; // primeira execucao / arquivo ausente
  }
  const limite = Date.now() - config.stateTtlDays * 86_400_000;
  cache = {};
  for (const [id, v] of Object.entries(bruto)) {
    const t = new Date(v.em).getTime();
    if (Number.isFinite(t) && t >= limite) cache[id] = v;
  }
  return cache;
}

export async function jaPublicado(id: string): Promise<boolean> {
  return Boolean((await load())[id]);
}

export async function marcarPublicado(id: string, preco: number | null): Promise<void> {
  (await load())[id] = { em: new Date().toISOString(), preco };
}

export async function salvar(): Promise<void> {
  if (!cache) return;
  await mkdir(dirname(config.stateFile), { recursive: true });
  await writeFile(config.stateFile, JSON.stringify(cache, null, 2), "utf8");
}
