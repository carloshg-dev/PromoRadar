import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SUPPORT_EMAIL } from "@/lib/site";

export const metadata = {
  title: "Política de Privacidade",
  description: "Como o PromoDetec coleta, usa e protege seus dados, em conformidade com a LGPD.",
};

export default function Privacidade() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Privacidade" }]} />
      <h1 className="mt-3 text-3xl font-bold tracking-tight">Política de Privacidade</h1>
      <p className="mt-2 text-xs text-muted">Última atualização: junho de 2026.</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-zinc-300">
        <p>
          O PromoDetec respeita a sua privacidade e segue a <strong className="text-zinc-200">Lei Geral de Proteção
          de Dados (LGPD — Lei 13.709/2018)</strong>. Esta política explica, de forma simples, quais dados tratamos,
          para quê e quais são os seus direitos.
        </p>

        <Secao titulo="1. Dados que coletamos">
          <ul className="list-disc space-y-1 pl-5">
            <li><strong className="text-zinc-200">Conta</strong> (se você se cadastrar): nome e e-mail, via login por e-mail ou Google.</li>
            <li><strong className="text-zinc-200">Preferências</strong>: interesses escolhidos no onboarding, para personalizar o conteúdo.</li>
            <li><strong className="text-zinc-200">Uso do site</strong>: eventos de navegação (páginas vistas, buscas, cliques em ofertas), de forma agregada.</li>
            <li><strong className="text-zinc-200">Dados técnicos</strong>: tipo de dispositivo, navegador e localização aproximada (cidade/país), para estatísticas e segurança.</li>
          </ul>
          <p className="mt-2">Não coletamos dados sensíveis e não exigimos cadastro para navegar.</p>
        </Secao>

        <Secao titulo="2. Como usamos">
          <ul className="list-disc space-y-1 pl-5">
            <li>Operar e melhorar o site e o comparador de preços;</li>
            <li>Personalizar ofertas e, se você optar, enviar avisos de promoções;</li>
            <li>Medir audiência e desempenho (analytics);</li>
            <li>Prevenir abuso e garantir a segurança.</li>
          </ul>
        </Secao>

        <Secao titulo="3. Cookies e analytics">
          <p>
            Usamos cookies e ferramentas de medição para entender como o site é utilizado — entre elas o
            <strong className="text-zinc-200"> Microsoft Clarity</strong> e o nosso analytics próprio. Esses dados são
            usados de forma agregada e ajudam a melhorar a experiência. Você pode bloquear cookies no seu navegador.
          </p>
        </Secao>

        <Secao titulo="4. Compartilhamento">
          <p>
            <strong className="text-zinc-200">Não vendemos seus dados.</strong> Compartilhamos o mínimo necessário com
            provedores que operam a plataforma (ex.: Supabase, Vercel) e, quando você clica em “Ir à loja”, você é
            direcionado ao site da loja/rede de afiliados — momento em que passam a valer as políticas dessas empresas.
          </p>
        </Secao>

        <Secao titulo="5. Afiliados">
          <p>
            O PromoDetec participa de programas de afiliados. Podemos receber comissão quando você compra por meio dos
            nossos links — <strong className="text-zinc-200">sem custo extra pra você</strong>. O preço e o histórico
            exibidos são os mesmos pra todo mundo — mas, entre ofertas equivalentes, lojas parceiras podem aparecer em
            posição de destaque na ordenação.
          </p>
        </Secao>

        <Secao titulo="6. Seus direitos (LGPD)">
          <p>Você pode, a qualquer momento, solicitar:</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Acesso aos seus dados e confirmação de tratamento;</li>
            <li>Correção de dados incompletos ou desatualizados;</li>
            <li>Exclusão ou anonimização dos seus dados;</li>
            <li>Revogação do consentimento e encerramento da conta.</li>
          </ul>
          <p className="mt-2">
            Para exercer esses direitos, escreva para{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-2 hover:underline">{SUPPORT_EMAIL}</a>.
          </p>
        </Secao>

        <Secao titulo="7. Retenção">
          <p>
            Mantemos os dados apenas pelo tempo necessário às finalidades acima ou enquanto a sua conta existir.
            Ao encerrar a conta, os dados pessoais são removidos ou anonimizados.
          </p>
        </Secao>

        <Secao titulo="8. Contato">
          <p>
            Dúvidas sobre privacidade?{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand-2 hover:underline">{SUPPORT_EMAIL}</a>.
          </p>
        </Secao>
      </div>
    </main>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-base font-semibold text-zinc-100">{titulo}</h2>
      {children}
    </section>
  );
}
