import type { AdapterKey } from "@/core/domain/types";
import type { StoreAdapter } from "@/infrastructure/scraping/core/adapter";
import { MercadoLivreAdapter } from "@/infrastructure/scraping/adapters/mercadolivre.adapter";
import { AmazonAdapter } from "@/infrastructure/scraping/adapters/amazon.adapter";
import { LomadeeAdapter } from "@/infrastructure/scraping/adapters/lomadee.adapter";
import { AwinAdapter } from "@/infrastructure/scraping/adapters/awin.adapter";

/**
 * GUILHOTINA DOS NÃO-AFILIADOS (decisão do dono, 02/07/2026): "chega de mandar
 * tráfego de graça". Só coleta quem MONETIZA:
 *   • amazon        → Amazon Associados (tag promodetec-20)
 *   • mercadolivre  → afiliado oficial (links meli.la por produto)
 *   • awin          → multi-loja (AliExpress, Extra, Ponto Frio, L'Occitane…)
 *   • lomadee       → multi-loja (Sieno, Bio Bran, Casa do Fitness…)
 *
 * Os 12 adapters DESATIVADOS (kabum, terabyte, pichau, americanas,
 * ferramentasgerais, lojadomecanico, havan, growth, soldiers, maxtitanium,
 * integralmedica, darklab) continuam intactos em adapters/ — aprovou a
 * afiliação de uma delas? Reativar = (1) devolver a key ao union AdapterKey,
 * (2) devolver a entrada aqui, (3) devolver ao job do scrape.yml, e religar a
 * loja no banco (ativo=true + em_estoque via coleta). Época segue removida.
 */
export const ADAPTERS: Record<AdapterKey, () => StoreAdapter> = {
  mercadolivre: () => new MercadoLivreAdapter(),
  amazon: () => new AmazonAdapter(),
  lomadee: () => new LomadeeAdapter(),
  awin: () => new AwinAdapter(),
};

export function getAdapters(keys?: AdapterKey[]): StoreAdapter[] {
  const all = Object.keys(ADAPTERS) as AdapterKey[];
  return (keys ?? all).map((k) => ADAPTERS[k]());
}
