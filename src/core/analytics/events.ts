import { z } from "zod";

export const EVENT_TYPES = [
  "visita", "busca", "busca_sem_resultado", "abrir_busca", "selecionar_busca",
  "ver_produto", "abrir_comparacao", "ver_categoria", "filtrar_ofertas",
  "salvar_produto", "remover_salvo", "compartilhar_produto", "saida_loja", "copiar_cupom",
] as const;
export type EventType = typeof EVENT_TYPES[number];

/** Não guardar contatos, URLs, códigos de acesso ou frases longas da busca. */
export function safeSearchTerm(value: string): string | undefined {
  const term = value.trim().replace(/\s+/g, " ");
  if (!term || term.length > 80 || term.replace(/\D/g, "").length >= 9 || /@|https?:|www\.|\b(?:senha|password|token)\b/i.test(term)) return;
  return term;
}

const slug = z.string().max(60).regex(/^[a-z0-9][a-z0-9_/-]*$/).optional().nullable();
const ORIGINS = new Set(["produto", "card", "home", "radar", "atalho", "ofertas", "categoria", "comparar", "cupons", "loja", "link", "nativo", "copiar_link", "vitrine-rodizio", "ofertas-mercadolivre", "ofertas-verificadas"]);

/** Origem é um rótulo do produto, nunca uma URL externa ou texto livre. */
export function safeOrigin(value: string): string | undefined {
  if (ORIGINS.has(value) || value === "/produto/:id") return value;
  return publicPage(value) ?? undefined;
}

export const eventSchema = z.object({
  tipo: z.enum(EVENT_TYPES),
  termo: z.string().max(120).optional().transform((v) => v ? safeSearchTerm(v) : undefined),
  produtoId: z.string().uuid().optional(),
  lojaSlug: slug,
  categoriaSlug: slug,
  origem: z.string().max(80).optional().transform((value) => value ? safeOrigin(value) : undefined),
});
export type AnalyticsEvent = z.infer<typeof eventSchema>;
export type TrackPayload = Omit<AnalyticsEvent, "tipo">;
export const batchSchema = z.object({ consent: z.literal("accepted"), events: z.array(eventSchema).min(1).max(20) });

/** Next normaliza loopback na URL; Host conserva a autoridade HTTP recebida. */
export function sameRequestOrigin(request: Request): boolean {
  const host = request.headers.get("host");
  if (host && /[\\/@?#\s]/.test(host)) return false;
  try {
    const url = new URL(request.url);
    const expected = host ? new URL(`${url.protocol}//${host}`).origin : url.origin;
    return request.headers.get("origin") === expected;
  } catch { return false; }
}

export function isAutomatedRequest(ua: string, purpose = ""): boolean {
  return !ua || /bot|crawl|spider|preview|lighthouse|headless|monitor|curl|wget/i.test(ua)
    || /prefetch|prerender/i.test(purpose);
}

/** Agrupa a página sem armazenar parâmetros, termos, IDs ou rotas privadas. */
export function publicPage(path: string): string | null {
  if (/^\/produto\/[0-9a-f-]{36}$/i.test(path)) return "/produto/:id";
  if (/^\/categoria\/[a-z0-9-]+$/.test(path)) return path.slice(0, 60);
  return ["/", "/ofertas", "/comparar", "/cupons", "/noticias", "/sobre", "/contato"].includes(path) ? path : null;
}
