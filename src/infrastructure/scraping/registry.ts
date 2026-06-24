import type { AdapterKey } from "@/core/domain/types";
import type { StoreAdapter } from "@/infrastructure/scraping/core/adapter";
import { KabumAdapter } from "@/infrastructure/scraping/adapters/kabum.adapter";
import { MercadoLivreAdapter } from "@/infrastructure/scraping/adapters/mercadolivre.adapter";
import { PichauAdapter } from "@/infrastructure/scraping/adapters/pichau.adapter";
import { TerabyteAdapter } from "@/infrastructure/scraping/adapters/terabyte.adapter";
import { AmazonAdapter } from "@/infrastructure/scraping/adapters/amazon.adapter";
import { GrowthAdapter } from "@/infrastructure/scraping/adapters/growth.adapter";
import { SoldiersAdapter } from "@/infrastructure/scraping/adapters/soldiers.adapter";
import { MaxTitaniumAdapter } from "@/infrastructure/scraping/adapters/maxtitanium.adapter";
import { IntegralmedicaAdapter } from "@/infrastructure/scraping/adapters/integralmedica.adapter";
import { DarkLabAdapter } from "@/infrastructure/scraping/adapters/darklab.adapter";
import { HavanAdapter } from "@/infrastructure/scraping/adapters/havan.adapter";
import { AmericanasAdapter } from "@/infrastructure/scraping/adapters/americanas.adapter";
import { FerramentasGeraisAdapter } from "@/infrastructure/scraping/adapters/ferramentasgerais.adapter";
import { EpocaCosmeticosAdapter } from "@/infrastructure/scraping/adapters/epocacosmeticos.adapter";
import { LojaDoMecanicoAdapter } from "@/infrastructure/scraping/adapters/lojadomecanico.adapter";
import { LomadeeAdapter } from "@/infrastructure/scraping/adapters/lomadee.adapter";
import { AwinAdapter } from "@/infrastructure/scraping/adapters/awin.adapter";

export const ADAPTERS: Record<AdapterKey, () => StoreAdapter> = {
  kabum: () => new KabumAdapter(),
  mercadolivre: () => new MercadoLivreAdapter(),
  pichau: () => new PichauAdapter(),
  terabyte: () => new TerabyteAdapter(),
  amazon: () => new AmazonAdapter(),
  growth: () => new GrowthAdapter(),
  soldiers: () => new SoldiersAdapter(),
  maxtitanium: () => new MaxTitaniumAdapter(),
  integralmedica: () => new IntegralmedicaAdapter(),
  darklab: () => new DarkLabAdapter(),
  havan: () => new HavanAdapter(),
  americanas: () => new AmericanasAdapter(),
  ferramentasgerais: () => new FerramentasGeraisAdapter(),
  epocacosmeticos: () => new EpocaCosmeticosAdapter(),
  lojadomecanico: () => new LojaDoMecanicoAdapter(),
  lomadee: () => new LomadeeAdapter(),
  awin: () => new AwinAdapter(),
};

export function getAdapters(keys?: AdapterKey[]): StoreAdapter[] {
  const all = Object.keys(ADAPTERS) as AdapterKey[];
  return (keys ?? all).map((k) => ADAPTERS[k]());
}
