import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBRL(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatPct(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${n}%`;
}

/** Cor "signal accent" de cada loja (DESIGN.md › Retail Integration). */
const CORES_LOJA: Record<string, string> = {
  kabum: "#FF6500",
  terabyte: "#00D35E",
  terabyteshop: "#00D35E",
  pichau: "#E3000F",
  mercadolivre: "#FFE600",
  "mercado livre": "#FFE600",
  amazon: "#FF9900",
  shopee: "#EE4D2D",      // laranja-coral oficial da Shopee (NÃO é roxo)
  aliexpress: "#E62E04",  // vermelho-laranja AliExpress (loja do feed Awin)
  awin: "#E62E04",
  // Mundo Fit — cada marca com sua identidade (verde Growth, dourado Soldiers,
  // e três vermelhos distintos: Max tijolo, Integral puro, Dark Lab vivo).
  // Suplemento não cruza gráfico com hardware (assinaturas de classe distintas).
  growth: "#43B02A",
  "growth supplements": "#43B02A",
  soldiers: "#C9B037",
  "soldiers nutrition": "#C9B037",
  maxtitanium: "#C22014",
  "max titanium": "#C22014",
  integralmedica: "#E30613",
  "integral medica": "#E30613",
  darklab: "#ED1C24",
  "dark lab": "#ED1C24",
  // Casa & Eletro
  havan: "#0048A3", // azul Havan
  americanas: "#E60014", // vermelho Americanas
  // Ferramentas
  ferramentasgerais: "#F25C05", // laranja Ferramentas Gerais
  "ferramentas gerais": "#F25C05",
  lojadomecanico: "#F7901E", // laranja Loja do Mecânico
  "loja do mecanico": "#F7901E",
  // Perfumes
  epocacosmeticos: "#7B2D8E", // roxo Época
  "epoca cosmeticos": "#7B2D8E",
  // Moda
  diesel: "#D52B5E", // rosa-vermelho Diesel (logo branca sobre fundo rosa)
};

export function corLoja(lojaSlugOuNome: string | null | undefined): string {
  if (!lojaSlugOuNome) return "#7C5DFF"; // fallback: mauve da marca
  const k = lojaSlugOuNome.toLowerCase().replace(/[^a-z ]/g, "");
  return CORES_LOJA[k] ?? "#7C5DFF";
}

/** Entidades nomeadas comuns em feeds RSS (as numéricas &#NNN;/&#xHH; são genéricas). */
const ENTIDADES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  ndash: "–", mdash: "—", hellip: "…",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
  laquo: "«", raquo: "»", copy: "©", reg: "®",
  trade: "™", deg: "°", middot: "·", bull: "•", times: "×",
};

/**
 * Decodifica entidades HTML nomeadas e numéricas (&amp;, &#124;, &#x2013;…).
 * Duas passadas resolvem a dupla codificação comum em RSS (&amp;#124; → &#124; → |).
 * Em texto já limpo é no-op — seguro para sanear na renderização os registros
 * antigos de `noticias` salvos com entidades cruas, sem migração de banco.
 */
export function decodeHtmlEntities(s: string | null | undefined): string {
  if (!s) return "";
  let out = s;
  for (let i = 0; i < 2 && /&(?:#x?[0-9a-f]+|[a-z]+);/i.test(out); i++) {
    out = out.replace(/&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi, (m, dec, hex, nome) => {
      if (dec || hex) {
        const n = dec ? parseInt(dec, 10) : parseInt(hex, 16);
        return n >= 32 && n <= 0x10ffff ? String.fromCodePoint(n) : m;
      }
      return ENTIDADES[(nome as string).toLowerCase()] ?? m;
    });
  }
  return out;
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}
