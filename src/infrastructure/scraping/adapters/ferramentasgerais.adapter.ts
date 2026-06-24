import { StoreAdapter, type AdapterContext } from "@/infrastructure/scraping/core/adapter";
import { coletarVtex, type VtexBusca } from "@/infrastructure/scraping/core/vtex";
import type { RawProduct } from "@/core/domain/types";

/**
 * Ferramentas Gerais (fg.com.br) — loja VTEX especializada em ferramentaria,
 * âncora da vertical Ferramentas. API pública responde a HTTP puro (sem
 * Firecrawl). A marca vem do próprio produto (multimarcas: Bosch, Makita…),
 * essencial para o matching marca+spec do comparador.
 */

const SITE = "https://www.fg.com.br";

const BUSCAS: readonly VtexBusca[] = [
  { termo: "furadeira", slug: "furadeiras", valida: /furadeira|parafusadeira/i },
  { termo: "serra", slug: "serras", valida: /serra/i },
  { termo: "lixadeira", slug: "lixadeiras", valida: /lixadeira|esmerilhadeira|politriz/i },
  { termo: "compressor de ar", slug: "compressores", valida: /compressor/i },
  { termo: "jogo de ferramentas", slug: "ferramentas-manuais", valida: /jogo|kit|chave|alicate|trena|soquete/i },
  { termo: "chave combinada", slug: "chaves-soquetes", valida: /chave|soquete|catraca/i },
  { termo: "jogo de soquete", slug: "chaves-soquetes", valida: /soquete|chave|catraca/i },
  { termo: "luva de seguranca", slug: "epi", valida: /luva|capacete|[óo]culos|bota|protetor|prote[çc][ãa]o/i },
  { termo: "equipamento de protecao", slug: "epi", valida: /luva|capacete|[óo]culos|bota|protetor|prote[çc][ãa]o|m[áa]scara/i },
];

export class FerramentasGeraisAdapter extends StoreAdapter {
  readonly key = "ferramentasgerais" as const;
  readonly nome = "Ferramentas Gerais";

  async coletar(ctx: AdapterContext): Promise<RawProduct[]> {
    const out = await coletarVtex(SITE, BUSCAS, { log: ctx.log });
    ctx.log("info", `Ferramentas Gerais: ${out.length} itens coletados`);
    return out;
  }
}
