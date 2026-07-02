import { createPublicClient } from "@/infrastructure/supabase/client";
import { redeAfiliada } from "@/lib/afiliados";

/** Loja pronta pra vitrine/Barra de lojas. */
export interface LojaVitrine {
  slug: string;
  nome: string;
  logoUrl: string | null;
  baseUrl: string | null;
  adapterKey: string;
  /** rede de afiliado ativa (null = ainda não monetiza) */
  rede: string | null;
}

/**
 * Lojas ativas p/ a Barra de lojas — MONETIZADAS PRIMEIRO (filosofia do dono:
 * quem paga comissão vira destaque), depois alfabético. Data-driven: loja nova
 * criada pela coleta multi-loja aparece sozinha; loja desativada some.
 */
export async function listarLojasVitrine(): Promise<LojaVitrine[]> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("lojas")
    .select("slug,nome,logo_url,base_url,adapter_key")
    .eq("ativo", true)
    .order("nome");
  if (error) throw error;
  const lojas: LojaVitrine[] = (data ?? []).map((l) => ({
    slug: l.slug as string,
    nome: l.nome as string,
    logoUrl: (l.logo_url as string) ?? null,
    baseUrl: (l.base_url as string) ?? null,
    adapterKey: l.adapter_key as string,
    rede: redeAfiliada(l.adapter_key as string),
  }));
  return lojas.sort((a, b) => {
    const m = (b.rede ? 1 : 0) - (a.rede ? 1 : 0);
    return m !== 0 ? m : a.nome.localeCompare(b.nome, "pt-BR");
  });
}
