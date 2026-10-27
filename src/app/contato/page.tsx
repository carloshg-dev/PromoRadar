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
        Tire dúvidas sobre ofertas, relate problemas no site ou fale sobre parcerias, imprensa e privacidade.
      </p>

      <section aria-labelledby="ajuda-com-pedido" className="mt-8 border-y border-line py-6">
        <h2 id="ajuda-com-pedido" className="font-display text-xl font-semibold tracking-tight text-ink">
          Precisa de ajuda com um pedido?
        </h2>
        <p className="mt-3 text-sm leading-6 text-ink">
          O PromoDetec compara ofertas e leva você ao site da loja. A compra é feita diretamente nessa loja.
        </p>
        <p className="mt-3 text-sm leading-6 text-ink">
          Para acompanhar pedidos ou pedir ajuda com entrega, troca, devolução ou reembolso,{' '}
          <strong>fale com o atendimento da loja onde você comprou.</strong>
        </p>
      </section>

      <p className="mt-6 text-sm leading-6 text-muted">
        Encontrou uma informação errada em uma oferta ou algum problema no PromoDetec? Escreva para a gente:
      </p>
      <a href={`mailto:${SUPPORT_EMAIL}`}
        className="glass hover-raise mt-3 inline-flex items-center gap-3 rounded-2xl border border-brand/40 bg-brand/10 px-5 py-4 text-base font-semibold text-ink transition hover:bg-brand/20">
        <Mail className="h-5 w-5 text-brand-2" /> {SUPPORT_EMAIL}
      </a>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Card Icon={Handshake} t="Parcerias & anunciantes" d="Lojas e marcas que querem aparecer ou integrar ofertas." />
        <Card Icon={Newspaper} t="Imprensa" d="Pautas, dados de mercado e citações sobre o PromoDetec." />
        <Card Icon={ShieldCheck} t="Privacidade (LGPD)" d="Acesso, correção ou exclusão dos seus dados." />
        <Card Icon={Mail} t="Suporte & correções" d="Achou um preço errado ou um bug? Conte pra gente." />
      </div>

      <p className="mt-8 text-xs text-muted">
        O PromoDetec é um projeto brasileiro independente.
      </p>
    </main>
  );
}

function Card({ Icon, t, d }: { Icon: typeof Mail; t: string; d: string }) {
  return (
    <div className="glass rounded-xl border border-line p-4">
      <Icon className="h-5 w-5 text-brand-2" />
      <div className="mt-1.5 font-semibold text-ink">{t}</div>
      <div className="mt-0.5 text-xs text-muted">{d}</div>
    </div>
  );
}
