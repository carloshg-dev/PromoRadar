/**
 * Limpa produtos que estão na SUBCATEGORIA ERRADA, usando exatamente a mesma
 * regra da coleta (conflitaCategoria). Roda em DRY-RUN por padrão (só conta e
 * mostra exemplos); só apaga de verdade com a flag --apply.
 *
 *   npx tsx scripts/limpar-categorias.ts            # dry-run (seguro)
 *   npx tsx scripts/limpar-categorias.ts --apply    # apaga de verdade
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createAdminClient } from "@/infrastructure/supabase/admin";
import { conflitaCategoria } from "@/infrastructure/scraping/core/categoria-guard";
import type { CategoriaSlug } from "@/core/domain/types";

const APPLY = process.argv.includes("--apply");

async function main() {
  const sb = createAdminClient();

  // mapa categoria_id -> slug
  const { data: cats } = await sb.from("categorias").select("id,slug");
  const slugDe = new Map((cats ?? []).map((c) => [c.id as string, c.slug as string]));

  // mapa loja_id -> adapter_key (só p/ exibir de onde veio)
  const { data: lojas } = await sb.from("lojas").select("id,adapter_key");
  const lojaDe = new Map((lojas ?? []).map((l) => [l.id as string, l.adapter_key as string]));

  // varre todos os produtos em páginas de 1000
  const conflitantes: Array<{ id: string; slug: string; loja: string; titulo: string }> = [];
  let from = 0;
  const PAGE = 1000;
  for (;;) {
    const { data, error } = await sb
      .from("produtos")
      .select("id,titulo,categoria_id,loja_id")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const p of data) {
      const slug = slugDe.get(p.categoria_id as string);
      if (!slug) continue;
      if (conflitaCategoria(slug as CategoriaSlug, p.titulo as string)) {
        conflitantes.push({
          id: p.id as string,
          slug,
          loja: lojaDe.get(p.loja_id as string) ?? "?",
          titulo: p.titulo as string,
        });
      }
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }

  // resumo por categoria + loja
  const porCat = new Map<string, number>();
  const porLoja = new Map<string, number>();
  for (const c of conflitantes) {
    porCat.set(c.slug, (porCat.get(c.slug) ?? 0) + 1);
    porLoja.set(c.loja, (porLoja.get(c.loja) ?? 0) + 1);
  }

  console.log(`\n🔎 ${conflitantes.length} produtos fora da categoria certa\n`);
  console.log("Por categoria:");
  for (const [k, v] of [...porCat.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`);
  console.log("\nPor loja:");
  for (const [k, v] of [...porLoja.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`);
  console.log("\nExemplos (até 20):");
  for (const c of conflitantes.slice(0, 20)) console.log(`  [${c.slug}] ${c.loja} — ${c.titulo.slice(0, 70)}`);

  if (!APPLY) {
    console.log(`\n💡 DRY-RUN. Nada foi apagado. Rode com --apply para remover os ${conflitantes.length}.`);
    return;
  }

  // apaga em lotes de 200
  let apagados = 0;
  for (let i = 0; i < conflitantes.length; i += 200) {
    const ids = conflitantes.slice(i, i + 200).map((c) => c.id);
    const { error } = await sb.from("produtos").delete().in("id", ids);
    if (error) throw error;
    apagados += ids.length;
    console.log(`  apagados ${apagados}/${conflitantes.length}`);
  }
  console.log(`\n✅ ${apagados} produtos fora de categoria removidos.`);
}
main().catch((e) => { console.error("❌", e); process.exit(1); });
