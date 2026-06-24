/**
 * Apaga TODOS os produtos da Lomadee (dados de TESTE). A busca da Lomadee é
 * fuzzy demais (trouxe brinquedo/roupa/ferramenta) e o adapter está EM ESPERA
 * até ganhar um filtro melhor. Roda dry-run por padrão; --apply apaga.
 *
 *   npx tsx scripts/limpar-lomadee.ts            # só conta
 *   npx tsx scripts/limpar-lomadee.ts --apply    # apaga
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createAdminClient } from "@/infrastructure/supabase/admin";

const APPLY = process.argv.includes("--apply");

async function main() {
  const sb = createAdminClient();
  const { data: loja } = await sb.from("lojas").select("id").eq("adapter_key", "lomadee").maybeSingle();
  if (!loja?.id) { console.log("Loja lomadee não encontrada — nada a fazer."); return; }

  const { count } = await sb
    .from("produtos")
    .select("id", { count: "exact", head: true })
    .eq("loja_id", loja.id as string);
  console.log(`Lomadee tem ${count ?? 0} produtos.`);

  if (!APPLY) { console.log("DRY-RUN. Rode com --apply para apagar."); return; }

  const { error } = await sb.from("produtos").delete().eq("loja_id", loja.id as string);
  if (error) throw error;
  console.log(`✅ Produtos da Lomadee apagados (${count ?? 0}).`);
}
main().catch((e) => { console.error("❌", e); process.exit(1); });
