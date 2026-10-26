import "server-only";

import { unstable_cache } from "next/cache";
import { lomadeeLogoUrl } from "@/core/lomadee-parceiros";

/**
 * A API limita as respostas a 20 itens. Buscamos somente campanhas ativas,
 * percorremos um numero limitado de paginas com concorrencia controlada e
 * guardamos apenas o conjunto pequeno que a vitrine pode consumir.
 */
const BASE = "https://api.lomadee.com.br";
const PAGE_SIZE = 20;
const MAX_BRAND_PAGES = 4;
const MAX_CAMPAIGN_PAGES = 8;
const MAX_PARALLEL_PAGES = 1;
const MAX_POR_LOJA = 4;
const MAX_CACHED_RESULTS = 120;
const CACHE_SECONDS = 30 * 60;
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_ATTEMPTS = 3;
const RETRY_BASE_MS = 750;

export interface CupomLomadee {
  id: string;
  marca: string;
  marcaLogo: string | null;
  titulo: string;
  codigo: string | null;
  link: string;
  terminaEm: string | null;
  destaque: boolean;
  /** cupom curado a mao (fora da Lomadee, ex. Awin) - sempre no topo. */
  curado?: boolean;
}

interface CampanhaApi {
  id?: string | number;
  name?: string;
  status?: string;
  isHighlight?: boolean;
  organizationId?: string;
  code?: string | null;
  period?: { startAt?: string; endAt?: string };
  channels?: Array<{
    availableChannel?: boolean | { id?: string; name?: string };
    shortUrls?: string[];
  }>;
}

interface MarcaApi {
  id?: string | number;
  name?: string;
}

interface PaginacaoApi {
  totalPages?: number;
}

interface ColecaoApi<T> {
  data?: T[];
  meta?: PaginacaoApi;
  pagination?: PaginacaoApi;
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function atrasoDoRetryAfter(valor: string | null): number | null {
  if (!valor) return null;

  const segundos = Number(valor);
  if (Number.isFinite(segundos) && segundos >= 0) return segundos * 1_000;

  const data = Date.parse(valor);
  if (!Number.isFinite(data)) return null;
  return Math.max(0, data - Date.now());
}

async function getJson<T>(path: string, key: string): Promise<T> {
  let ultimoErro: unknown;

  for (let tentativa = 0; tentativa < MAX_ATTEMPTS; tentativa++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let proximaEspera = RETRY_BASE_MS * (2 ** tentativa);

    try {
      const response = await fetch(`${BASE}${path}`, {
        headers: { "x-api-key": key },
        next: { revalidate: CACHE_SECONDS },
        signal: controller.signal,
      });

      if (response.ok) return (await response.json()) as T;

      ultimoErro = new Error(`Lomadee respondeu HTTP ${response.status}`);
      const repetivel = response.status === 429 || response.status >= 500;
      if (!repetivel) break;
      proximaEspera = atrasoDoRetryAfter(response.headers.get("retry-after"))
        ?? proximaEspera;
    } catch (error) {
      ultimoErro = error;
    } finally {
      clearTimeout(timeout);
    }

    if (tentativa + 1 < MAX_ATTEMPTS) {
      const jitter = Math.floor(Math.random() * 250);
      await esperar(Math.min(10_000, Math.max(RETRY_BASE_MS, proximaEspera) + jitter));
    }
  }

  throw ultimoErro instanceof Error
    ? ultimoErro
    : new Error("Falha ao consultar a Lomadee");
}

function paginasAmostradas(total: number, maximo: number): number[] {
  const totalSeguro = Math.max(1, Math.trunc(total));
  if (totalSeguro <= maximo) {
    return Array.from({ length: totalSeguro }, (_, index) => index + 1);
  }

  const paginas = new Set<number>([1, totalSeguro]);
  for (let index = 1; paginas.size < maximo; index++) {
    const pagina = 1 + Math.round((index * (totalSeguro - 1)) / (maximo - 1));
    paginas.add(Math.min(totalSeguro, pagina));
  }
  return [...paginas].sort((a, b) => a - b).slice(0, maximo);
}

async function buscarColecao<T>(
  endpoint: string,
  key: string,
  maxPaginas: number,
  filtros: Record<string, string> = {},
): Promise<T[]> {
  const caminho = (pagina: number) => {
    const query = new URLSearchParams({
      ...filtros,
      limit: String(PAGE_SIZE),
      page: String(pagina),
    });
    return `${endpoint}?${query.toString()}`;
  };

  const primeira = await Promise.allSettled([
    getJson<ColecaoApi<T>>(caminho(1), key),
  ]);
  const primeiraResposta = primeira[0];
  const primeiraOk = primeiraResposta?.status === "fulfilled"
    ? primeiraResposta.value
    : null;
  const erroPrimeiraPagina = primeiraResposta?.status === "rejected"
    ? primeiraResposta.reason
    : null;
  const totalPaginas = primeiraOk?.meta?.totalPages
    ?? primeiraOk?.pagination?.totalPages
    ?? maxPaginas;
  const paginas = paginasAmostradas(totalPaginas, maxPaginas)
    .filter((pagina) => pagina !== 1)
    .slice(0, MAX_PARALLEL_PAGES);
  const itens = [...(primeiraOk?.data ?? [])];
  let paginasValidas = primeiraOk ? 1 : 0;

  for (let indice = 0; indice < paginas.length; indice += MAX_PARALLEL_PAGES) {
    const lote = paginas.slice(indice, indice + MAX_PARALLEL_PAGES);
    const respostas = await Promise.allSettled(
      lote.map((pagina) => getJson<ColecaoApi<T>>(caminho(pagina), key)),
    );

    for (const resposta of respostas) {
      if (resposta.status !== "fulfilled") continue;
      paginasValidas++;
      itens.push(...(resposta.value.data ?? []));
    }

    if (indice + MAX_PARALLEL_PAGES < paginas.length) await esperar(150);
  }

  if (paginasValidas === 0) {
    const detalhe = erroPrimeiraPagina instanceof Error
      ? erroPrimeiraPagina.message
      : "sem resposta valida";
    throw new Error(`Lomadee indisponivel em ${endpoint}: ${detalhe}`);
  }

  return itens;
}

function normalizarTexto(valor: string): string {
  return valor.trim().toLocaleLowerCase("pt-BR").replace(/\s+/g, " ");
}

function linkValido(campanha: CampanhaApi): string | null {
  for (const canal of campanha.channels ?? []) {
    if (canal.availableChannel === false) continue;
    for (const shortUrl of canal.shortUrls ?? []) {
      try {
        const url = new URL(shortUrl);
        if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
      } catch {
        // Ignora URL incompleta sem invalidar as demais campanhas.
      }
    }
  }
  return null;
}

function compararCupons(a: CupomLomadee, b: CupomLomadee): number {
  const porDestaque = Number(b.destaque) - Number(a.destaque);
  if (porDestaque !== 0) return porDestaque;

  const porCodigo = Number(Boolean(b.codigo)) - Number(Boolean(a.codigo));
  if (porCodigo !== 0) return porCodigo;

  const fimA = a.terminaEm ? Date.parse(a.terminaEm) : Number.POSITIVE_INFINITY;
  const fimB = b.terminaEm ? Date.parse(b.terminaEm) : Number.POSITIVE_INFINITY;
  if (fimA !== fimB) return fimA < fimB ? -1 : 1;

  return a.titulo.localeCompare(b.titulo, "pt-BR");
}

function balancearPorMarca(cupons: CupomLomadee[]): CupomLomadee[] {
  const filas = new Map<string, [CupomLomadee, ...CupomLomadee[]]>();
  for (const cupom of cupons.sort(compararCupons)) {
    const chaveMarca = cupom.marcaLogo ?? normalizarTexto(cupom.marca);
    const fila = filas.get(chaveMarca);
    if (fila) fila.push(cupom);
    else filas.set(chaveMarca, [cupom]);
  }

  const marcas = [...filas.values()].sort((a, b) => compararCupons(a[0], b[0]));
  const resultado: CupomLomadee[] = [];
  for (let rodada = 0; rodada < MAX_POR_LOJA; rodada++) {
    for (const fila of marcas) {
      const cupom = fila[rodada];
      if (cupom) resultado.push(cupom);
      if (resultado.length >= MAX_CACHED_RESULTS) return resultado;
    }
  }
  return resultado;
}

async function coletarCuponsLomadee(): Promise<CupomLomadee[]> {
  const key = process.env.LOMADEE_API_KEY?.trim();
  if (!key) throw new Error("LOMADEE_API_KEY ausente no runtime");

  // Campanhas carregam o tracking e sao o dado indispensavel. Marcas servem
  // apenas para enriquecer nome/logo; uma indisponibilidade nesse endpoint nao
  // pode apagar ofertas validas da pagina.
  const campanhas = await buscarColecao<CampanhaApi>(
    "/affiliate/campaigns",
    key,
    MAX_CAMPAIGN_PAGES,
    { status: "onTime" },
  );
  let marcasApi: MarcaApi[] = [];
  try {
    marcasApi = await buscarColecao<MarcaApi>(
      "/affiliate/brands",
      key,
      MAX_BRAND_PAGES,
    );
  } catch {
    // Mantem campanhas monetizadas com identificacao generica da rede.
  }

  const marcas = new Map<string, string>();
  for (const marca of marcasApi) {
    const id = marca.id == null ? "" : String(marca.id);
    const nome = marca.name?.trim();
    if (id && nome) marcas.set(id, nome);
  }

  const agora = Date.now();
  const vistos = new Set<string>();
  const linksVistos = new Set<string>();
  const cupons: CupomLomadee[] = [];

  for (const campanha of campanhas) {
    if (campanha.status && campanha.status !== "onTime") continue;

    const id = campanha.id == null ? "" : String(campanha.id);
    const organizacao = campanha.organizationId?.trim() ?? "";
    const titulo = campanha.name?.trim().replace(/\s+/g, " ").slice(0, 240) ?? "";
    const link = linkValido(campanha);
    if (!id || !titulo || !link) continue;

    const inicio = campanha.period?.startAt ? Date.parse(campanha.period.startAt) : Number.NaN;
    const fim = campanha.period?.endAt ? Date.parse(campanha.period.endAt) : Number.NaN;
    if (Number.isFinite(inicio) && inicio > agora) continue;
    if (Number.isFinite(fim) && fim < agora) continue;

    const codigo = campanha.code?.trim().slice(0, 80) || null;
    const identidade = codigo
      ? `${organizacao}:codigo:${normalizarTexto(codigo)}`
      : `${organizacao}:titulo:${normalizarTexto(titulo)}`;
    if (vistos.has(id) || vistos.has(identidade) || linksVistos.has(link)) continue;

    vistos.add(id);
    vistos.add(identidade);
    linksVistos.add(link);
    cupons.push({
      id,
      marca: (organizacao && marcas.get(organizacao)) || "Parceiro Lomadee",
      marcaLogo: organizacao ? lomadeeLogoUrl(organizacao) : null,
      titulo,
      codigo,
      link,
      terminaEm: campanha.period?.endAt ?? null,
      destaque: Boolean(campanha.isHighlight),
    });
  }

  return balancearPorMarca(cupons);
}

const cuponsComCache = unstable_cache(
  coletarCuponsLomadee,
  ["lomadee-cupons-v6"],
  { revalidate: CACHE_SECONDS },
);

export async function listarCupons(max = 60): Promise<CupomLomadee[]> {
  if (!process.env.LOMADEE_API_KEY?.trim()) return [];

  const limite = Number.isFinite(max)
    ? Math.min(MAX_CACHED_RESULTS, Math.max(0, Math.trunc(max)))
    : 60;
  if (limite === 0) return [];

  const cupons = await cuponsComCache();
  return cupons.slice(0, limite);
}
