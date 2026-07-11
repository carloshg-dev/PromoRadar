/**
 * CollectionService — Service Layer da coleta.
 *
 * Orquestra os adapters de forma resiliente (um adapter que falha não derruba
 * os outros), enriquece cada item com o PromoScore calculado contra o histórico
 * real do banco, e persiste via upsert. Registra job + logs em scrape_jobs/_logs.
 */

import { createAdminClient } from "@/infrastructure/supabase/admin";
import { getAdapters } from "@/infrastructure/scraping/registry";
import type { AdapterContext } from "@/infrastructure/scraping/core/adapter";
import { conflitaCategoria } from "@/infrastructure/scraping/core/categoria-guard";
import { computePromoScore } from "@/core/promo-score/promo-score";
import { notificarColeta } from "@/infrastructure/notify/owner";
import { degolada, PISO_GUILHOTINA } from "@/core/guilhotina";
import { traduzirTitulo } from "@/core/traducao-titulos";
import { avisarPromocoesNovas, type DealNovo } from "@/infrastructure/notify/promo-feed";
import type { AdapterKey, RawProduct } from "@/core/domain/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface CollectionResult {
  jobId: string;
  coletados: number;
  salvos: number;
  erros: number;
  porAdapter: Record<string, { coletados: number; salvos: number; erros: number; descartados: number }>;
}

export async function executarColeta(keys?: AdapterKey[]): Promise<CollectionResult> {
  const sb = createAdminClient();
  const adapters = getAdapters(keys);

  const { data: job, error: jobErr } = await sb
    .from("scrape_jobs")
    .insert({ adapter_key: keys?.join(",") ?? "all", status: "running", iniciado_em: new Date().toISOString() })
    .select("id")
    .single();
  if (jobErr || !job) throw new Error(`Falha ao criar job: ${jobErr?.message}`);
  const jobId = job.id as string;

  const lojas = await mapaLojas(sb);
  const lojasPorSlug = await mapaLojasPorSlug(sb);
  const categorias = await mapaCategorias(sb);

  // GUILHOTINA STICKY (fix D5 da auditoria): loja já DESATIVADA não é repopulada.
  // Sem isso, o adapter re-coletava produto (em_estoque=true) numa loja ativo=false
  // e a guilhotina (que só avalia lojas ATIVAS) nunca re-ocultava → zumbi visível
  // no site (caso Diesel/Panasonic). Agora o item de loja inativa é descartado.
  const { data: inativasData } = await sb.from("lojas").select("slug").eq("ativo", false);
  const inativas = new Set((inativasData ?? []).map((l) => l.slug as string));

  const result: CollectionResult = { jobId, coletados: 0, salvos: 0, erros: 0, porAdapter: {} };
  const novosDeals: DealNovo[] = []; // quedas de preço reais p/ avisar usuários (Telegram/Discord)

  // Buffer de logs: em ambiente serverless, inserts "fire-and-forget" podem ser
  // descartados ao fim da request. Acumulamos e gravamos de forma AGUARDADA.
  const logBuffer: Array<{ job_id: string; adapter_key: string; nivel: string; mensagem: string }> = [];
  const flushLogs = async () => {
    if (!logBuffer.length) return;
    const batch = logBuffer.splice(0, logBuffer.length);
    await sb.from("scrape_logs").insert(batch);
  };

  for (const adapter of adapters) {
    const stats = { coletados: 0, salvos: 0, erros: 0, descartados: 0 };
    const ctx: AdapterContext = {
      log: (nivel, msg) => {
        logBuffer.push({ job_id: jobId, adapter_key: adapter.key, nivel, mensagem: msg });
      },
    };
    try {
      const itens = await adapter.coletar(ctx);
      stats.coletados = itens.length;
      ctx.log("info", `coletados=${itens.length} itens`);
      // Adapter clássico (1 loja): exige a loja cadastrada, como sempre. Adapter
      // MULTI-LOJA (itens com `loja` própria): cada loja resolve — e nasce — no loop.
      const lojaPadraoId = lojas.get(adapter.key);
      if (!lojaPadraoId && itens.some((i) => !i.loja)) {
        throw new Error(`Loja '${adapter.key}' não cadastrada`);
      }

      for (const item of itens) {
        // Loja guilhotinada (ativo=false) NÃO repopula — descarta antes de salvar.
        if (item.loja && inativas.has(item.loja.slug)) { stats.descartados++; continue; }
        // REGRA DO DONO (02/07): título em português, qualquer loja (glossário).
        item.titulo = traduzirTitulo(item.titulo);
        // FILTRO DE QUALIDADE (regra do dono 03/07): vitrine cega não vende —
        // produto SEM IMAGEM é descartado central (vale p/ TODOS os adapters).
        // (O "muito barato" é a guilhotina abaixo, piso R$20 via PISO_PRECO_BRL.)
        if (!item.imagemUrl || !/^https?:\/\//i.test(item.imagemUrl)) {
          stats.descartados++;
          continue;
        }
        // Guilhotina: oferta abaixo do piso (R$20) é isca/erro de feed → descartada.
        if (degolada(item.precoAtual)) {
          stats.descartados++;
          continue;
        }
        // Guarda de sanidade: descarta produto cujo título não pertence à categoria
        // (ex: PC/notebook/gabinete/placa-mãe rotulados como "SSD"). Vale p/ todos.
        if (conflitaCategoria(item.categoriaSlug, item.titulo)) {
          stats.descartados++;
          continue;
        }
        try {
          const alvo = item.loja
            ? await resolverLoja(sb, lojasPorSlug, item.loja, adapter.key)
            : { id: lojaPadraoId!, nome: adapter.nome };
          const deal = await salvarProduto(sb, item, alvo.id, alvo.nome, categorias);
          if (deal) novosDeals.push(deal);
          stats.salvos++;
        } catch (e) {
          stats.erros++;
          ctx.log("error", `Salvar '${item.titulo}': ${(e as Error).message}`);
        }
      }
      if (stats.descartados) ctx.log("info", `descartados ${stats.descartados} itens (guilhotina <R$${PISO_GUILHOTINA} / fora de categoria)`);
    } catch (e) {
      stats.erros++;
      ctx.log("error", `Adapter ${adapter.key} falhou: ${(e as Error).message}`);
    }
    result.porAdapter[adapter.key] = stats;
    result.coletados += stats.coletados;
    result.salvos += stats.salvos;
    result.erros += stats.erros;
    await flushLogs();
  }

  await flushLogs();

  await sb
    .from("scrape_jobs")
    .update({
      status: result.erros > 0 && result.salvos > 0 ? "partial" : result.salvos > 0 ? "success" : "failed",
      finalizado_em: new Date().toISOString(),
      itens_coletados: result.coletados,
      itens_salvos: result.salvos,
      erros: result.erros,
    })
    .eq("id", jobId);

  await notificarColeta(result); // avisa o DONO (Discord + Telegram): saúde da coleta
  await avisarPromocoesNovas(novosDeals); // feed PÚBLICO de ofertas (chaves próprias; no-op se não configurado)

  // "Lista real de afiliação": por loja, quanto MONETIZA (afiliado) vs ainda não.
  // SÓ lojas ativas (a guilhotina desativa loja + oculta produto; sem o filtro,
  // as 13 lojas desligadas em 02-03/07 continuavam aparecendo como "potencial"
  // toda coleta) e SÓ produtos em_estoque (senão a contagem é o total histórico
  // acumulado — nunca cai mesmo com stale-sweep, já que a linha não é deletada).
  // GUILHOTINA DE VOLUME (regra do dono 04/07): só catálogo de ALTO VOLUME roda.
  // Loja com 1..(MIN-1) produtos válidos = coletada mas fraca → BLOQUEADA (ativo=
  // false + produtos ocultados). Loja em 0 = ainda não coletada (marca nova como
  // Acer/Eudora/Dufrio) → POUPADA, será avaliada quando o feed dela chegar.
  // GUILHOTINA_MIN_PRODUTOS=0 desliga a regra.
  const MIN_VOLUME = Number(process.env.GUILHOTINA_MIN_PRODUTOS) || 200;
  const guilhotinadas: string[] = [];
  try {
    const { data: ls } = await sb.from("lojas").select("id, adapter_key, nome").eq("ativo", true);
    for (const l of ls ?? []) {
      const { count } = await sb.from("produtos").select("id", { count: "exact", head: true })
        .eq("loja_id", l.id as string).eq("em_estoque", true);
      const n = count ?? 0;
      if (MIN_VOLUME > 0 && n >= 1 && n < MIN_VOLUME) {
        await sb.from("lojas").update({ ativo: false }).eq("id", l.id as string);
        await sb.from("produtos").update({ em_estoque: false }).eq("loja_id", l.id as string).eq("em_estoque", true);
        guilhotinadas.push(`${(l.nome as string) || (l.adapter_key as string)} (${n})`);
      }
    }
    if (guilhotinadas.length) console.log(`⚔️ Guilhotina de volume (<${MIN_VOLUME}): ${guilhotinadas.join(", ")} DESATIVADAS`);
    // A "💰 Lista real de afiliação" agora é enviada UMA vez pelo digest (roda por
    // último, via `needs`), não por job — evita os retratos parciais/conflitantes
    // (o job da Amazon enviava a lista sem a Kabum, que ainda estava coletando).
  } catch { /* a guilhotina nunca derruba a coleta */ }

  return result;
}

async function salvarProduto(
  sb: SupabaseClient,
  item: RawProduct,
  lojaId: string,
  lojaNome: string,
  categorias: Map<string, string>,
): Promise<DealNovo | null> {
  const categoriaId = categorias.get(item.categoriaSlug) ?? null;

  // Busca histórico p/ PromoScore. id existente via (loja, sku).
  const { data: existente } = await sb
    .from("produtos")
    .select("id,preco_atual,preco_min_hist,preco_max_hist,preco_avg_hist")
    .eq("loja_id", lojaId)
    .eq("sku_loja", item.skuLoja)
    .maybeSingle();

  let sampleSize = 0;
  let promoCount = 0;
  if (existente?.id) {
    // 1 ida ao banco em vez de 2: a latência GitHub↔Supabase (cross-region) é o
    // gargalo da coleta. Histórico só cresce quando o preço muda → poucas linhas.
    const { data: hist } = await sb
      .from("historico_precos")
      .select("desconto_pct")
      .eq("produto_id", existente.id);
    sampleSize = hist?.length ?? 0;
    promoCount = (hist ?? []).filter((h) => ((h.desconto_pct as number) ?? 0) > 0).length;
  }

  const score = computePromoScore({
    precoAtual: item.precoAtual,
    precoOriginal: item.precoOriginal,
    emEstoque: item.emEstoque,
    precoAnterior: (existente?.preco_atual as number) ?? null,
    stats: {
      min: (existente?.preco_min_hist as number) ?? null,
      max: (existente?.preco_max_hist as number) ?? null,
      avg: (existente?.preco_avg_hist as number) ?? null,
      sampleSize,
      promoCount,
    },
  });

  // Desconto exibido: usa o real (vs. média) quando há histórico; senão o anunciado.
  const descontoAnunciado =
    item.precoOriginal && item.precoOriginal > item.precoAtual
      ? Math.round((1 - item.precoAtual / item.precoOriginal) * 100)
      : 0;
  const descontoPct = score.descontoReal != null ? Math.max(score.descontoReal, 0) : descontoAnunciado;

  const row = {
    loja_id: lojaId,
    categoria_id: categoriaId,
    sku_loja: item.skuLoja,
    titulo: item.titulo,
    marca: item.marca ?? null,
    url: item.url,
    imagem_url: item.imagemUrl ?? null,
    preco_atual: item.precoAtual,
    preco_original: item.precoOriginal ?? null,
    desconto_pct: descontoPct,
    em_estoque: item.emEstoque,
    promo_score: score.score,
    visto_em: new Date().toISOString(),
  };

  const { error } = await sb.from("produtos").upsert(row, { onConflict: "loja_id,sku_loja" });
  if (error) throw error;

  // Oferta NOVA p/ o feed de usuários: só quando o preço CAIU de verdade (≥5%) em
  // relação à observação anterior e a nota é decente. Dispara em queda real → não
  // repete a cada coleta (auto-dedup). Sem `existente`, é 1ª vez vista → não avisa.
  const precoAnterior = (existente?.preco_atual as number) ?? null;
  if (
    precoAnterior != null && item.emEstoque &&
    item.precoAtual < precoAnterior * 0.95 && score.score >= 60
  ) {
    return {
      titulo: item.titulo,
      lojaNome,
      url: item.url,
      precoAtual: item.precoAtual,
      precoAnterior,
      quedaPct: Math.round((1 - item.precoAtual / precoAnterior) * 100),
      score: score.score,
    };
  }
  return null;
}

async function mapaLojas(sb: SupabaseClient): Promise<Map<string, string>> {
  const { data } = await sb.from("lojas").select("id,adapter_key");
  return new Map((data ?? []).map((l) => [l.adapter_key as string, l.id as string]));
}

type LojaRef = { id: string; nome: string };

async function mapaLojasPorSlug(sb: SupabaseClient): Promise<Map<string, LojaRef>> {
  const { data } = await sb.from("lojas").select("id,slug,nome");
  return new Map(
    (data ?? []).map((l) => [l.slug as string, { id: l.id as string, nome: l.nome as string }]),
  );
}

/**
 * Resolve a loja de um item MULTI-LOJA; na 1ª aparição a loja é CRIADA (com
 * nome/logo/selo) e cacheada — coletas seguintes só reusam. Se o insert falhar
 * (corrida entre jobs / slug já existente), reusa a linha existente pelo slug.
 */
async function resolverLoja(
  sb: SupabaseClient,
  cache: Map<string, LojaRef>,
  loja: NonNullable<RawProduct["loja"]>,
  adapterKey: string,
): Promise<LojaRef> {
  const hit = cache.get(loja.slug);
  if (hit) return hit;

  const { data, error } = await sb
    .from("lojas")
    .insert({
      slug: loja.slug,
      nome: loja.nome,
      base_url: loja.baseUrl ?? null,
      logo_url: loja.logoUrl ?? null,
      adapter_key: adapterKey,
      ativo: true,
      selo: "oficial",
    })
    .select("id,nome")
    .single();
  if (!error && data) {
    const ref = { id: data.id as string, nome: data.nome as string };
    cache.set(loja.slug, ref);
    return ref;
  }

  const { data: existente } = await sb.from("lojas").select("id,nome").eq("slug", loja.slug).maybeSingle();
  if (existente) {
    const ref = { id: existente.id as string, nome: existente.nome as string };
    cache.set(loja.slug, ref);
    return ref;
  }
  throw new Error(`criar loja '${loja.slug}': ${error?.message ?? "motivo desconhecido"}`);
}
async function mapaCategorias(sb: SupabaseClient): Promise<Map<string, string>> {
  const { data } = await sb.from("categorias").select("id,slug");
  return new Map((data ?? []).map((c) => [c.slug as string, c.id as string]));
}
