export type TemaSazonalId =
  | "patria-cliente"
  | "primavera-criancas"
  | "primavera"
  | "esquenta-black"
  | "black-friday"
  | "cyber-monday"
  | "esquenta-natal"
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
  frase: "Compare os preços coletados e consulte o histórico antes de escolher.",
  grad: "from-ink to-brand",
  corHex: "#183e30",
  corApoioHex: "#f3dd59",
  cta: { href: "/ofertas", label: "Ver ofertas" },
};

const ESQUENTA_BLACK: TemaSazonal = {
  ...BLACK_FRIDAY,
  id: "esquenta-black",
  selo: "Esquenta Black Friday",
  corApoioHex: "#d9efb9",
  frase: "O esquenta já começou.",
  cta: { href: "/ofertas", label: "Explorar o esquenta" },
};

const CYBER_MONDAY: TemaSazonal = {
  ...BLACK_FRIDAY,
  id: "cyber-monday",
  selo: "Cyber Monday",
  corHex: "#264a82",
  corApoioHex: "#c6ddff",
  frase: "Tecnologia, gadgets e outras descobertas: compare antes de comprar.",
  cta: { href: "/ofertas", label: "Explorar a Cyber Monday" },
};

const NATAL: TemaSazonal = {
  id: "natal",
  visual: "natal",
  selo: "Natal",
  frase: "Presente bom, preço acompanhado e compra no momento certo.",
  grad: "from-ink to-brand",
  corHex: "#8d252c",
  corApoioHex: "#f3dca4",
  cta: { href: "/ofertas", label: "Ver presentes" },
};

const ESQUENTA_NATAL: TemaSazonal = {
  ...NATAL,
  id: "esquenta-natal",
  selo: "Esquenta Natal",
  corHex: "#1b5b41",
  corApoioHex: "#f1dea9",
  frase: "Comece sua lista de presentes e confira os preços com antecedência.",
  cta: { href: "/ofertas", label: "Encontrar presentes" },
};

/** Janelas inclusivas em America/Sao_Paulo; fora delas, a campanha é neutra. */
export const CALENDARIO_SAZONAL_2026 = [
  { inicio: 20260820, fim: 20260919, tema: CAMPANHA_CLIENTE },
  { inicio: 20260920, fim: 20261012, tema: CAMPANHA_PRIMAVERA_CRIANCAS },
  { inicio: 20261013, fim: 20261029, tema: CAMPANHA_PRIMAVERA },
  { inicio: 20261030, fim: 20261126, tema: ESQUENTA_BLACK },
  { inicio: 20261127, fim: 20261129, tema: BLACK_FRIDAY },
  { inicio: 20261130, fim: 20261130, tema: CYBER_MONDAY },
  { inicio: 20261201, fim: 20261213, tema: ESQUENTA_NATAL },
  { inicio: 20261214, fim: 20261225, tema: NATAL },
] as const;

const TEMAS_FORCADOS: Partial<Record<string, TemaSazonal>> = {
  "patria-cliente": CAMPANHA_CLIENTE,
  "primavera-criancas": CAMPANHA_PRIMAVERA_CRIANCAS,
  primavera: CAMPANHA_PRIMAVERA,
  "esquenta-black": ESQUENTA_BLACK,
  "black-friday": BLACK_FRIDAY,
  "cyber-monday": CYBER_MONDAY,
  "esquenta-natal": ESQUENTA_NATAL,
  natal: NATAL,
};

const DATA_BRASIL = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
});

function dataNoBrasil(data: Date) {
  const partes = DATA_BRASIL.formatToParts(data);
  const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
    Number(partes.find((parte) => parte.type === tipo)?.value ?? 0);

  const ano = valor("year");
  const mes = valor("month");
  const dia = valor("day");
  return { ano, mes, dia, chave: ano * 10_000 + mes * 100 + dia };
}

/**
 * Fonte única do calendário promocional aprovado para 2026.
 * O fuso é explícito, inclusive no Worker; 2027 exige calendário próprio.
 */
export function temaSazonal(hoje: Date = new Date()): TemaSazonal | null {
  const forca = process.env.NEXT_PUBLIC_TEMA_FORCE;
  if (forca && TEMAS_FORCADOS[forca]) return TEMAS_FORCADOS[forca] ?? null;

  const { chave } = dataNoBrasil(hoje);
  return CALENDARIO_SAZONAL_2026.find(
    janela => chave >= janela.inicio && chave <= janela.fim,
  )?.tema ?? null;
}

/** Apenas IDs/datas públicos: atualiza a pele antes da pintura mesmo com HTML em cache. */
export function scriptTemaSazonal(): string {
  const janelas = CALENDARIO_SAZONAL_2026.map(({ inicio, fim, tema }) => [inicio, fim, tema.id]);
  const forca = process.env.NEXT_PUBLIC_TEMA_FORCE;
  const idForcado = forca ? TEMAS_FORCADOS[forca]?.id ?? null : null;
  return `(function(){try{var p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()),n=function(t){return Number(p.find(function(v){return v.type===t}).value)},d=n('year')*10000+n('month')*100+n('day'),w=${JSON.stringify(janelas)},id=${JSON.stringify(idForcado)};if(!id){var a=w.find(function(v){return d>=v[0]&&d<=v[1]});id=a?a[2]:'neutro'}document.documentElement.dataset.campaign=id}catch(e){}})();`;
}
