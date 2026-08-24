export type TemaSazonalId =
  | "patria-cliente"
  | "primavera-criancas"
  | "primavera"
  | "black-friday"
  | "natal";

export type TemaVisual = "cliente" | "primavera" | "black-friday" | "natal";

export interface TemaSazonalHero {
  imagemDesktop: string;
  imagemMobile: string;
  titulo: string;
  destaque: string;
  descricao: string;
  ctaPrimario: string;
  ctaSecundario: string;
}

export interface TemaSazonal {
  id: TemaSazonalId;
  visual: TemaVisual;
  selo: string;
  frase: string;
  /** Classes literais para o Tailwind incluir no build. */
  grad: string;
  corHex: string;
  corApoioHex: string;
  cta: { href: string; label: string };
  hero?: TemaSazonalHero;
}

const CAMPANHA_CLIENTE: TemaSazonal = {
  id: "patria-cliente",
  visual: "cliente",
  selo: "Semana do Cliente",
  frase: "Independência para escolher: preço bom, comparado e verificado.",
  grad: "from-[#008c4a] via-[#f4cc39] to-[#1f6fe5]",
  corHex: "#31d07f",
  corApoioHex: "#f4cc39",
  cta: { href: "/ofertas", label: "Ver ofertas para clientes" },
  hero: {
    imagemDesktop: "/campaign-client-desktop.jpg",
    imagemMobile: "/campaign-client-mobile.jpg",
    titulo: "Independência para escolher.",
    destaque: "Preço bom de verdade.",
    descricao:
      "Na Semana do Cliente, compare histórico, PromoScore e lojas antes de comprar. De tecnologia a beleza, a melhor oferta é a que resiste aos dados.",
    ctaPrimario: "Ver ofertas para clientes",
    ctaSecundario: "Comparar antes de comprar",
  },
};

const CAMPANHA_PRIMAVERA_CRIANCAS: TemaSazonal = {
  id: "primavera-criancas",
  visual: "primavera",
  selo: "Primavera & Crianças",
  frase: "Presentes, tecnologia e descobertas com preço acompanhado.",
  grad: "from-[#35c98a] via-[#f5c443] to-[#ef6b58]",
  corHex: "#56d6a1",
  corApoioHex: "#f5c443",
  cta: { href: "/ofertas", label: "Descobrir presentes" },
  hero: {
    imagemDesktop: "/campaign-spring-kids-desktop.jpg",
    imagemMobile: "/campaign-spring-kids-mobile.jpg",
    titulo: "Primavera de descobertas.",
    destaque: "Presentes sem susto no preço.",
    descricao:
      "Brinquedos, games, tecnologia e achados para toda a família, selecionados com histórico real e PromoScore para o Dia das Crianças.",
    ctaPrimario: "Descobrir presentes",
    ctaSecundario: "Comparar opções",
  },
};

const CAMPANHA_PRIMAVERA: TemaSazonal = {
  ...CAMPANHA_PRIMAVERA_CRIANCAS,
  id: "primavera",
  selo: "Primavera",
  frase: "A estação mudou. O jeito inteligente de comparar, não.",
  cta: { href: "/ofertas", label: "Ver achados da primavera" },
  hero: {
    ...CAMPANHA_PRIMAVERA_CRIANCAS.hero!,
    titulo: "A estação mudou.",
    destaque: "Seu jeito de comparar, não.",
    descricao:
      "Renove casa, beleza, tecnologia e rotina com ofertas acompanhadas por histórico real. Cor na vitrine, clareza na decisão.",
    ctaPrimario: "Ver achados da primavera",
    ctaSecundario: "Comparar preços",
  },
};

const BLACK_FRIDAY: TemaSazonal = {
  id: "black-friday",
  visual: "black-friday",
  selo: "Black Friday",
  frase: "Black Friday de verdade: desconto falso não passa pelo radar.",
  grad: "from-zinc-700 via-brand to-cyan",
  corHex: "#a78bfa",
  corApoioHex: "#22d3ee",
  cta: { href: "/ofertas", label: "Ver ofertas" },
};

const NATAL: TemaSazonal = {
  id: "natal",
  visual: "natal",
  selo: "Natal",
  frase: "Presente bom, preço acompanhado e compra no momento certo.",
  grad: "from-rose-500 via-amber-300 to-emerald-500",
  corHex: "#fb7185",
  corApoioHex: "#fbbf24",
  cta: { href: "/ofertas", label: "Ver presentes" },
};

const TEMAS_FORCADOS: Partial<Record<string, TemaSazonal>> = {
  "patria-cliente": CAMPANHA_CLIENTE,
  "primavera-criancas": CAMPANHA_PRIMAVERA_CRIANCAS,
  primavera: CAMPANHA_PRIMAVERA,
  "black-friday": BLACK_FRIDAY,
  natal: NATAL,
};

function dataNoBrasil(data: Date) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(data);
  const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
    Number(partes.find((parte) => parte.type === tipo)?.value ?? 0);

  const ano = valor("year");
  const mes = valor("month");
  const dia = valor("day");
  return { ano, mes, dia, chave: ano * 10_000 + mes * 100 + dia };
}

/**
 * Fonte única do calendário promocional. As campanhas de setembro/outubro de
 * 2026 já ficam agendadas; o fuso explícito mantém SSR e navegador alinhados.
 */
export function temaSazonal(hoje: Date = new Date()): TemaSazonal | null {
  const forca = process.env.NEXT_PUBLIC_TEMA_FORCE;
  if (forca && TEMAS_FORCADOS[forca]) return TEMAS_FORCADOS[forca] ?? null;

  const { ano, mes, dia, chave } = dataNoBrasil(hoje);
  const entre = (inicio: number, fim: number) => chave >= inicio && chave <= fim;

  if (ano === 2026 && entre(20260820, 20260919)) return CAMPANHA_CLIENTE;
  if (ano === 2026 && entre(20260920, 20261012)) return CAMPANHA_PRIMAVERA_CRIANCAS;
  if (ano === 2026 && entre(20261013, 20261031)) return CAMPANHA_PRIMAVERA;

  if (mes === 11 && dia >= 20) return BLACK_FRIDAY;
  if (mes === 12) return NATAL;

  return null;
}
