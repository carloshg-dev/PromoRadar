import { createServerSupabase } from "@/infrastructure/supabase/server";
import { ShieldCheck, TrendingUp, Sparkles, Database } from "lucide-react";

async function stats() {
  try {
    const sb = createServerSupabase();
    const [{ count: produtos }, { count: precos }] = await Promise.all([
      sb.from("produtos").select("id", { count: "exact", head: true }),
      sb.from("historico_precos").select("id", { count: "exact", head: true }),
    ]);
    return { produtos: produtos ?? 0, precos: precos ?? 0 };
  } catch { return { produtos: 0, precos: 0 }; }
}

export async function AuthAside() {
  const s = await stats();
  const beneficios = [
    { icon: <TrendingUp className="h-4 w-4" />, t: "Histórico real de preços", d: "Veja a evolução e ignore descontos maquiados." },
    { icon: <Sparkles className="h-4 w-4" />, t: "Comparação entre lojas", d: "Preço lado a lado nas lojas parceiras, sem precisar abrir 10 abas." },
    { icon: <ShieldCheck className="h-4 w-4" />, t: "Alertas inteligentes", d: "Avisamos quando o preço que você quer aparecer." },
  ];
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-[#12121a] to-[#0c0c12] p-10 lg:flex">
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2 font-bold"><span className="grid h-7 w-7 place-items-center rounded-lg bg-brand">📡</span>Promo<span className="text-neon">Detec</span></div>
        <h2 className="mt-10 max-w-sm text-2xl font-bold leading-tight">A inteligência que encontra a oportunidade antes do mercado.</h2>
        <div className="mt-8 space-y-4">
          {beneficios.map((b) => (
            <div key={b.t} className="flex gap-3">
              <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand-2">{b.icon}</div>
              <div><div className="text-sm font-semibold">{b.t}</div><div className="text-xs text-muted">{b.d}</div></div>
            </div>
          ))}
        </div>
      </div>
      <div className="relative mt-10 flex gap-6 border-t border-line pt-6">
        <div><div className="flex items-center gap-1.5 text-2xl font-bold tabular-nums"><Database className="h-4 w-4 text-brand-2" />{s.produtos.toLocaleString("pt-BR")}</div><div className="text-xs text-muted">produtos monitorados</div></div>
        <div><div className="text-2xl font-bold tabular-nums">{s.precos.toLocaleString("pt-BR")}</div><div className="text-xs text-muted">pontos de preço coletados</div></div>
      </div>
    </aside>
  );
}
