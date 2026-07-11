import { formatBRL } from "@/lib/utils";

/**
 * ARTE DE OFERTA (Máquina de Conteúdo v4.0) — o SVG do gerador antigo, extraído
 * pra função pura e PARAMETRIZADA pelos dados do motor de pontuação. Sem DOM,
 * sem browser: devolve a STRING do SVG, que o render-arte transforma em PNG via
 * resvg (nativo). Mesmo layout do painel; as 3 barras de "lojas diferentes"
 * viraram HISTÓRICO de preço (Mínimo/Médio/Máximo), o dado real de cada achado.
 */

export interface DadosArte {
  titulo: string;
  precoAtual: number;
  precoOriginal: number | null;
  descontoPct: number | null;
  promoScore: number | null;
  lojaNome: string;
  precoMinHist: number | null;
  precoAvgHist: number | null;
  precoMaxHist: number | null;
  /** foto embutida como data:URI (o render busca e converte); null = placeholder. */
  fotoDataUri: string | null;
  link?: string;
}

const V = 680, RS = 28, CS = 2 * Math.PI * RS;
// Fonte com FALLBACK: Inter (moderna, empacotada em assets/fonts p/ a nuvem) →
// Arial (sistema, local) → sans-serif. O render carrega o .ttf do Inter; onde
// ele não existir, cai no Arial sem quebrar. Ver assets/fonts/README.md.
const FONTE = "Inter, Arial, Helvetica, sans-serif";

function esc(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
/** Quebra o título em 2 linhas (~18 chars), como o wrap2 do painel. */
function wrap2(s: string): [string, string] {
  const t = esc(s);
  if (t.length <= 18) return [t, ""];
  let p = t.lastIndexOf(" ", 18);
  if (p < 6) p = 18;
  return [t.slice(0, p), t.slice(p).trim().slice(0, 22)];
}

function feat(y: number, t: string, d: string, ic: "target" | "scale" | "dollar"): string {
  const icons: Record<string, string> = {
    target: `<circle cx="62" cy="${y + 22}" r="13" fill="none" stroke="#22E06B" stroke-width="2"/><circle cx="62" cy="${y + 22}" r="4" fill="#22E06B"/>`,
    scale: `<line x1="62" y1="${y + 10}" x2="62" y2="${y + 34}" stroke="#22E06B" stroke-width="2"/><line x1="48" y1="${y + 15}" x2="76" y2="${y + 15}" stroke="#22E06B" stroke-width="2"/><circle cx="48" cy="${y + 20}" r="3" fill="#22E06B"/><circle cx="76" cy="${y + 20}" r="3" fill="#22E06B"/><line x1="54" y1="${y + 34}" x2="70" y2="${y + 34}" stroke="#22E06B" stroke-width="2"/>`,
    dollar: `<circle cx="62" cy="${y + 22}" r="13" fill="none" stroke="#22E06B" stroke-width="2"/><text x="62" y="${y + 27}" text-anchor="middle" font-family="${FONTE}" font-size="15" font-weight="700" fill="#22E06B">$</text>`,
  };
  return `<rect x="40" y="${y}" width="44" height="44" rx="10" fill="#0F1A12" stroke="#22E06B" stroke-width="1.5"/>${icons[ic]}`
    + `<text x="98" y="${y + 18}" font-family="${FONTE}" font-size="15" font-weight="700" fill="#FFFFFF">${t}</text>`
    + `<text x="98" y="${y + 37}" font-family="${FONTE}" font-size="12" fill="#938ea1">${d}</text>`;
}

function bar(y: number, nome: string, preco: string, w: number, bc: string, tc: string, bold: boolean): string {
  const b = bold ? 'font-weight="700" ' : "";
  return `<text x="60" y="${y + 5}" font-family="${FONTE}" font-size="13" ${b}fill="${tc}">${nome}</text>`
    + `<rect x="150" y="${y - 4}" width="${Math.max(24, w)}" height="14" rx="7" fill="${bc}"/>`
    + `<text x="620" y="${y + 5}" text-anchor="end" font-family="${FONTE}" font-size="13" ${b}fill="${tc}">${preco}</text>`;
}

function trust(y: number): string {
  const it = (x: number, txt: string) =>
    `<circle cx="${x}" cy="${y - 4}" r="7" fill="none" stroke="#22E06B" stroke-width="1.5"/><text x="${x + 14}" y="${y}" font-family="${FONTE}" font-size="13" fill="#938ea1">${txt}</text>`;
  return it(150, "Confiável") + `<line x1="278" y1="${y - 14}" x2="278" y2="${y + 4}" stroke="#26262b"/>`
    + it(300, "Sem cadastro") + `<line x1="452" y1="${y - 14}" x2="452" y2="${y + 4}" stroke="#26262b"/>`
    + it(474, "100% Gratuito");
}

/** Monta o SVG da arte. `tall`=true → formato Story (1080×1920), senão Feed (1080×1350). */
export function montarArteOferta(d: DadosArte, tall = false): string {
  const hh = tall ? 1209 : 850;
  const topPad = tall ? (1209 - 850) / 2 : 0;
  const score = Math.max(0, Math.min(100, Math.round(d.promoScore ?? 0)));
  const dash = `${((score / 100) * CS).toFixed(0)} ${CS.toFixed(0)}`;
  const nm = wrap2(d.titulo);
  const desconto = d.descontoPct ? `−${d.descontoPct}%` : "OFERTA";
  const link = esc(d.link ?? "promodetec.vercel.app");

  // barras = histórico de preço (Mínimo verde em destaque; Médio/Máximo cinza).
  const mx = Math.max(d.precoMaxHist ?? 0, d.precoAvgHist ?? 0, d.precoMinHist ?? 0, d.precoAtual);
  const larg = (v: number | null) => (mx > 0 && v ? Math.round((v / mx) * 360) : 24);
  const barras = (d.precoMinHist || d.precoAvgHist || d.precoMaxHist)
    ? bar(648, "MÍNIMO", formatBRL(d.precoMinHist ?? d.precoAtual), larg(d.precoMinHist ?? d.precoAtual), "#22E06B", "#22E06B", true)
      + bar(678, "MÉDIO", d.precoAvgHist ? formatBRL(d.precoAvgHist) : "—", larg(d.precoAvgHist), "#444441", "#938ea1", false)
      + bar(708, "MÁXIMO", d.precoMaxHist ? formatBRL(d.precoMaxHist) : "—", larg(d.precoMaxHist), "#444441", "#938ea1", false)
    : bar(672, "PREÇO ATUAL", formatBRL(d.precoAtual), 360, "#22E06B", "#22E06B", true);

  const foto = d.fotoDataUri
    ? `<image href="${d.fotoDataUri}" x="344" y="${330 + topPad}" width="272" height="150" preserveAspectRatio="xMidYMid slice" clip-path="url(#cf)"/>`
    : `<rect x="344" y="${330 + topPad}" width="272" height="150" rx="12" fill="#1E1E20" stroke="#26262b"/><text x="480" y="${410 + topPad}" text-anchor="middle" font-family="${FONTE}" font-size="13" fill="#5F5E5A">FOTO DO PRODUTO</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${V} ${hh}">`
    + `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7C5DFF"/><stop offset="1" stop-color="#00dbe7"/></linearGradient>`
    + `<clipPath id="cf"><rect x="344" y="${330 + topPad}" width="272" height="150" rx="12"/></clipPath></defs>`
    + `<rect x="0" y="0" width="${V}" height="${hh}" fill="#0A0A0C"/>`
    + `<g transform="translate(0,${topPad})">`
    + `<circle cx="70" cy="60" r="160" fill="none" stroke="#22E06B" stroke-width="1" opacity="0.06"/>`
    + `<circle cx="70" cy="60" r="220" fill="none" stroke="#22E06B" stroke-width="1" opacity="0.05"/>`
    + `<rect x="195" y="58" width="46" height="42" rx="10" fill="#0F1A12" stroke="#22E06B" stroke-width="2"/>`
    + `<line x1="218" y1="58" x2="218" y2="46" stroke="#22E06B" stroke-width="2"/><circle cx="218" cy="44" r="3.5" fill="#22E06B"/>`
    + `<circle cx="208" cy="80" r="5" fill="#22E06B"/><circle cx="228" cy="80" r="5" fill="#22E06B"/>`
    + `<text x="255" y="92" font-family="${FONTE}" font-size="38" font-weight="700"><tspan fill="#FFFFFF">Promo</tspan><tspan fill="#22E06B">Detec</tspan></text>`
    + `<text x="340" y="126" text-anchor="middle" font-family="${FONTE}" font-size="12" letter-spacing="5" fill="#22E06B" opacity="0.85">DETECTA · COMPARA · ECONOMIZA</text>`
    + `<text x="40" y="238" font-family="${FONTE}" font-size="46" font-weight="700" fill="#FFFFFF">Achado</text>`
    + `<text x="40" y="286" font-family="${FONTE}" font-size="46" font-weight="700" fill="#22E06B">do dia.</text>`
    + `<rect x="40" y="300" width="96" height="4" rx="2" fill="#22E06B"/>`
    + `<text x="40" y="340" font-family="${FONTE}" font-size="19" fill="#FFFFFF">Preço real, verificado</text>`
    + `<text x="40" y="365" font-family="${FONTE}" font-size="19" font-weight="700" fill="#22E06B">pelo histórico.</text>`
    + feat(396, "DETECTA", "As melhores promoções", "target")
    + feat(452, "COMPARA", "Preços entre lojas", "scale")
    + feat(508, "ECONOMIZA", "Seu dinheiro e seu tempo", "dollar")
    + `<rect x="320" y="190" width="320" height="378" rx="20" fill="#0B0F0B" stroke="#22E06B" stroke-width="2"/>`
    + `<rect x="344" y="214" width="62" height="28" rx="8" fill="#22E06B"/><text x="375" y="233" text-anchor="middle" font-family="${FONTE}" font-size="14" font-weight="700" fill="#0A0A0C">${esc(desconto)}</text>`
    + `<circle cx="600" cy="232" r="${RS}" fill="none" stroke="#26262b" stroke-width="9"/>`
    + `<circle cx="600" cy="232" r="${RS}" fill="none" stroke="url(#g)" stroke-width="9" stroke-linecap="round" stroke-dasharray="${dash}" transform="rotate(-90 600 232)"/>`
    + `<text x="600" y="239" text-anchor="middle" font-family="${FONTE}" font-size="18" font-weight="700" fill="#cabeff">${score}</text>`
    + `<text x="600" y="276" text-anchor="middle" font-family="${FONTE}" font-size="9" letter-spacing="1" fill="#938ea1">PROMOSCORE</text>`
    + `<text x="344" y="292" font-family="${FONTE}" font-size="20" font-weight="700" fill="#FFFFFF">${nm[0]}</text>`
    + (nm[1] ? `<text x="344" y="316" font-family="${FONTE}" font-size="20" font-weight="700" fill="#FFFFFF">${nm[1]}</text>` : "")
    + foto
    + `<text x="344" y="528" font-family="${FONTE}" font-size="38" font-weight="700" fill="#22E06B">${esc(formatBRL(d.precoAtual))}</text>`
    + (d.precoOriginal && d.precoOriginal > d.precoAtual
      ? `<text x="344" y="554" font-family="${FONTE}" font-size="17" fill="#938ea1">${esc(formatBRL(d.precoOriginal))}</text>`
        + `<line x1="344" y1="548" x2="${344 + formatBRL(d.precoOriginal).length * 9}" y2="548" stroke="#938ea1" stroke-width="1.5"/>`
      : "")
    + `<text x="40" y="608" font-family="${FONTE}" font-size="13" fill="#938ea1">Histórico de preço deste produto</text>`
    + `<rect x="40" y="620" width="600" height="98" rx="14" fill="#161618" stroke="#26262b"/>`
    + barras
    + `<rect x="40" y="734" width="600" height="58" rx="14" fill="#161618" stroke="#26262b"/>`
    + `<path d="M66 748 l16 5 v9 c0 8 -8 12 -16 16 c-8 -4 -16 -8 -16 -16 v-9 z" fill="none" stroke="#22E06B" stroke-width="2" stroke-linejoin="round"/>`
    + `<text x="96" y="758" font-family="${FONTE}" font-size="16" font-weight="700" fill="#FFFFFF">Preço real, não vitrine.</text>`
    + `<text x="96" y="778" font-family="${FONTE}" font-size="12" fill="#938ea1">${esc(d.lojaNome)} · histórico + PromoScore</text>`
    + `<rect x="436" y="744" width="184" height="38" rx="19" fill="#22E06B"/><text x="528" y="768" text-anchor="middle" font-family="${FONTE}" font-size="13" font-weight="700" fill="#0A0A0C">→ ${link}</text>`
    + trust(820)
    + `</g></svg>`;
}
