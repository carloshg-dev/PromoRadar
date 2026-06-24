import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { LineChart, Gauge, ShieldCheck, Scale } from "lucide-react";

export const metadata = {
  title: "Sobre",
  description: "O que é o PromoDetec: inteligência de promoções com histórico real de preços e o PromoScore.",
};

export default function Sobre() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Sobre" }]} />
      <h1 className="mt-3 text-3xl font-bold tracking-tight">Sobre o PromoDetec</h1>
      <p className="mt-3 text-base text-muted">
        Um radar de promoções com <strong className="text-zinc-200">memória de preços</strong> e uma
        nota de confiança — feito para você comprar no momento certo, com dados e não com vitrine.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-300">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-zinc-100">O que é</h2>
          <p>
            O PromoDetec monitora os preços das principais lojas do Brasil ao longo do dia, guarda o
            histórico de cada produto e dá a cada oferta uma nota de <strong className="text-zinc-200">0 a 100</strong> —
            o <strong className="text-zinc-200">PromoScore</strong> — que mostra o quão boa é a promoção de verdade.
            Cobrimos seis frentes: <strong className="text-zinc-200">tecnologia, casa &amp; eletro, ferramentas,
            suplementos, gadgets e perfumes</strong>. É um site (não um app pra instalar): você abre pelo navegador,
            de qualquer lugar.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-zinc-100">Por que existe</h2>
          <p>
            A maioria dos comparadores só mostra o preço de agora. O PromoDetec responde uma pergunta melhor:
            <em> “esse preço é realmente uma boa oportunidade?”</em> Em vez de confiar no “de/por” anunciado pela
            loja (que às vezes é inflado), comparamos o preço de hoje com o <strong className="text-zinc-200">histórico
            real</strong> do produto. Assim, desmascaramos o desconto falso e destacamos a oferta de verdade.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-100">Como funciona</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            <Item Icon={LineChart} t="Histórico real de preços" d="Coletamos os preços várias vezes ao dia e guardamos tudo." />
            <Item Icon={Gauge} t="PromoScore 0–100" d="Uma nota que revela quão real é cada desconto." />
            <Item Icon={ShieldCheck} t="Detecta desconto falso" d="Comparamos com a média histórica, não com a vitrine." />
            <Item Icon={Scale} t="Compara entre lojas" d="O mesmo modelo, lado a lado, mostrando onde é mais barato." />
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-zinc-100">Quem está por trás</h2>
          <p>
            O PromoDetec é um projeto brasileiro independente, idealizado por <strong className="text-zinc-200">Carlos
            Henrique Garcia</strong>, com a missão de ajudar o consumidor a economizar de verdade. É um produto em
            constante evolução — novas lojas, categorias e recursos entram com frequência.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-zinc-100">Transparência</h2>
          <p>
            O PromoDetec <strong className="text-zinc-200">não vende produtos</strong>: comparamos preços de fontes
            públicas e direcionamos você à loja oficial. Podemos ganhar uma <strong className="text-zinc-200">comissão
            de afiliado</strong> quando você compra por meio dos nossos links — <strong className="text-zinc-200">sem
            nenhum custo extra pra você</strong>. Isso é o que mantém o projeto no ar. Veja a{" "}
            <a href="/privacidade" className="text-brand-2 hover:underline">Política de Privacidade</a> e os{" "}
            <a href="/termos" className="text-brand-2 hover:underline">Termos de Uso</a>.
          </p>
        </section>
      </div>
    </main>
  );
}

function Item({ Icon, t, d }: { Icon: typeof LineChart; t: string; d: string }) {
  return (
    <li className="glass rounded-xl border border-line p-3">
      <Icon className="h-5 w-5 text-brand-2" />
      <div className="mt-1.5 font-semibold text-zinc-100">{t}</div>
      <div className="mt-0.5 text-xs text-muted">{d}</div>
    </li>
  );
}
