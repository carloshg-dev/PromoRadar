/**
 * Matching de produtos entre lojas (domínio puro, sem I/O).
 *
 * Cada loja descreve o mesmo hardware com títulos diferentes (e o Mercado Livre
 * usa nomes de catálogo). Casar por SKU exato é inviável. Em vez disso extraímos
 * uma ASSINATURA por CLASSE DE MODELO a partir do título — o que importa para um
 * radar de preço: "qual loja tem o RTX 4060 8GB mais barato?".
 *
 * A assinatura é category|chipset/modelo|capacidade (sem marca, de propósito: o
 * objetivo é comparar a mesma classe de produto entre lojas/AIBs). A marca segue
 * disponível por oferta, para exibição.
 */

import type { CategoriaSlug } from "@/core/domain/types";

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Suplementos: hardware casa por modelo, suplemento casa por MARCA + tipo +
 * peso. Sem marca não há comparação confiável (whey de marcas diferentes não
 * é "o mesmo produto" — preço diferente é esperado, não oportunidade).
 */
const MARCAS_FIT = [
  "growth", "soldiers", "max titanium", "integralmedica", "dark lab",
  "black skull", "probiotica", "dux", "atlhetica", "ftw", "new millen",
];

function marcaFit(n: string, marcaHint?: string | null): string | null {
  const alvo = `${(marcaHint ?? "").toLowerCase()} ${n}`;
  for (const m of MARCAS_FIT) if (alvo.includes(m)) return m.replace(/\s/g, "");
  return null;
}

/** Peso normalizado em gramas ("1kg" e "1000g" são o mesmo produto). */
function pesoG(n: string): string | null {
  const kg = n.match(/\b(\d+(?:[.,]\d+)?)\s?kg\b/);
  if (kg?.[1]) return `${Math.round(parseFloat(kg[1].replace(",", ".")) * 1000)}g`;
  const g = n.match(/\b(\d{2,4})\s?(?:gr?|gramas)\b/);
  if (g?.[1]) return `${g[1]}g`;
  return null;
}

/**
 * Eletro e ferramentas casam por MARCA + a spec dominante (litros/polegadas/
 * volts…). Sem marca + spec não há comparação confiável: "geladeira" sozinho
 * não é o mesmo produto entre lojas, mas "Brastemp 375L" é.
 */
const MARCAS_ELETRO = [
  "brastemp", "electrolux", "consul", "lg", "samsung", "philco", "midea", "panasonic",
  "mondial", "britania", "britânia", "gree", "springer", "elgin", "tcl", "aoc", "philips",
  "semp", "toshiba", "esmaltec", "atlas", "continental", "fischer", "dako", "itatiaia", "hisense",
];
const MARCAS_FERRAMENTA = [
  "bosch", "makita", "dewalt", "vonder", "tramontina", "black+decker", "black decker", "stanley",
  "mondial", "wesco", "gamma", "skil", "einhell", "worx", "irwin", "starrett", "wurth", "würth",
  "milwaukee", "metabo", "hammer", "schulz", "motomil", "tekna", "force", "lynus", "nagano",
  "gedore", "fortgpro", "mtx", "beta", "steelflex", "kalipso", "carbografite", "marluvas", "danny", "caterpillar",
];
const MARCAS_GADGET = [
  "jbl", "xiaomi", "redmi", "samsung", "logitech", "apple", "sony", "anker", "motorola", "realme",
  "edifier", "philips", "multilaser", "intelbras", "baseus", "amazfit", "gopro", "insta360",
  "geonav", "i2go", "positivo", "qcy", "soul", "havit", "kaidi", "jiga",
];
const MARCAS_PERFUME = [
  "lattafa", "armaf", "al haramain", "maison alhambra", "rasasi", "swiss arabian", "afnan",
  "orientica", "ard al zaafaran", "al wataniah", "dior", "paco rabanne", "carolina herrera",
  "versace", "jean paul gaultier", "azzaro", "lacoste", "hugo boss", "calvin klein", "montblanc",
  "antonio banderas", "giorgio armani", "ferrari", "natura", "o boticario",
];

function marcaDe(lista: string[], n: string, marcaHint?: string | null): string | null {
  const alvo = `${(marcaHint ?? "").toLowerCase()} ${n}`;
  for (const m of lista) if (alvo.includes(m)) return m.replace(/[\s+]/g, "");
  return null;
}

/**
 * Código de modelo do fabricante (ex: CFS5NAB, CD075BE, OTOP100, FG4134IX) — o
 * identificador ÚNICO do produto. Quando presente, é a chave de comparação mais
 * confiável: só casa produtos REALMENTE iguais (evita comparar um cooktop com um
 * fogão de piso só porque ambos são "Consul 5 bocas"). Exige 2+ letras seguidas
 * de dígitos (specs como "480l"/"5bocas"/"50pol" começam com dígito e são ignoradas).
 */
function modeloCode(n: string): string | null {
  const m = n.match(/\b([a-z]{2,6}\d{2,5}[a-z]{0,4})\b/);
  return m?.[1] ?? null;
}

/** Subtipo de eletro que distingue produtos NÃO comparáveis (cooktop ≠ fogão de piso). */
function tipoEletro(n: string, cat: CategoriaSlug): string | null {
  switch (cat) {
    case "fogoes":
      if (/\bcooktop\b/.test(n)) return "cooktop";
      if (/embutir/.test(n)) return "embutir";
      return "piso";
    case "maquinas-lavar":
      if (/lava\s?e?\s?seca|lava-seca/.test(n)) return "lavaeseca";
      if (/tanquinho|semiautom/.test(n)) return "tanquinho";
      if (/secadora/.test(n)) return "secadora";
      return "lavadora";
    case "geladeiras":
      if (/frigobar/.test(n)) return "frigobar";
      if (/side by side|french door/.test(n)) return "side";
      if (/duplex|inverse|2 portas|bottom/.test(n)) return "duplex";
      return null;
    case "ar-condicionado":
      if (/portatil|port[áa]til/.test(n)) return "portatil";
      if (/janela/.test(n)) return "janela";
      return "split";
    default:
      return null;
  }
}

/** Tokens que identificam a classe de modelo, por categoria. */
function tokensModelo(n: string, cat: CategoriaSlug, marcaHint?: string | null): string[] {
  const out = new Set<string>();
  const addCap = () => {
    const cap = n.match(/\b(\d{1,4})\s?(gb|tb)\b/g);
    if (cap) cap.forEach((c) => out.add(c.replace(/\s/g, "")));
  };

  switch (cat) {
    case "placas-de-video": {
      const m = n.match(/\b(rtx|gtx|rx|arc)\s?(\d{3,4})\s?(ti\s?super|ti|xtx|xt|super|s)?\b/g);
      if (m) m.forEach((x) => out.add(x.replace(/\s/g, "")));
      addCap();
      break;
    }
    case "processadores": {
      const ryzen = n.match(/\b(ryzen|threadripper|athlon)\s?(\d)?\s?(\d{3,5}\s?(x3d|xt|x|g|f|ge)?)\b/g);
      if (ryzen) ryzen.forEach((x) => out.add(x.replace(/\s/g, "")));
      const intel = n.match(/\b(i[3579]|ultra\s?[3579])\s?[- ]?(\d{4,5}\s?(kf|k|f|t)?)\b/g);
      if (intel) intel.forEach((x) => out.add(x.replace(/[\s-]/g, "")));
      break;
    }
    case "placas-mae": {
      const m = n.match(/\b([abxz]\d{3}[a-z]?(m| ?plus| ?wifi)?)\b/g); // b550, x670e, z790, a620m
      if (m) m.forEach((x) => out.add(x.replace(/\s/g, "")));
      break;
    }
    case "memorias-ram": {
      const ddr = n.match(/\bddr\d\b/g);
      if (ddr) ddr.forEach((x) => out.add(x));
      addCap();
      const mhz = n.match(/\b(\d{4,5})\s?mhz\b/);
      if (mhz) out.add(`${mhz[1]}mhz`);
      break;
    }
    case "ssds": {
      if (/\bnvme\b/.test(n)) out.add("nvme");
      else if (/\bsata\b/.test(n)) out.add("sata");
      if (/\bm\.?2\b/.test(n)) out.add("m2");
      addCap();
      break;
    }
    case "fontes": {
      const w = n.match(/\b(\d{3,4})\s?w\b/);
      if (w) out.add(`${w[1]}w`);
      const cert = n.match(/\b80\s?plus\s?(bronze|silver|gold|platinum|white)?\b/);
      if (cert) out.add((cert[1] ?? "80plus").replace(/\s/g, ""));
      break;
    }
    case "monitores": {
      const pol = n.match(/\b(\d{2})\s?(pol|polegadas|")\b/);
      if (pol) out.add(`${pol[1]}pol`);
      const hz = n.match(/\b(\d{2,3})\s?hz\b/);
      if (hz) out.add(`${hz[1]}hz`);
      const res = n.match(/\b(fhd|qhd|uhd|4k|2k|1080p|1440p)\b/);
      if (res?.[1]) out.add(res[1]);
      break;
    }
    case "notebooks": {
      const cpu = n.match(/\b(ryzen|i[3579]|ultra)\s?\d?\s?\d{3,5}\w{0,3}\b/)?.[0];
      if (cpu) out.add(cpu.replace(/\s/g, ""));
      const gpu = n.match(/\b(rtx|gtx)\s?(\d{3,4})\b/)?.[0];
      if (gpu) out.add(gpu.replace(/\s/g, ""));
      addCap();
      break;
    }
    case "whey-protein": {
      const marca = marcaFit(n, marcaHint);
      const peso = pesoG(n);
      if (!marca || !peso) break; // sem marca+peso não compara
      out.add(marca);
      out.add(peso);
      const tipo = n.match(/\b(concentrad|isolad|hidrolisad|3w|blend)/)?.[1];
      if (tipo) out.add(tipo);
      break;
    }
    case "creatina": {
      const marca = marcaFit(n, marcaHint);
      const peso = pesoG(n);
      if (!marca || !peso) break;
      out.add(marca);
      out.add(peso);
      if (/\bcreapure\b/.test(n)) out.add("creapure");
      break;
    }
    case "pre-treino": {
      const marca = marcaFit(n, marcaHint);
      const peso = pesoG(n);
      if (!marca || !peso) break;
      out.add(marca);
      out.add(peso);
      break;
    }
    // Casa & Eletro — CHAVE = marca + código do modelo (preciso). Sem código,
    // cai p/ marca + spec + tipo (mais fraco), e o `tipo` impede casar produtos
    // de classes diferentes (ex: cooktop × fogão de piso). Sem marca, não compara.
    case "geladeiras": case "micro-ondas": case "tvs": case "fogoes":
    case "maquinas-lavar": case "ar-condicionado": {
      const marca = marcaDe(MARCAS_ELETRO, n, marcaHint);
      if (!marca) break;
      const code = modeloCode(n);
      const tipo = tipoEletro(n, cat);
      // spec dominante por categoria (fallback quando não há código de modelo)
      let spec: string | null = null;
      if (cat === "geladeiras" || cat === "micro-ondas") spec = n.match(/\b(\d{2,4})\s?(?:l|litros)\b/)?.[1]?.concat("l") ?? null;
      else if (cat === "tvs") { const p = n.match(/\b(\d{2,3})\s?(?:pol|polegadas)/)?.[1] ?? n.match(/\b(2[4-9]|[3-9]\d)\b/)?.[1]; spec = p ? `${p}pol` : null; }
      else if (cat === "fogoes") spec = n.match(/\b(\d)\s?bocas?\b/)?.[1]?.concat("bocas") ?? null;
      else if (cat === "maquinas-lavar") spec = n.match(/\b(\d{1,2})\s?kg\b/)?.[1]?.concat("kg") ?? null;
      else if (cat === "ar-condicionado") spec = n.match(/\b(\d{4,6})\s?btus?\b/)?.[1]?.concat("btus") ?? null;

      // Comparação por CLASSE: marca + spec + tipo. O `tipo` é o que conserta o
      // bug reportado — cooktop nunca casa com fogão de piso, lavadora nunca com
      // lava-e-seca. (O código de modelo, quando as lojas o repetem igual, ainda
      // refina via fallback abaixo.) Sem marca+spec, não compara.
      if (spec) { out.add(marca); out.add(spec); if (tipo) out.add(tipo); }
      else if (code) { out.add(marca); out.add(code); if (tipo) out.add(tipo); }
      break;
    }
    // Ferramentas — marca + potência (volts/watts) ou medida
    case "furadeiras": case "lixadeiras": {
      const marca = marcaDe(MARCAS_FERRAMENTA, n, marcaHint);
      const v = n.match(/\b(\d{1,2})\s?v\b/);
      const w = n.match(/\b(\d{3,4})\s?w\b/);
      if (marca && (v || w)) { out.add(marca); if (v?.[1]) out.add(`${v[1]}v`); if (w?.[1]) out.add(`${w[1]}w`); }
      break;
    }
    case "serras": {
      const marca = marcaDe(MARCAS_FERRAMENTA, n, marcaHint);
      const w = n.match(/\b(\d{3,4})\s?w\b/);
      const tipo = n.match(/\b(circular|tico-tico|tico tico|m[aá]rmore|esquadria|sabre)\b/)?.[1];
      if (marca && (w || tipo)) { out.add(marca); if (w?.[1]) out.add(`${w[1]}w`); if (tipo) out.add(tipo.replace(/[\s-]/g, "")); }
      break;
    }
    case "compressores": {
      const marca = marcaDe(MARCAS_FERRAMENTA, n, marcaHint);
      const litros = n.match(/\b(\d{1,3})\s?(?:l|litros)\b/);
      if (marca && litros?.[1]) { out.add(marca); out.add(`${litros[1]}l`); }
      break;
    }
    case "chaves-soquetes": {
      const marca = marcaDe(MARCAS_FERRAMENTA, n, marcaHint);
      const enc = n.match(/\b(1\/2|1\/4|3\/8)\b/)?.[1];            // encaixe do soquete
      const pc = n.match(/\b(\d{1,3})\s?(?:pe[çc]as?|pcs)\b/)?.[1]; // nº de peças do jogo
      const mm = n.match(/\b(\d{1,2})\s?mm\b/)?.[1];               // chave avulsa
      if (marca && (enc || pc || mm)) {
        out.add(marca);
        if (enc) out.add(enc.replace("/", "-"));
        if (pc) out.add(`${pc}pc`);
        if (mm) out.add(`${mm}mm`);
      }
      break;
    }
    // ferramentas-manuais e epi: heterogêneos demais p/ casar com segurança — vitrine, fora do comparador
    // Gadgets — marca + modelo (palavra-chave + número) ou capacidade (mAh)
    case "fones-bluetooth": case "smartwatch": case "caixa-de-som": case "power-bank": case "webcam-acao": {
      const marca = marcaDe(MARCAS_GADGET, n, marcaHint);
      if (!marca) break;
      out.add(marca);
      const modelo = n.match(/\b(go|charge|flip|clip|buds|watch|band|mi|redmi|tune|boombox|partybox|go|pulse)\s?(\d{1,3})\b/)?.[0];
      const mah = n.match(/\b(\d{4,6})\s?mah\b/)?.[1];
      const num = n.match(/\b(\d{1,4})\b/)?.[1];
      if (modelo) out.add(modelo.replace(/\s/g, ""));
      else if (mah) out.add(`${mah}mah`);
      else if (num) out.add(num);
      else out.delete(marca); // só marca não compara (evita casar produtos diferentes)
      break;
    }
    // Perfumes — marca + volume (ml) + concentração (edp/edt/…)
    case "perfumes-importados": case "perfumes-arabes": {
      const marca = marcaDe(MARCAS_PERFUME, n, marcaHint);
      const ml = n.match(/\b(\d{1,3})\s?ml\b/)?.[1];
      if (!marca || !ml) break;
      out.add(marca);
      out.add(`${ml}ml`);
      const conc = n.match(/\b(edp|edt|edc|extrait|parfum|cologne)\b/)?.[1];
      if (conc) out.add(conc);
      break;
    }
  }
  return [...out];
}

/**
 * Assinatura de classe de modelo. Retorna null quando o título não tem tokens
 * identificadores suficientes (produto não comparável de forma confiável).
 */
export function assinatura(titulo: string, cat: CategoriaSlug | null, marca?: string | null): string | null {
  if (!cat) return null;
  const toks = tokensModelo(norm(titulo), cat, marca);
  if (toks.length === 0) return null;
  return [cat, ...toks.sort()].join("|");
}

/** Rótulo legível de uma classe (para exibir no card de comparação). */
export function rotuloClasse(titulo: string, cat: CategoriaSlug | null, marca?: string | null): string {
  if (!cat) return titulo.slice(0, 40);
  const toks = tokensModelo(norm(titulo), cat, marca);
  return toks.length ? toks.join(" ").toUpperCase() : titulo.slice(0, 40);
}
