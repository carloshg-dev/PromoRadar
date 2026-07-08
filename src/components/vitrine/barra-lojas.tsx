import Link from "next/link";
import { listarLojasVitrine, type LojaVitrine } from "@/infrastructure/repositories/lojas.repo";
import { corLoja } from "@/lib/utils";
import { DragScroll } from "@/components/ui/drag-scroll";

/**
 * BARRA DE LOJAS (Opção 1 aprovada pelo dono) — pílulas grandes com a logo e a
 * cor ORIGINAL de cada marca, na identidade das pílulas de categoria. Filtro
 * SERVER-SIDE via ?loja= (catálogo completo da loja com paginação — não os 60
 * itens da página, limitação do filtro client antigo). Server component: falhou
 * a busca de lojas → não renderiza nada e o grid segue vivo.
 */

/** Logo real: usa a oficial (CDN Awin) e cai pro favicon do site da loja. */
function logoDaLoja(l: LojaVitrine): string | null {
  if (l.logoUrl) return l.logoUrl;
  if (!l.baseUrl) return null;
  try {
    const host = new URL(l.baseUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  } catch { return null; }
}

export async function BarraLojas({ baseHref, ativa, params = {} }: {
  baseHref: string;
  ativa?: string | null;
  /** filtros a preservar nos links (categoria, busca…) */
  params?: Record<string, string | undefined>;
}) {
  let lojas: LojaVitrine[] = [];
  try { lojas = await listarLojasVitrine(); } catch { return null; }
  // "lomadee" é REDE, não loja de verdade — os achados dela seguem no grid geral.
  lojas = lojas.filter((l) => l.slug !== "lomadee");
  if (lojas.length < 2) return null;

  const href = (slug?: string) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
    if (slug) q.set("loja", slug);
    const qs = q.toString();
    return qs ? `${baseHref}?${qs}` : baseHref;
  };

  return (
    <div className="mt-4">
      <div className="label-mono text-[11px] text-muted">Lojas parceiras</div>
      <DragScroll className="mt-2 flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link
          href={href()}
          className={`flex shrink-0 items-center rounded-full border px-3.5 py-2 text-sm font-medium transition ${
            !ativa ? "border-brand bg-brand/15 text-brand-2" : "border-line text-muted hover:bg-bg-soft hover:text-white"
          }`}
        >
          Todas
        </Link>
        {lojas.map((l) => {
          const cor = corLoja(l.slug);
          const on = ativa === l.slug;
          const logo = logoDaLoja(l);
          return (
            <Link
              key={l.slug}
              href={href(l.slug)}
              title={l.rede ? `${l.nome} · parceira ${l.rede}` : l.nome}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                on ? "text-white" : "border-line text-muted hover:bg-bg-soft hover:text-white"
              }`}
              style={on ? { borderColor: cor, backgroundColor: `${cor}26`, boxShadow: `0 0 16px ${cor}2e` } : undefined}
            >
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" loading="lazy"
                  className="h-5 w-5 shrink-0 rounded-full bg-white/95 object-contain p-px" />
              ) : (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: cor }}>
                  {l.nome.charAt(0)}
                </span>
              )}
              <span className="whitespace-nowrap">{l.nome}</span>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: cor }} />
            </Link>
          );
        })}
      </DragScroll>
    </div>
  );
}
