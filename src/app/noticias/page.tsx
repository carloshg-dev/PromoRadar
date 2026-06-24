import { listarNoticias } from "@/infrastructure/repositories/produtos.repo";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";
import { decodeHtmlEntities, timeAgo } from "@/lib/utils";
import { Newspaper, ExternalLink } from "lucide-react";

export const metadata = { title: "Notícias de tecnologia" };
export const revalidate = 600;

export default async function Noticias() {
  let noticias: Awaited<ReturnType<typeof listarNoticias>> = [];
  try { noticias = await listarNoticias(40); } catch {}

  return (
    <main className="mx-auto max-w-page px-4 py-6 sm:px-6 lg:px-10">
      <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Notícias" }]} />
      <h1 className="mt-3 flex items-center gap-2 text-2xl font-bold"><Newspaper className="h-5 w-5 text-brand-2" /> Notícias de tecnologia</h1>
      <p className="mt-1 text-sm text-muted">Hardware, GPUs, CPUs, lançamentos e IA — atualizado automaticamente.</p>

      {noticias.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {noticias.map((n) => (
            <a key={n.id} href={n.url} target="_blank" rel="noopener noreferrer"
              className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-bg-card/40 transition hover-raise hover:border-brand/40">
              {/* thumbnail */}
              <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-brand/25 via-bg-card to-cyan/15">
                {n.imagem_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={n.imagem_url} alt="" loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="grid h-full place-items-center"><Newspaper className="h-8 w-8 text-brand-2/50" /></div>
                )}
                <span className="absolute left-2 top-2 rounded-md bg-bg/70 px-1.5 py-0.5 label-mono text-[10px] text-brand-2 backdrop-blur">{n.fonte}</span>
              </div>
              {/* conteúdo */}
              <div className="flex flex-1 flex-col p-4">
                <div className="label-mono text-[10px] text-muted">{timeAgo(n.publicado_em)}</div>
                <h3 className="mt-1.5 line-clamp-3 text-sm font-semibold leading-snug text-zinc-100 group-hover:text-white">{decodeHtmlEntities(n.titulo)}</h3>
                {n.resumo && <p className="mt-1.5 line-clamp-2 text-xs text-muted">{decodeHtmlEntities(n.resumo)}</p>}
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex flex-wrap gap-1">
                    {n.tags.slice(0, 2).map((t) => <span key={t} className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] text-brand-2">{t}</span>)}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] text-brand-2">ler <ExternalLink className="h-3 w-3" /></span>
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <EmptyState className="mt-8" icon="📰" title="Nenhuma notícia coletada ainda"
          hint="Rode a coleta de notícias no painel ou aguarde a próxima atualização automática." />
      )}
    </main>
  );
}
