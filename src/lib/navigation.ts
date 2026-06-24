import {
  Gamepad2, Cpu, HardDrive, MemoryStick, Zap, CircuitBoard, Monitor, Laptop,
  Milk, Dumbbell, Flame, ShoppingBag,
  Refrigerator, CookingPot, WashingMachine, Tv, Microwave, AirVent,
  Drill, Wrench, Hammer, Wind, Cog, HardHat,
  Headphones, Watch, Speaker, BatteryCharging, Webcam,
  SprayCan, Gem, Palette, Droplet, Scissors, type LucideIcon,
} from "lucide-react";

/**
 * Fonte ÚNICA da navegação por verticais. Navbar (desktop), menu mobile e o
 * rail da home consomem isto — adicionar uma vertical (ex: Casa & Eletro) é
 * acrescentar um objeto aqui, e ela aparece em todos os lugares de uma vez.
 *
 * Cada vertical tem identidade de cor própria. As classes de accent são literais
 * (não interpoladas) para o JIT do Tailwind detectá-las.
 */
export interface CategoriaNav { slug: string; nome: string; Icon: LucideIcon }

export interface Accent {
  /** ponto/realce sólido */ dot: string;
  /** texto do trigger */ text: string;
  /** texto em hover */ textHover: string;
  /** gradiente do tile do ícone */ grad: string;
  /** sombra colorida do tile */ glow: string;
  /** borda do card em hover */ border: string;
}

export interface Vertical {
  slug: string;
  label: string;
  /** destino ao clicar no rótulo (a categoria carro-chefe da vertical) */
  href: string;
  accent: Accent;
  categorias: CategoriaNav[];
}

const ACCENT_TECH: Accent = {
  dot: "bg-brand",
  text: "text-zinc-200",
  textHover: "hover:text-white",
  grad: "from-brand to-cyan",
  glow: "shadow-[0_8px_24px_-8px_rgba(124,93,255,.55)] group-hover:shadow-[0_10px_30px_-6px_rgba(0,219,231,.6)]",
  border: "hover:border-brand/50",
};

const ACCENT_FIT: Accent = {
  dot: "bg-fit",
  text: "text-fit/90",
  textHover: "hover:text-fit",
  grad: "from-fit to-warn",
  glow: "shadow-[0_8px_24px_-8px_rgba(255,77,109,.55)] group-hover:shadow-[0_10px_30px_-6px_rgba(255,77,109,.6)]",
  border: "hover:border-fit/60",
};

const ACCENT_ELETRO: Accent = {
  dot: "bg-eletro",
  text: "text-eletro/90",
  textHover: "hover:text-eletro",
  grad: "from-eletro to-warn",
  glow: "shadow-[0_8px_24px_-8px_rgba(255,176,32,.5)] group-hover:shadow-[0_10px_30px_-6px_rgba(255,176,32,.55)]",
  border: "hover:border-eletro/60",
};

const ACCENT_TOOL: Accent = {
  dot: "bg-tool",
  text: "text-tool-2",
  textHover: "hover:text-tool-2",
  grad: "from-tool to-cyan",
  glow: "shadow-[0_8px_24px_-8px_rgba(37,99,235,.5)] group-hover:shadow-[0_10px_30px_-6px_rgba(37,99,235,.55)]",
  border: "hover:border-tool/60",
};

const ACCENT_GADGET: Accent = {
  dot: "bg-gadget",
  text: "text-gadget-2",
  textHover: "hover:text-gadget-2",
  grad: "from-gadget to-cyan",
  glow: "shadow-[0_8px_24px_-8px_rgba(20,184,166,.5)] group-hover:shadow-[0_10px_30px_-6px_rgba(20,184,166,.55)]",
  border: "hover:border-gadget/60",
};

const ACCENT_PARFUM: Accent = {
  dot: "bg-parfum",
  text: "text-parfum-2",
  textHover: "hover:text-parfum-2",
  grad: "from-parfum to-fit",
  glow: "shadow-[0_8px_24px_-8px_rgba(147,51,234,.5)] group-hover:shadow-[0_10px_30px_-6px_rgba(147,51,234,.55)]",
  border: "hover:border-parfum/60",
};

export const VERTICAIS: ReadonlyArray<Vertical> = [
  {
    slug: "tech",
    label: "Tech",
    href: "/ofertas",
    accent: ACCENT_TECH,
    categorias: [
      { slug: "placas-de-video", nome: "Placas de Vídeo", Icon: Gamepad2 },
      { slug: "processadores", nome: "Processadores", Icon: Cpu },
      { slug: "ssds", nome: "SSDs", Icon: HardDrive },
      { slug: "memorias-ram", nome: "Memórias RAM", Icon: MemoryStick },
      { slug: "fontes", nome: "Fontes", Icon: Zap },
      { slug: "placas-mae", nome: "Placas-Mãe", Icon: CircuitBoard },
      { slug: "monitores", nome: "Monitores", Icon: Monitor },
      { slug: "notebooks", nome: "Notebooks", Icon: Laptop },
    ],
  },
  {
    slug: "fit",
    label: "Mundo Fit",
    href: "/categoria/whey-protein",
    accent: ACCENT_FIT,
    categorias: [
      { slug: "whey-protein", nome: "Whey Protein", Icon: Milk },
      { slug: "creatina", nome: "Creatina", Icon: Dumbbell },
      { slug: "pre-treino", nome: "Pré-treino", Icon: Flame },
      { slug: "fit-outros", nome: "Outros", Icon: ShoppingBag },
    ],
  },
  {
    slug: "eletro",
    label: "Casa & Eletro",
    href: "/categoria/geladeiras",
    accent: ACCENT_ELETRO,
    categorias: [
      { slug: "geladeiras", nome: "Geladeiras", Icon: Refrigerator },
      { slug: "fogoes", nome: "Fogões", Icon: CookingPot },
      { slug: "maquinas-lavar", nome: "Máq. de Lavar", Icon: WashingMachine },
      { slug: "tvs", nome: "TVs", Icon: Tv },
      { slug: "micro-ondas", nome: "Micro-ondas", Icon: Microwave },
      { slug: "ar-condicionado", nome: "Ar-condicionado", Icon: AirVent },
    ],
  },
  {
    slug: "ferramentas",
    label: "Ferramentas",
    href: "/categoria/furadeiras",
    accent: ACCENT_TOOL,
    categorias: [
      { slug: "furadeiras", nome: "Furadeiras", Icon: Drill },
      { slug: "serras", nome: "Serras", Icon: Hammer },
      { slug: "lixadeiras", nome: "Lixadeiras", Icon: Wind },
      { slug: "compressores", nome: "Compressores", Icon: AirVent },
      { slug: "chaves-soquetes", nome: "Chaves & Soquetes", Icon: Cog },
      { slug: "ferramentas-manuais", nome: "Manuais", Icon: Wrench },
      { slug: "epi", nome: "EPIs", Icon: HardHat },
    ],
  },
  {
    slug: "gadgets",
    label: "Gadgets",
    href: "/categoria/fones-bluetooth",
    accent: ACCENT_GADGET,
    categorias: [
      { slug: "fones-bluetooth", nome: "Fones Bluetooth", Icon: Headphones },
      { slug: "smartwatch", nome: "Smartwatch", Icon: Watch },
      { slug: "caixa-de-som", nome: "Caixas de Som", Icon: Speaker },
      { slug: "power-bank", nome: "Power Banks", Icon: BatteryCharging },
      { slug: "webcam-acao", nome: "Webcam & Ação", Icon: Webcam },
    ],
  },
  {
    slug: "perfumes",
    label: "Beleza",
    href: "/categoria/perfumes-importados",
    accent: ACCENT_PARFUM,
    categorias: [
      { slug: "perfumes-importados", nome: "Perfumes Importados", Icon: SprayCan },
      { slug: "perfumes-arabes", nome: "Perfumes Árabes", Icon: Gem },
      { slug: "maquiagem", nome: "Maquiagem", Icon: Palette },
      { slug: "skincare", nome: "Skincare", Icon: Droplet },
      { slug: "cabelos", nome: "Cabelos", Icon: Scissors },
    ],
  },
];

/** Todas as categorias achatadas (para o rail da home, filtros, busca, etc.). */
export const TODAS_CATEGORIAS: ReadonlyArray<CategoriaNav & { accent: Accent; vertical: string }> =
  VERTICAIS.flatMap((v) => v.categorias.map((c) => ({ ...c, accent: v.accent, vertical: v.slug })));

/** A vertical à qual uma categoria pertence (para a sub-navegação contextual). */
export function verticalDaCategoria(slug: string | null | undefined): Vertical | undefined {
  if (!slug) return undefined;
  return VERTICAIS.find((v) => v.categorias.some((c) => c.slug === slug));
}

/** Nome de exibição de uma categoria (fallback: slug com hífens → espaços). */
export function nomeCategoria(slug: string): string {
  return TODAS_CATEGORIAS.find((c) => c.slug === slug)?.nome ?? slug.replace(/-/g, " ");
}
