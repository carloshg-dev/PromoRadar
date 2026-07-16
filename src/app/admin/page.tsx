import { redirect } from "next/navigation";
import { createAdminClient } from "@/infrastructure/supabase/admin";
import { papelAtual, ehStaff, podeColetar, podeGerirEquipe, PAPEL_LABEL, type Papel } from "@/infrastructure/auth/roles";
import { Card } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CollectButton } from "@/components/collect-button";
import { CollectAllButton } from "@/components/collect-all-button";
import { CleanupButton } from "@/components/cleanup-button";
import { RetroactiveCleanupButton } from "@/components/retroactive-cleanup-button";
import { AddOfferForm } from "@/components/admin/add-offer-form";
import { timeAgo } from "@/lib/utils";
import { Package, LineChart, Activity, Zap, ShieldCheck, Users, MousePointerClick, Search, Eye, Smartphone } from "lucide-react";

export const metadata = { title: "Dashboard" };
export const revalidate = 300;

/** Lojas disponíveis p/ coleta manual (espelha o VALID da rota /api/scrape). */
// GUILHOTINA 02/07: só lojas monetizadas (ver registry.ts).
const ADAPTERS_UI = ["mercadolivre", "amazon", "lomadee", "awin", "carrefour", "kabum", "polishop"] as const;

interface MembroEquipe { email: string | null; role: Papel }

/** Agregados de analytics (tabela `eventos`) dos últimos 7 dias. */
async function carregarAnalytics() {
  const sb = createAdminClient();
  const seteDias = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data } = await sb
    .from("eventos")
    .select("tipo,termo,produto_id,categoria_slug,dispositivo")
    .gte("criado_em", seteDias)
    .limit(5000);
  const ev = data ?? [];

  const topDe = (pred: (e: typeof ev[number]) => string | null, n: number) => {
    const m = new Map<string, number>();
    for (const e of ev) { const k = pred(e); if (k) m.set(k, (m.get(k) ?? 0) + 1); }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
  };

  const topBuscas = topDe((e) => (e.tipo === "busca" ? (e.termo as string | null) : null), 8);
  const topCategorias = topDe((e) => (e.tipo === "ver_categoria" ? (e.categoria_slug as string | null) : null), 6);
  const viewIds = topDe((e) => (e.tipo === "ver_produto" ? (e.produto_id as string | null) : null), 5);

  let topProdutos: { titulo: string; lojaNome: string; views: number }[] = [];
  if (viewIds.length) {
    const { data: prods } = await sb.from("vw_ofertas").select("id,titulo,loja_nome").in("id", viewIds.map(([id]) => id));
    topProdutos = viewIds.map(([id, v]) => {
      const p = (prods ?? []).find((x) => x.id === id);
      return { titulo: (p?.titulo as string) ?? "—", lojaNome: (p?.loja_nome as string) ?? "", views: v };
    });
  }

  const mobile = ev.filter((e) => e.dispositivo === "mobile").length;
  const desktop = ev.filter((e) => e.dispositivo === "desktop").length;
  return { totalEventos: ev.length, topBuscas, topCategorias, topProdutos, mobile, desktop };
}

async function carregar() {
  const sb = createAdminClient();
  const seteDias = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [{ count: produtos }, { count: hist }, { count: usuarios }, jobs, equipe, cliques] = await Promise.all([
    sb.from("produtos").select("id", { count: "exact", head: true }),
    sb.from("historico_precos").select("id", { count: "exact", head: true }),
    sb.from("usuarios").select("id", { count: "exact", head: true }),
    sb.from("scrape_jobs").select("*").order("criado_em", { ascending: false }).limit(8),
    sb.from("usuarios").select("email,role").neq("role", "user").order("role"),
    sb.from("cliques").select("produto_id", { count: "exact" }).gte("criado_em", seteDias).limit(2000),
  ]);

  // top 5 mais clicados nos últimos 7 dias (agregado aqui — o volume cabe em memória)
  const porProduto = new Map<string, number>();
  for (const c of cliques.data ?? []) {
    const pid = c.produto_id as string | null;
    if (pid) porProduto.set(pid, (porProduto.get(pid) ?? 0) + 1);
  }
  const top = [...porProduto.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  let topClicados: { titulo: string; lojaNome: string; cliques: number }[] = [];
  if (top.length) {
    const { data: prods } = await sb.from("vw_ofertas").select("id,titulo,loja_nome").in("id", top.map(([id]) => id));
    topClicados = top.map(([id, n]) => {
      const p = (prods ?? []).find((x) => x.id === id);
      return { titulo: (p?.titulo as string) ?? "—", lojaNome: (p?.loja_nome as string) ?? "", cliques: n };
    });
  }

  return {
    produtos: produtos ?? 0, hist: hist ?? 0, usuarios: usuarios ?? 0, cliques7d: cliques.count ?? 0,
    jobs: jobs.data ?? [], equipe: (equipe.data ?? []) as MembroEquipe[], topClicados,
  };
}

export default async function Admin() {
  // Gate por papel (usuarios.role): user comum não entra; cada papel vê o que pode.
  const sessao = await papelAtual();
  if (!ehStaff(sessao?.papel)) redirect("/");
  const papel = sessao!.papel;

  let d: Awaited<ReturnType<typeof carregar>> = { produtos: 0, hist: 0, usuarios: 0, cliques7d: 0, jobs: [], equipe: [], topClicados: [] };
  try { d = await carregar(); } catch {}
  const ultimo = d.jobs[0];

  let a: Awaited<ReturnType<typeof carregarAnalytics>> = { totalEventos: 0, topBuscas: [], topCategorias: [], topProdutos: [], mobile: 0, desktop: 0 };
  try { a = await carregarAnalytics(); } catch {}
  const totalDisp = a.mobile + a.desktop || 1;

  return (
    <main className="mx-auto max-w-page px-4 py-6 sm:px-6 lg:px-10">
      <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Dashboard" }]} />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-neon/30 bg-neon/10 px-2.5 py-1 label-mono text-[10px] text-neon">
          <ShieldCheck className="h-3 w-3" /> {PAPEL_LABEL[papel]}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">Monitore coletas, dispare scrapers e acompanhe o banco proprietário.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Metric icon={<Package className="h-4 w-4" />} label="Produtos" value={d.produtos.toLocaleString("pt-BR")} accent="text-brand-2" />
        <Metric icon={<LineChart className="h-4 w-4" />} label="Pontos de preço" value={d.hist.toLocaleString("pt-BR")} accent="text-neon" />
        <Metric icon={<Users className="h-4 w-4" />} label="Usuários" value={d.usuarios.toLocaleString("pt-BR")} />
        <Metric icon={<MousePointerClick className="h-4 w-4" />} label="Cliques (7d)" value={d.cliques7d.toLocaleString("pt-BR")} accent="text-neon" />
        <Metric icon={<Activity className="h-4 w-4" />} label="Coletas (recentes)" value={String(d.jobs.length)} />
        <Metric icon={<Zap className="h-4 w-4" />} label="Última" value={ultimo ? ultimo.status : "—"} isText
          sub={ultimo ? timeAgo(ultimo.criado_em) : undefined} />
      </div>

      {podeColetar(papel) && (
        <section className="mt-8">
          <AddOfferForm />
        </section>
      )}

      {/* ANALYTICS (eventos próprios, 7 dias) */}
      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="label-mono text-[11px] text-muted">Analytics — comportamento (7 dias)</h2>
          <span className="label-mono text-[10px] text-muted/70">{a.totalEventos.toLocaleString("pt-BR")} eventos · heatmaps/sessões no Microsoft Clarity</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Top buscas */}
          <Card className="glass p-4">
            <div className="mb-2 flex items-center gap-1.5 label-mono text-[10px] text-muted"><Search className="h-3.5 w-3.5" /> Buscas mais feitas</div>
            {a.topBuscas.length ? a.topBuscas.map(([termo, n]) => (
              <div key={termo} className="flex items-center justify-between border-t border-line py-1.5 text-sm first:border-0">
                <span className="line-clamp-1 text-zinc-200">{termo}</span><span className="tabular-nums text-brand-2">{n}</span>
              </div>
            )) : <p className="text-xs text-muted">Sem buscas ainda.</p>}
          </Card>
          {/* Top produtos vistos */}
          <Card className="glass p-4">
            <div className="mb-2 flex items-center gap-1.5 label-mono text-[10px] text-muted"><Eye className="h-3.5 w-3.5" /> Produtos mais vistos</div>
            {a.topProdutos.length ? a.topProdutos.map((p, i) => (
              <div key={i} className="flex items-center justify-between gap-2 border-t border-line py-1.5 text-sm first:border-0">
                <span className="line-clamp-1 text-zinc-200">{p.titulo}</span><span className="shrink-0 tabular-nums text-neon">{p.views}</span>
              </div>
            )) : <p className="text-xs text-muted">Sem views ainda.</p>}
          </Card>
          {/* Categorias + dispositivo */}
          <Card className="glass p-4">
            <div className="mb-2 flex items-center gap-1.5 label-mono text-[10px] text-muted"><Smartphone className="h-3.5 w-3.5" /> Dispositivo &amp; categorias</div>
            <div className="mb-3 flex items-center gap-3 text-sm">
              <span className="text-zinc-200">📱 {Math.round((a.mobile / totalDisp) * 100)}%</span>
              <span className="text-muted">·</span>
              <span className="text-zinc-200">🖥️ {Math.round((a.desktop / totalDisp) * 100)}%</span>
            </div>
            {a.topCategorias.length ? a.topCategorias.map(([cat, n]) => (
              <div key={cat} className="flex items-center justify-between border-t border-line py-1 text-xs first:border-0">
                <span className="capitalize text-zinc-300">{cat.replace(/-/g, " ")}</span><span className="tabular-nums text-muted">{n}</span>
              </div>
            )) : <p className="text-xs text-muted">Sem categorias ainda.</p>}
          </Card>
        </div>
      </section>

      {podeColetar(papel) && (
        <section className="mt-8">
          <h2 className="mb-3 label-mono text-[11px] text-muted">Coleta manual</h2>
          <div className="mb-3"><CollectAllButton adapters={ADAPTERS_UI} /></div>
          <div className="flex flex-wrap gap-2">
            {ADAPTERS_UI.map((k) => <CollectButton key={k} adapter={k} />)}
          </div>
          <p className="mt-2 text-[11px] text-muted">Dispara uma coleta imediata na loja escolhida. (Lojas de browser podem demorar/depender do ambiente.)</p>
        </section>
      )}

      {podeGerirEquipe(papel) && (
        <section className="mt-8">
          <h2 className="mb-3 label-mono text-[11px] text-muted">Manutenção do catálogo (super admin)</h2>
          <div className="grid gap-3">
            <CleanupButton />
            <RetroactiveCleanupButton />
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 label-mono text-[11px] text-muted">Top clicados (7 dias)</h2>
        <Card className="glass overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg-soft/60 label-mono text-[10px] text-muted">
              <tr><th className="px-4 py-2.5 text-left">Produto</th><th className="px-4 py-2.5 text-left">Loja</th>
              <th className="px-4 py-2.5 text-right">Cliques</th></tr>
            </thead>
            <tbody>
              {d.topClicados.map((t, i) => (
                <tr key={i} className="border-t border-line hover:bg-bg-soft/40">
                  <td className="px-4 py-2.5"><span className="line-clamp-1">{t.titulo}</span></td>
                  <td className="px-4 py-2.5 text-muted">{t.lojaNome}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-neon">{t.cliques}</td>
                </tr>
              ))}
              {!d.topClicados.length && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-muted">
                  Nenhum clique ainda — os botões &quot;Ir à loja&quot; passaram a contar a partir de agora.
                </td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </section>

      {podeGerirEquipe(papel) && (
        <section className="mt-8">
          <h2 className="mb-3 label-mono text-[11px] text-muted">Equipe (papéis de acesso)</h2>
          <Card className="glass overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-bg-soft/60 label-mono text-[10px] text-muted">
                <tr><th className="px-4 py-2.5 text-left">E-mail</th><th className="px-4 py-2.5 text-right">Papel</th></tr>
              </thead>
              <tbody>
                {d.equipe.map((m) => (
                  <tr key={m.email ?? m.role} className="border-t border-line">
                    <td className="px-4 py-2.5">{m.email ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`rounded-md px-2 py-0.5 label-mono text-[10px] ${m.role === "super_admin" ? "bg-neon/15 text-neon" : "bg-brand/15 text-brand-2"}`}>
                        {PAPEL_LABEL[m.role]}
                      </span>
                    </td>
                  </tr>
                ))}
                {!d.equipe.length && <tr><td colSpan={2} className="px-4 py-6 text-center text-muted">Nenhum membro além de você.</td></tr>}
              </tbody>
            </table>
          </Card>
          <p className="mt-2 text-[11px] text-muted">
            Promoções/rebaixamentos são feitos pelo banco (service role) — nenhum usuário comum consegue se autopromover.
          </p>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 label-mono text-[11px] text-muted">Últimas coletas</h2>
        <Card className="glass overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg-soft/60 label-mono text-[10px] text-muted">
              <tr><th className="px-4 py-2.5 text-left">Adapter</th><th className="px-4 py-2.5 text-left">Status</th>
              <th className="px-4 py-2.5 text-right">Salvos</th><th className="px-4 py-2.5 text-right">Erros</th>
              <th className="px-4 py-2.5 text-right">Quando</th></tr>
            </thead>
            <tbody>
              {d.jobs.map((j) => (
                <tr key={j.id} className="border-t border-line hover:bg-bg-soft/40">
                  <td className="px-4 py-2.5 font-medium">{j.adapter_key}</td>
                  <td className="px-4 py-2.5"><StatusPill status={j.status} /></td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-neon">{j.itens_salvos ?? 0}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-rose-400">{j.erros ?? 0}</td>
                  <td className="px-4 py-2.5 text-right text-muted">{timeAgo(j.criado_em)}</td>
                </tr>
              ))}
              {!d.jobs.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Nenhuma coleta ainda.</td></tr>}
            </tbody>
          </table>
        </Card>
      </section>
    </main>
  );
}

function Metric({ icon, label, value, accent, isText, sub }:
  { icon: React.ReactNode; label: string; value: string; accent?: string; isText?: boolean; sub?: string }) {
  return (
    <Card className="glass p-4">
      <div className="flex items-center gap-1.5 label-mono text-[10px] text-muted">
        <span className="text-muted/80">{icon}</span>{label}
      </div>
      <div className={`mt-1.5 font-display font-extrabold ${isText ? "text-lg capitalize" : "text-2xl tabular-nums"} ${accent ?? "text-zinc-100"}`}>{value}</div>
      {sub && <div className="label-mono text-[10px] text-muted">{sub}</div>}
    </Card>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    success: "bg-neon/15 text-neon",
    partial: "bg-amber-500/15 text-amber-300",
    failed: "bg-rose-500/15 text-rose-300",
    running: "bg-brand/15 text-brand-2",
    pending: "bg-zinc-500/15 text-zinc-400",
  };
  return <span className={`rounded-md px-2 py-0.5 label-mono text-[10px] ${map[status] ?? map.pending}`}>{status}</span>;
}
