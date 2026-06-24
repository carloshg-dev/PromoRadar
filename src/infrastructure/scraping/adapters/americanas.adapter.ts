import { StoreAdapter, type AdapterContext } from "@/infrastructure/scraping/core/adapter";
import { coletarVtex, type VtexBusca } from "@/infrastructure/scraping/core/vtex";
import type { RawProduct } from "@/core/domain/types";

/**
 * Americanas — marketplace VTEX cuja API pública responde a HTTP puro (sem
 * Firecrawl). Vende de tudo, então alimenta TRÊS verticais ao mesmo tempo:
 * Casa & Eletro (2ª loja → habilita comparações de eletro), Ferramentas e
 * também hardware (mais produtos e comparações na vertical Tech).
 *
 * O `valida` por busca corta o que a busca full-text traz fora do tema
 * (acessórios, peças, capas), mantendo só o produto-alvo.
 */

const SITE = "https://www.americanas.com.br";

const BUSCAS: readonly VtexBusca[] = [
  // Casa & Eletro
  { termo: "geladeira", slug: "geladeiras", valida: /geladeira|refrigerador|frigobar/i },
  { termo: "fogão", slug: "fogoes", valida: /fog[ãa]o|cooktop/i },
  { termo: "máquina de lavar", slug: "maquinas-lavar", valida: /lavadora|lava e seca|m[áa]quina de lavar/i },
  { termo: "smart tv", slug: "tvs", valida: /\btv\b|smart ?tv|televis/i },
  { termo: "micro-ondas", slug: "micro-ondas", valida: /micro-?ondas/i },
  { termo: "ar condicionado", slug: "ar-condicionado", valida: /ar[- ]condicionado|split/i },
  // Ferramentas
  { termo: "furadeira", slug: "furadeiras", valida: /furadeira|parafusadeira/i },
  { termo: "serra", slug: "serras", valida: /serra/i },
  { termo: "lixadeira", slug: "lixadeiras", valida: /lixadeira|esmerilhadeira/i },
  { termo: "compressor de ar", slug: "compressores", valida: /compressor/i },
  { termo: "jogo de ferramentas", slug: "ferramentas-manuais", valida: /jogo|kit|chave|alicate|trena|parafuso/i },
  // Tech (mais volume + comparações cruzadas com Kabum/Terabyte/Pichau/ML)
  { termo: "placa de video", slug: "placas-de-video", valida: /placa de v[íi]deo|rtx|gtx|\brx ?\d/i },
  { termo: "ssd", slug: "ssds", valida: /\bssd\b/i },
  { termo: "memoria ram", slug: "memorias-ram", valida: /mem[óo]ria|ddr\d/i },
  { termo: "processador", slug: "processadores", valida: /processador|ryzen|core i[3579]/i },
  // Oficina + EPI
  { termo: "chave combinada", slug: "chaves-soquetes", valida: /chave|soquete|catraca/i },
  { termo: "jogo de soquete", slug: "chaves-soquetes", valida: /soquete|chave|catraca/i },
  { termo: "luva de seguranca", slug: "epi", valida: /luva|capacete|[óo]culos|bota|protetor|prote[çc][ãa]o/i },
  { termo: "capacete de seguranca", slug: "epi", valida: /capacete|luva|[óo]culos|bota|protetor|prote[çc][ãa]o/i },
  // Gadgets
  { termo: "fone bluetooth", slug: "fones-bluetooth", valida: /fone|earbud|tws|headphone|headset/i },
  { termo: "smartwatch", slug: "smartwatch", valida: /smartwatch|smart watch|rel[óo]gio inteligente/i },
  { termo: "caixa de som bluetooth", slug: "caixa-de-som", valida: /caixa de som|speaker|bluetooth/i },
  { termo: "power bank", slug: "power-bank", valida: /power ?bank|carregador port[áa]til|bateria externa/i },
  { termo: "webcam", slug: "webcam-acao", valida: /webcam|c[âa]mera/i },
  // Perfumes
  { termo: "perfume lattafa", slug: "perfumes-arabes", valida: /perfum|eau de|\bedp\b|\bedt\b/i },
  { termo: "perfume importado masculino", slug: "perfumes-importados", valida: /perfum|eau de|\bedp\b|\bedt\b/i },
  { termo: "perfume importado feminino", slug: "perfumes-importados", valida: /perfum|eau de|\bedp\b|\bedt\b/i },
];

export class AmericanasAdapter extends StoreAdapter {
  readonly key = "americanas" as const;
  readonly nome = "Americanas";

  async coletar(ctx: AdapterContext): Promise<RawProduct[]> {
    const out = await coletarVtex(SITE, BUSCAS, { log: ctx.log });
    ctx.log("info", `Americanas: ${out.length} itens coletados`);
    return out;
  }
}
