import type { ProdutoShopee } from "./ShopeeTypes";

export type ShopeeCsvRow = Record<string, unknown>;

export type ShopeeMapResult =
  | { isValid: true; produto: ProdutoShopee; motivo: null }
  | { isValid: false; produto: null; motivo: string };

export class ShopeeMapper {
  private static readonly MIN_PRICE = 20;

  private static readonly PAUSED_STORES = [
    "epoca cosmeticos",
  ];

  private static readonly AFFILIATE_SHORT_HOSTS = [
    "s.shopee.com.br",
    "shope.ee",
  ];

  private static readonly TRACKING_PARAMS = [
    "af_siteid",
    "affiliate_id",
    "pid",
    "utm_campaign",
    "utm_content",
    "utm_medium",
    "utm_source",
    "utm_term",
    "uls_trackid",
    "xptdk",
  ];

  map(row: ShopeeCsvRow): ShopeeMapResult {
    try {
      const produto = this.buildProduto(row);
      const loja = this.pickOptionalString(row, ["shop_name", "Nome da Loja", "Loja", "loja", "seller_name"]);

      if (produto.preco < ShopeeMapper.MIN_PRICE) {
        return this.discard(`preco_abaixo_do_minimo: ${produto.preco} < ${ShopeeMapper.MIN_PRICE}`);
      }

      if (!this.hasAffiliateTracking(produto.link)) {
        return this.discard("link_sem_tracking_afiliado");
      }

      const pausedMatch = this.findPausedStoreMatch([loja, produto.categoria]);
      if (pausedMatch) {
        return this.discard(`loja_ou_categoria_pausada: ${pausedMatch}`);
      }

      return { isValid: true, produto, motivo: null };
    } catch (error) {
      const motivo = error instanceof Error ? error.message : "linha_malformada";
      return this.discard(motivo);
    }
  }

  private buildProduto(row: ShopeeCsvRow): ProdutoShopee {
    const nome = this.pickRequiredString(row, ["title", "Nome do Produto", "nome", "nome_produto", "product_name"]);
    const preco = this.parsePrice(this.pickRequiredString(row, ["sale_price", "price", "Pre\u00e7o", "Pre\u00c3\u00a7o", "Preco", "preco"]));
    const link = this.pickRequiredString(row, ["product_short link", "product_link", "Link de Afiliado", "link_afiliado", "link", "affiliate_link"]);
    const imagem = this.pickOptionalString(row, ["image_link", "image_link_3", "Imagem", "imagem", "image", "image_url"]);
    const categoria = this.buildCategoria(row);

    if (!this.isValidAffiliateLink(link)) {
      throw new Error("link_de_afiliado_ausente_ou_invalido");
    }

    if (!Number.isFinite(preco) || preco <= 0) {
      throw new Error("preco_ausente_ou_invalido");
    }

    return {
      nome,
      preco,
      link,
      imagem,
      categoria,
    };
  }

  private discard(motivo: string): ShopeeMapResult {
    return {
      isValid: false,
      produto: null,
      motivo,
    };
  }

  private pickRequiredString(row: ShopeeCsvRow, keys: string[]): string {
    const value = this.pickOptionalString(row, keys);

    if (!value) {
      throw new Error(`campo_obrigatorio_ausente: ${keys[0]}`);
    }

    return value;
  }

  private pickOptionalString(row: ShopeeCsvRow, keys: string[]): string | null {
    for (const key of keys) {
      const value = row[key];

      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }

      if (typeof value === "number" && Number.isFinite(value)) {
        return String(value);
      }
    }

    return null;
  }

  private buildCategoria(row: ShopeeCsvRow): string | null {
    const globalCategories = [
      this.pickOptionalString(row, ["global_category1"]),
      this.pickOptionalString(row, ["global_category2"]),
      this.pickOptionalString(row, ["global_category3"]),
    ].filter((category): category is string => Boolean(category));

    if (globalCategories.length) {
      return globalCategories.join(" > ");
    }

    return this.pickOptionalString(row, ["Categoria", "categoria", "category"]);
  }

  private parsePrice(rawPrice: string): number {
    const clean = rawPrice
      .replace(/[^\d,.-]/g, "")
      .replace(/\s/g, "")
      .trim();

    if (!clean) {
      return Number.NaN;
    }

    const normalized = this.normalizeDecimalSeparator(clean);
    return Number.parseFloat(normalized);
  }

  private normalizeDecimalSeparator(value: string): string {
    const hasComma = value.includes(",");
    const hasDot = value.includes(".");

    if (hasComma && hasDot) {
      const lastComma = value.lastIndexOf(",");
      const lastDot = value.lastIndexOf(".");

      if (lastComma > lastDot) {
        return value.replace(/\./g, "").replace(",", ".");
      }

      return value.replace(/,/g, "");
    }

    if (hasComma) {
      return value.replace(",", ".");
    }

    return value;
  }

  private isValidAffiliateLink(link: string): boolean {
    try {
      const url = new URL(link);
      return url.protocol === "https:" && Boolean(url.hostname);
    } catch {
      return false;
    }
  }

  private hasAffiliateTracking(link: string): boolean {
    try {
      const url = new URL(link);
      const hostname = url.hostname.toLowerCase();

      if (ShopeeMapper.AFFILIATE_SHORT_HOSTS.includes(hostname)) {
        return true;
      }

      return ShopeeMapper.TRACKING_PARAMS.some((param) => url.searchParams.has(param));
    } catch {
      return false;
    }
  }

  private findPausedStoreMatch(values: Array<string | null>): string | null {
    for (const value of values) {
      const normalized = this.normalizeText(value);
      if (!normalized) continue;

      const match = ShopeeMapper.PAUSED_STORES.find((pausedStore) => normalized.includes(pausedStore));
      if (match) return match;
    }

    return null;
  }

  private normalizeText(value: string | null): string {
    return (value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }
}
