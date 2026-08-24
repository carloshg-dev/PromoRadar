import type { AdapterKey } from "@/core/domain/types";

// O Cloudflare Worker nao executa scrapers; as coletas pesadas rodam no Actions.
export const coletaDisponivelNesteRuntime = false;

export async function executarColeta(_keys?: AdapterKey[]): Promise<never> {
  throw new Error("Coleta indisponivel no runtime Cloudflare.");
}
