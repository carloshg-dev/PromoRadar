import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ShopeeMapper } from "./ShopeeMapper";
import { ShopeeProcessor, type ShopeeProcessorStats } from "./ShopeeProcessor";
import type { ProdutoShopee } from "./ShopeeTypes";

const FEEDS_DIR = join(process.cwd(), "feeds", "shopee");
const TEST_FILE_NAME = "teste.csv";
const TEST_FILE_PATH = join(FEEDS_DIR, TEST_FILE_NAME);

async function criarCsvTemporario(): Promise<void> {
  const csv = [
    "Nome do Produto,Preco,Link de Afiliado,Nome da Loja,Categoria",
    'Cabo USB Reforcado,"R$ 29,90",https://s.shopee.com.br/teste-cabo,Loja Tech,Eletronicos',
    'Fone Bluetooth,"R$ 159,99",https://s.shopee.com.br/teste-fone,Loja Audio,Eletronicos',
    'Webcam Full HD,"R$ 1.234,56",https://s.shopee.com.br/teste-webcam,Loja Video,Eletronicos',
  ].join("\n");

  await mkdir(FEEDS_DIR, { recursive: true });
  await writeFile(TEST_FILE_PATH, csv, "utf8");
}

async function processarCsvTemporario(): Promise<ShopeeProcessorStats> {
  const processor = new ShopeeProcessor({ feedsDir: FEEDS_DIR });
  const produtos: ProdutoShopee[] = [];

  return new Promise((resolve, reject) => {
    processor.on("data", (produto) => {
      produtos.push(produto);
      console.log("[ProdutoShopee]", produto);
    });

    processor.on("error", reject);

    processor.on("end", (stats) => {
      console.log(`[ShopeeProcessor] Total de produtos lidos: ${stats.linhasLidas}`);
      console.log(`[ShopeeProcessor] Total de produtos processados: ${stats.produtosValidos}`);
      console.log(`[ShopeeProcessor] Total de linhas invalidas: ${stats.linhasInvalidas}`);
      console.log(`[ShopeeProcessor] Total em memoria neste teste: ${produtos.length}`);
      resolve(stats);
    });

    processor.processFile(TEST_FILE_NAME);
  });
}

async function main(): Promise<void> {
  await criarCsvTemporario();

  const mapper = new ShopeeMapper();
  const sanityCheck = mapper.map({
    "Nome do Produto": "Produto Sanity Check",
    Preco: "R$ 20,00",
    "Link de Afiliado": "https://s.shopee.com.br/sanity-check",
  });

  console.log("[ShopeeMapper] Sanity check:", sanityCheck);
  await processarCsvTemporario();
}

main().catch((error) => {
  console.error("[test-ingestion] Falha no teste de ingestao:", error);
  process.exitCode = 1;
});

