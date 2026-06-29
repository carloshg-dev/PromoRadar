import { createReadStream } from "node:fs";
import { EventEmitter } from "node:events";
import { isAbsolute, join, resolve } from "node:path";
import { ShopeeMapper, type ShopeeCsvRow } from "./ShopeeMapper";
import type { ProdutoShopee } from "./ShopeeTypes";

interface CsvParserOptions {
  separator?: string;
  mapHeaders?: (args: { header: string; index: number }) => string;
}

type CsvParserFactory = (options?: CsvParserOptions) => NodeJS.ReadWriteStream;

const csvParser = require("csv-parser") as CsvParserFactory;

export interface ShopeeProcessorOptions {
  feedsDir?: string;
  separator?: string;
}

export interface ShopeeProcessorStats {
  linhasLidas: number;
  produtosValidos: number;
  linhasInvalidas: number;
  motivosDescarte: Record<string, number>;
}

export declare interface ShopeeProcessor {
  on(event: "data", listener: (produto: ProdutoShopee) => void): this;
  on(event: "error", listener: (error: Error) => void): this;
  on(event: "end", listener: (stats: ShopeeProcessorStats) => void): this;
}

export class ShopeeProcessor extends EventEmitter {
  private readonly feedsDir: string;
  private readonly separator: string;

  constructor(options: ShopeeProcessorOptions = {}) {
    super();

    this.feedsDir = options.feedsDir ?? join(process.cwd(), "feeds", "shopee");
    this.separator = options.separator ?? ",";
  }

  processFile(fileName: string): void {
    const stats: ShopeeProcessorStats = {
      linhasLidas: 0,
      produtosValidos: 0,
      linhasInvalidas: 0,
      motivosDescarte: {},
    };

    try {
      const filePath = this.resolveFilePath(fileName);
      const source = createReadStream(filePath);

      source
        .on("error", (error: Error) => {
          this.emit("error", error);
        })
        .pipe(csvParser({
          separator: this.separator,
          mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, ""),
        }))
        .on("data", (row: ShopeeCsvRow) => {
          stats.linhasLidas += 1;

          try {
            const result = new ShopeeMapper().map(row);

            if (!result.isValid) {
              this.recordDiscard(stats, stats.linhasLidas, result.motivo);
              return;
            }

            stats.produtosValidos += 1;
            this.emit("data", result.produto);
          } catch (error) {
            this.recordDiscard(stats, stats.linhasLidas, this.getErrorMessage(error));
          }
        })
        .on("error", (error: Error) => {
          this.emit("error", error);
        })
        .on("end", () => {
          this.emit("end", stats);
        });
    } catch (error) {
      this.emit("error", error instanceof Error ? error : new Error(String(error)));
    }
  }

  private resolveFilePath(fileName: string): string {
    if (isAbsolute(fileName)) {
      return fileName;
    }

    if (fileName.includes("/") || fileName.includes("\\")) {
      return resolve(process.cwd(), fileName);
    }

    return join(this.feedsDir, fileName);
  }

  private recordDiscard(stats: ShopeeProcessorStats, lineNumber: number, motivo: string): void {
    stats.linhasInvalidas += 1;
    stats.motivosDescarte[motivo] = (stats.motivosDescarte[motivo] ?? 0) + 1;
    this.logMalformedRow(lineNumber, motivo);
  }

  private logMalformedRow(lineNumber: number, error: unknown): void {
    console.error(`[ShopeeProcessor] Linha malformada ${lineNumber}: ${this.getErrorMessage(error)}`);
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error || "Erro desconhecido.");
  }
}

function getPrincipalMotivoDescarte(stats: ShopeeProcessorStats): string {
  const [motivo, total] = Object.entries(stats.motivosDescarte)
    .sort((a, b) => b[1] - a[1])[0] ?? ["nenhum", 0];

  return total > 0 ? `${motivo} (${total})` : "nenhum";
}

function isDirectCliExecution(): boolean {
  const entrypoint = process.argv[1]?.replace(/\\/g, "/") ?? "";
  return entrypoint.endsWith("/ShopeeProcessor.ts") || entrypoint.endsWith("/ShopeeProcessor.js");
}

function runCli(): void {
  const fileName = process.argv[2];

  if (!fileName) {
    console.error("Uso: tsx src/infrastructure/shopee/ShopeeProcessor.ts <arquivo-csv>");
    process.exitCode = 1;
    return;
  }

  console.log(`Iniciando processamento do arquivo: ${fileName}`);

  const processor = new ShopeeProcessor();

  processor.on("error", (error) => {
    console.error(`[ShopeeProcessor] Erro ao processar arquivo: ${error.message}`);
    process.exitCode = 1;
  });

  processor.on("end", (stats) => {
    console.log(`Total de produtos lidos: ${stats.linhasLidas}`);
    console.log(`Total de válidos: ${stats.produtosValidos}`);
    console.log(`Total de descartados: ${stats.linhasInvalidas}`);
    console.log(`Principal motivo de descarte: ${getPrincipalMotivoDescarte(stats)}`);
  });

  processor.processFile(fileName);
}

if (isDirectCliExecution()) {
  runCli();
}
