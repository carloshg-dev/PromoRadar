import { createReadStream } from "node:fs";
import { join } from "node:path";
import type { Transform } from "node:stream";

type CsvParserFactory = (options?: { separator?: string }) => Transform;

const csvParser = require("csv-parser") as CsvParserFactory;

const CSV_PATH = join(process.cwd(), "feeds", "shopee", "shopee-link1.csv");

async function inspectFirstRow(separator: "," | ";"): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const source = createReadStream(CSV_PATH);
    const parser = csvParser({ separator });
    let resolved = false;

    const finish = () => {
      if (resolved) return;
      resolved = true;
      resolve();
    };

    source.on("error", reject);
    parser.on("error", reject);

    parser.once("data", (row: Record<string, unknown>) => {
      const keys = Object.keys(row);

      console.log(`\n=== Diagnostico csv-parser | separador "${separator}" ===`);
      console.log(`Total de chaves detectadas: ${keys.length}`);
      console.log("Chaves exatas:");
      console.log(keys);
      console.log("Primeiro objeto bruto:");
      console.log(row);

      source.destroy();
      parser.destroy();
      finish();
    });

    parser.once("end", () => {
      console.log(`\n=== Diagnostico csv-parser | separador "${separator}" ===`);
      console.log("Nenhuma linha de dados foi encontrada.");
      finish();
    });

    source.pipe(parser);
  });
}

async function main(): Promise<void> {
  console.log(`Arquivo analisado: ${CSV_PATH}`);
  await inspectFirstRow(",");
  await inspectFirstRow(";");
}

main().catch((error) => {
  console.error("[read-headers] Falha ao ler cabecalhos:", error);
  process.exitCode = 1;
});
