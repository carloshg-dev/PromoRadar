/**
 * Tema sazonal MINIMALISTA — o site "se veste" da época sozinho (uma faixa fina
 * no topo), sem exagero. Detecta a data e devolve o tema ativo, ou null (resto
 * do ano = site normal). As classes de cor são literais (Tailwind JIT detecta).
 *
 * Datas fixas/eventos entram aqui; o recorrente (São João, Natal…) é por mês.
 */
export interface TemaSazonal {
  id: string;
  emoji: string;
  frase: string;
  /** gradiente da faixa (cores já usadas no projeto) */
  grad: string;
  /** cor neon do tema (borda/glow nos destaques + micro-badge nos cards) */
  corHex: string;
  /** emojis decorativos do fundo (variedade festiva) */
  decor: string[];
  /** chamada pra ação (opcional) */
  cta?: { href: string; label: string };
}

export function temaSazonal(hoje: Date = new Date()): TemaSazonal | null {
  const m = hoje.getMonth() + 1;
  const dia = hoje.getDate();
  const entre = (ini: [number, number, number], fim: [number, number, number]) =>
    hoje >= new Date(ini[0], ini[1] - 1, ini[2]) &&
    hoje <= new Date(fim[0], fim[1] - 1, fim[2], 23, 59, 59);

  // Override p/ PREVIEW local (NEXT_PUBLIC_TEMA_FORCE=inverno-pais). Não setar em prod:
  // sem a env, os temas entram/saem SOZINHOS pela data.
  const força = process.env.NEXT_PUBLIC_TEMA_FORCE;

  // Inverno + Dia dos Pais (19/07–10/08) — antes da Copa na cadeia: no dia 19 ele vence.
  if (força === "inverno-pais" || entre([2026, 7, 19], [2026, 8, 10]))
    return { id: "inverno-pais", emoji: "🥸", frase: "Dia dos Pais no inverno — o melhor presente é economia de verdade.", grad: "from-sky-700/30 via-blue-500/15 to-indigo-600/25", corHex: "#38bdf8", decor: ["❄️", "🎁", "🧣", "☕", "👔", "🥸"], cta: { href: "/ofertas", label: "Ver presentes" } };

  // Copa do Mundo 2026 (11/06–19/07) — coincide com o São João: tema combinado.
  if (entre([2026, 6, 11], [2026, 7, 19]))
    return { id: "copa-arraia", emoji: "⚽", frase: "Clima de Copa e Arraiá — ofertas pra torcer e festejar!", grad: "from-emerald-600/30 via-yellow-500/15 to-emerald-600/25", corHex: "#22e06b", decor: ["⚽", "🎉", "🌽", "🏆", "🇧🇷", "🎆"], cta: { href: "/ofertas", label: "Ver ofertas" } };

  // São João / festas juninas (junho + início de julho) — anos sem Copa.
  if (m === 6 || (m === 7 && dia <= 6))
    return { id: "sao-joao", emoji: "🎉", frase: "Arraiá PromoDetec — ofertas quentes que nem quentão!", grad: "from-amber-600/30 via-orange-500/15 to-rose-500/20", corHex: "#f59e0b", decor: ["🎉", "🌽", "🎪", "🔥", "🪕", "🎆"], cta: { href: "/ofertas", label: "Ver ofertas" } };

  // Black Friday (20–30/11).
  if (m === 11 && dia >= 20)
    return { id: "black-friday", emoji: "🛍️", frase: "Black Friday de verdade — a gente desmascara desconto falso", grad: "from-zinc-800/50 via-brand/20 to-zinc-800/40", corHex: "#7c5dff", decor: ["🛍️", "🔥", "💸", "🏷️", "⚡"], cta: { href: "/ofertas", label: "Ver ofertas" } };

  // Natal (dezembro).
  if (m === 12)
    return { id: "natal", emoji: "🎄", frase: "Natal PromoDetec — presente bom sem pagar caro", grad: "from-rose-600/30 via-amber-400/15 to-emerald-600/25", corHex: "#ef4444", decor: ["🎄", "🎁", "⭐", "❄️", "🔔"], cta: { href: "/ofertas", label: "Ver ofertas" } };

  return null; // resto do ano: sem tema
}
