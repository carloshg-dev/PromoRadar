import Link from "next/link";
import { redirect } from "next/navigation";
import { papelAtual, ehStaff } from "@/infrastructure/auth/roles";
import { listarCampanhasRecentes, type StatusCampanha } from "@/pipeline/campanhas.repo";
import { Card } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { timeAgo } from "@/lib/utils";
import { Megaphone, ExternalLink, PlayCircle } from "lucide-react";

export const metadata = { title: "Campanhas — Máquina de Conteúdo" };
export const revalidate = 60;

/**
 * PAINEL DA MÁQUINA DE CONTEÚDO v4.0 — janela sobre a tabela `campanhas`:
 * o que a curadoria escolheu, o que renderizou e o que foi (ou não) postado.
 * MVP leitura + atalhos; thumbnails das artes chegam com o passo R2 (hoje os
 * PNGs gerados na nuvem morrem com o runner após postar).
 */

const CHIP: Record<StatusCampanha, string> = {
  PENDING: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  CURATED: "bg-brand/15 text-brand-2 border-brand/30",
  RENDERED: "bg-cyan/15 text-cyan border-cyan/30",
  READY: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  PUBLISHED: "bg-neon/15 text-neon border-neon/30",
  FAILED: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export default async function CampanhasAdmin() {
  const sessao = await papelAtual();
  if (!ehStaff(sessao?.papel)) redirect("/");

  let campanhas: Awaited<ReturnType<typeof listarCampanhasRecentes>> = [];
  let erroCarga: string | null = null;
  try { campanhas = await listarCampanhasRecentes(40); } catch (e) { erroCarga = (e as Error).message; }

  const porStatus = new Map<string, number>();
  for (const c of campanhas) porStatus.set(c.status, (porStatus.get(c.status) ?? 0) + 1);

  return (
    <main className="mx-auto max-w-page px-4 py-6 sm:px-6 lg:px-10">
      <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Dashboard", href: "/admin" }, { label: "Campanhas" }]} />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Megaphone className="h-6 w-6 text-brand-2" /> Máquina de Conteúdo
        </h1>
        <a href="https://github.com/carloshg-dev/PromoRadar/actions/workflows/conteudo.yml"
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg-soft/60 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:border-brand hover:text-white">
          <PlayCircle className="h-4 w-4 text-neon" /> Rodar pipeline agora <ExternalLink className="h-3 w-3 text-muted" />
        </a>
      </div>
      <p className="mt-1 text-sm text-muted">
        Curadoria → render → publicação, direto da tabela <code className="rounded bg-bg-soft px-1">campanhas</code>.
        Roda sozinha todo dia às 09:00 (BRT).
      </p>

      {/* resumo por status */}
      <div className="mt-5 flex flex-wrap gap-2">
        {(["READY", "PUBLISHED", "FAILED", "CURATED", "RENDERED", "PENDING"] as StatusCampanha[]).map((s) =>
          porStatus.get(s) ? (
            <span key={s} className={`rounded-full border px-3 py-1 text-xs font-bold ${CHIP[s]}`}>
              {s} · {porStatus.get(s)}
            </span>
          ) : null,
        )}
      </div>

      {erroCarga && (
        <Card className="mt-6 border-rose-500/30 p-4 text-sm text-rose-300">
          Não consegui ler a tabela campanhas: {erroCarga}
        </Card>
      )}

      {!erroCarga && campanhas.length === 0 && (
        <Card className="mt-6 p-6 text-sm text-muted">
          Nenhuma campanha ainda — a primeira rodada do pipeline (09:00 BRT) povoa esta tela.
        </Card>
      )}

      <div className="mt-6 grid gap-3">
        {campanhas.map((c) => (
          <Card key={c.id} className="glass p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${CHIP[c.status]}`}>{c.status}</span>
                  {c.lojaSlug && <span className="label-mono text-[10px] text-muted">{c.lojaSlug}</span>}
                  {c.scoreConteudo != null && <span className="label-mono text-[10px] text-brand-2">sc {c.scoreConteudo}</span>}
                </div>
                <div className="mt-1.5 truncate font-semibold text-zinc-100">{c.headline ?? "(sem headline)"}</div>
                {c.erro && <div className="mt-1 text-xs text-rose-300">⚠ {c.erro}</div>}
                {c.legenda && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-brand-2 hover:underline">ver legenda</summary>
                    <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-bg-soft/60 p-3 text-xs text-zinc-300">{c.legenda}</pre>
                  </details>
                )}
              </div>
              <div className="shrink-0 text-right text-[11px] text-muted">
                <div>criada {timeAgo(c.criadoEm)}</div>
                {c.publicadoEm && <div className="text-neon">postada {timeAgo(c.publicadoEm)}</div>}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted">
        💡 Campanhas <b>READY</b> aguardam os secrets <code className="rounded bg-bg-soft px-1">TELEGRAM_FEED_CHAT_ID</code> e{" "}
        <code className="rounded bg-bg-soft px-1">DISCORD_DEALS_WEBHOOK_URL</code> no GitHub pra postar de verdade.
        Miniaturas das artes chegam com a integração R2 (armazenamento permanente).
      </p>
    </main>
  );
}
