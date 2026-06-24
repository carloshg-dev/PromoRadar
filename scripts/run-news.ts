import { config } from "dotenv";
config({ path: ".env.local" });
import { coletarNoticias } from "@/infrastructure/news/news.service";

coletarNoticias()
  .then((r) => { console.log("✅ Notícias:", r); })
  .catch((e) => { console.error("❌", e); process.exit(1); });
