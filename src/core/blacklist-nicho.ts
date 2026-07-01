/**
 * BLACKLIST DE NICHO — módulo isolado do motor de ingestão (Núcleo Central +
 * Módulos). Filtra produto B2B/infraestrutura que não tem nada a ver com o
 * público B2C do PromoDetec (ex: feeds da Shopee/AliExpress trazem "Fiber
 * Optic", "OLT", "ONU" — equipamento de operadora de telecom).
 *
 * PARA ADICIONAR UMA PALAVRA NOVA: só acrescente uma string no array abaixo,
 * em minúsculo e sem acento. Não precisa entender o resto do motor.
 *
 * Usado tanto pelo app Next.js (import "@/core/blacklist-nicho") quanto pelos
 * scripts standalone de ingestão (import relativo — scripts/ não usa alias @/,
 * de propósito, pra rodar isolado do build do Next).
 */
export const TERMOS_PROIBIDOS: readonly string[] = [
  // Infraestrutura de fibra óptica / operadora (carrier-grade, não é produto de consumidor).
  "fiber optic", "fibra optica", "fiber cleaver",
  "om3 sc to sc", "sc to sc", "sc/upc", "sc/apc",
  "4pon epon olt", "epon olt", "epon", "olt", "onu", "ftth", "gpon",
  "carrier-grade", "carrier grade", "pon splitter", "patch panel",
];

function normalizar(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function escaparRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

/**
 * Regexes pré-compiladas (1x no load), casando cada termo como PALAVRA INTEIRA —
 * cercado por início/fim ou caractere não-alfanumérico. Word-boundary é ESSENCIAL:
 * sem ele, "olt" casaria com biv·OLT, v·OLT·s, v·OLT·a e apagaria fonte/carregador/
 * ventilador B2C legítimo (falso-positivo silencioso). Pré-compilar evita reconstruir
 * ~20 regexes por linha no loop de 100k do feed.
 */
const REGEX_PROIBIDOS: readonly RegExp[] = TERMOS_PROIBIDOS.map(
  (termo) => new RegExp(`(^|[^a-z0-9])${escaparRegex(normalizar(termo))}([^a-z0-9]|$)`),
);

/** true se o texto (título, categoria etc.) contém algum termo da blacklist. */
export function contemTermoProibido(texto: string | null | undefined): boolean {
  if (!texto) return false;
  const alvo = normalizar(texto);
  return REGEX_PROIBIDOS.some((re) => re.test(alvo));
}
