import { lomadeeLogoUrl } from "@/core/lomadee-parceiros";

/**
 * CUPONS LOMADEE — a API /affiliate/campaigns entrega ~1.100 campanhas (cupom +
 * oferta) já com o LINK DE AFILIADO cunhado pro nosso canal (channels[].shortUrls).
 * Aqui só filtramos o que está NO AR (status onTime + canal liberado + validade)
 * e cruzamos a marca via /affiliate/brands. Zero raspagem — 100% automático.
 * Server-only (usa LOMADEE_API_KEY); a página /cupons revalida de hora em hora.
 */

const BASE = "https://api.lomadee.com.br";
const MAX_POR_LOJA = 4; // teto de cupons por loja (evita "parede" de uma marca só)

export interface CupomLomadee {
  id: string;
  marca: string;
  marcaLogo: string | null;
  titulo: string;
  codigo: string | null;
  link: string;
  terminaEm: string | null;
  destaque: boolean;
  /** cupom curado à mão (fora da Lomadee, ex. Awin) — some no topo. */
  curado?: boolean;
}

interface CampanhaApi {
  id: string;
  name?: string;
  status?: string;
  isHighlight?: boolean;
  organizationId?: string;
  code?: string | null;
  period?: { startAt?: string; endAt?: string };
  channels?: Array<{ shortUrls?: string[] }>;
}

interface MarcaApi { id: string; name?: string }

async function getJson<T>(path: string, key: string): Promise<T | null> {
  try {
    const r = await fetch(`${BASE}${path}`, { headers: { "x-api-key": key } });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch { return null; }
}

export async function listarCupons(max = 60): Promise<CupomLomadee[]> {
  const KEY = process.env.LOMADEE_API_KEY;
  if (!KEY) return [];

  // marcas: organizationId → nome/logo
  const marcas = new Map<string, string>();
  for (let page = 1; page <= 7; page++) {
    const j = await getJson<{ data?: MarcaApi[] }>(`/affiliate/brands?limit=100&page=${page}`, KEY);
    const data = j?.data ?? [];
    for (const m of data) if (m.id && m.name) marcas.set(m.id, m.name);
    if (!data.length) break;
  }

  const agora = Date.now();
  const cupons: CupomLomadee[] = [];
  for (let page = 1; page <= 4 && cupons.length < max * 3; page++) {
    const j = await getJson<{ data?: CampanhaApi[] }>(`/affiliate/campaigns?limit=100&page=${page}`, KEY);
    const data = j?.data ?? [];
    for (const c of data) {
      const link = c.channels?.[0]?.shortUrls?.[0];
      if (!link) continue;                       // canal não liberado → fora
      if (c.status && c.status !== "onTime") continue; // encerrada/agendada → fora
      const fim = c.period?.endAt ? Date.parse(c.period.endAt) : NaN;
      if (Number.isFinite(fim) && fim < agora) continue; // validade vencida → fora
      const inicio = c.period?.startAt ? Date.parse(c.period.startAt) : NaN;
      if (Number.isFinite(inicio) && inicio > agora) continue; // ainda não começou
      cupons.push({
        id: c.id,
        marca: (c.organizationId && marcas.get(c.organizationId)) || "Parceiro Lomadee",
        marcaLogo: c.organizationId ? lomadeeLogoUrl(c.organizationId) : null,
        titulo: (c.name ?? "Oferta parceira").trim(),
        codigo: c.code?.trim() || null,
        link,
        terminaEm: c.period?.endAt ?? null,
        destaque: Boolean(c.isHighlight),
      });
    }
    if (!data.length) break;
  }

  // destaque primeiro; entre iguais, cupom COM código; depois quem vence antes.
  const ordenado = cupons.sort((a, b) => {
    const d = (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0);
    if (d !== 0) return d;
    const cod = (b.codigo ? 1 : 0) - (a.codigo ? 1 : 0);
    if (cod !== 0) return cod;
    const fa = a.terminaEm ? Date.parse(a.terminaEm) : Infinity;
    const fb = b.terminaEm ? Date.parse(b.terminaEm) : Infinity;
    return fa - fb;
  });

  // TETO POR LOJA (mesma filosofia da vitrine — nada de parede de uma marca):
  // "Lojas REDE" sozinha traz ~metade das campanhas; sem teto ela tomava a página.
  const cont = new Map<string, number>();
  const balanceado = ordenado.filter((c) => {
    const n = cont.get(c.marca) ?? 0;
    if (n >= MAX_POR_LOJA) return false;
    cont.set(c.marca, n + 1);
    return true;
  });
  return balanceado.slice(0, max);
}
