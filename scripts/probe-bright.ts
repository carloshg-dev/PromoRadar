import { config } from "dotenv";
config({ path: ".env.local" });
import { brightFetch, brightConfigurado } from "@/infrastructure/scraping/core/bright-fetch";

const alvos = [
  "https://www.terabyteshop.com.br/hardware/placas-de-video",
  "https://www.pichau.com.br/hardware/placas-de-video",
];

(async () => {
  if (!brightConfigurado()) {
    console.log("⚠ Bright Data não configurado. Adicione BRIGHTDATA_API_KEY e BRIGHTDATA_UNLOCKER_ZONE no .env.local");
    return;
  }
  for (const url of alvos) {
    try {
      const md = await brightFetch(url, { dataFormat: "markdown" });
      const temPreco = /R\$\s?\d/.test(md);
      console.log(`\n==== ${url}\nrecebido ${md.length} chars | tem preço? ${temPreco}`);
      const i = md.indexOf("R$");
      if (i > 0) console.log("trecho:", md.slice(i - 120, i + 60).replace(/\s+/g, " "));
    } catch (e) {
      console.log(`\n==== ${url}\nERRO: ${(e as Error).message}`);
    }
  }
})();
