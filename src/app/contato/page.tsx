import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SUPPORT_EMAIL } from "@/lib/site";
import { Mail, Handshake, Newspaper, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Contato",
  description: "Fale com o PromoDetec — parcerias, imprensa, privacidade e suporte.",
};

export default function Contato() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Contato" }]} />
      <h1 className="mt-3 text-3xl font-bold tracking-tight">Fale com a gente</h1>
      <p className="mt-3 text-base text-muted">
        Estamos abertos a parcerias, imprensa, dúvidas de privacidade e correções. Respondemos o mais rápido possível.
      </p>

      <a href={`mailto:${SUPPORT_EMAIL}`}
        className="glass hover-raise mt-6 inline-flex items-center gap-3 rounded-2xl border border-brand/40 bg-brand/10 px-5 py-4 text-base font-semibold text-white transition hover:bg-brand/20">
        <Mail className="h-5 w-5 text-brand-2" /> {SUPPORT_EMAIL}
      </a>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Card Icon={Handshake} t="Parcerias & anunciantes" d="Lojas e marcas que querem aparecer ou integrar ofertas." />
        <Card Icon={Newspaper} t="Imprensa" d="Pautas, dados de mercado e citações sobre o PromoDetec." />
        <Card Icon={ShieldCheck} t="Privacidade (LGPD)" d="Acesso, correção ou exclusão dos seus dados." />
        <Card Icon={Mail} t="Suporte & correções" d="Achou um preço errado ou um bug? Conte pra gente." />
      </div>

      <p className="mt-8 text-xs text-muted">
        O PromoDetec é um projeto brasileiro independente. Não vendemos produtos — comparamos preços públicos e
        direcionamos você à loja oficial.
      </p>
    </main>
  );
}

function Card({ Icon, t, d }: { Icon: typeof Mail; t: string; d: string }) {
  return (
    <div className="glass rounded-xl border border-line p-4">
      <Icon className="h-5 w-5 text-brand-2" />
      <div className="mt-1.5 font-semibold text-zinc-100">{t}</div>
      <div className="mt-0.5 text-xs text-muted">{d}</div>
    </div>
  );
}
