import { top5DoDia } from "@/infrastructure/repositories/produtos.repo";
import { montarCampanha } from "@/pipeline/campaign.service";
import { criarCampanha, produtoTeveCampanhaRecente } from "@/pipeline/campanhas.repo";

/**
 * SERVIÇO CURADORIA (etapa 1) — seleciona os achados do dia (top5DoDia, já
 * blindado contra âncora falsa) e cria campanhas no status CURATED. Anti-repeat:
 * pula produto que já teve campanha nos últimos `dias` (não reposta o mesmo).
 * O trabalho pesado de seleção mora no banco; aqui só persiste os 5.
 */
export async function curar(n = 5, diasAntiRepeat = 7): Promise<number> {
  const achados = await top5DoDia(n);
  let criadas = 0;
  for (const a of achados) {
    if (await produtoTeveCampanhaRecente(a.id, diasAntiRepeat)) continue;
    const c = montarCampanha(a);
    await criarCampanha({
      produtoId: a.id,
      lojaSlug: a.lojaSlug,
      scoreConteudo: a.scoreConteudo,
      headline: c.headline,
      legenda: c.legenda,
      hashtags: c.hashtags,
      plataformas: ["telegram", "discord"],
      metadados: c.metadados,
      status: "CURATED",
    });
    criadas++;
  }
  return criadas;
}
