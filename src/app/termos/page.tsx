import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const metadata = {
  title: "Termos de Uso",
  description: "Condições de uso do PromoDetec — comparador de preços de fontes públicas.",
};

const CONTATO = "carloshg.designer@gmail.com";

export default function Termos() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[{ label: "Início", href: "/" }, { label: "Termos" }]} />
      <h1 className="mt-3 text-3xl font-bold tracking-tight">Termos de Uso</h1>
      <p className="mt-2 text-xs text-muted">Última atualização: junho de 2026.</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-zinc-300">
        <Secao titulo="1. Aceitação">
          <p>Ao usar o PromoDetec, você concorda com estes Termos e com a nossa{" "}
            <a href="/privacidade" className="text-brand-2 hover:underline">Política de Privacidade</a>.</p>
        </Secao>

        <Secao titulo="2. O que o PromoDetec é (e o que não é)">
          <p>
            O PromoDetec é um <strong className="text-zinc-200">comparador e agregador de ofertas</strong> que reúne
            preços de <strong className="text-zinc-200">fontes públicas</strong> de diversas lojas e os apresenta com
            histórico e o PromoScore. <strong className="text-zinc-200">Não vendemos produtos</strong> nem processamos
            pagamentos: ao escolher uma oferta, você é direcionado ao site oficial da loja, onde a compra acontece.
          </p>
        </Secao>

        <Secao titulo="3. Preços e disponibilidade">
          <p>
            Os preços e a disponibilidade são <strong className="text-zinc-200">da loja</strong> e podem mudar a
            qualquer momento; ofertas são válidas enquanto durarem os estoques. Apesar do nosso esforço, pode haver
            atraso ou divergência entre o valor exibido aqui e o da loja. <strong className="text-zinc-200">Confirme
            sempre o preço final no site da loja antes de comprar.</strong>
          </p>
        </Secao>

        <Secao titulo="4. Afiliados">
          <p>
            Participamos de programas de afiliados e podemos receber comissão por compras feitas via nossos links,
            <strong className="text-zinc-200"> sem custo extra pra você</strong>. Isso não afeta o PromoScore.
          </p>
        </Secao>

        <Secao titulo="5. Contas de usuário">
          <p>
            Alguns recursos exigem cadastro. Você é responsável por manter seus dados de acesso seguros e pelo uso da
            sua conta. Podemos suspender contas que violem estes Termos ou façam uso abusivo da plataforma.
          </p>
        </Secao>

        <Secao titulo="6. Propriedade intelectual">
          <p>
            Marcas, logotipos e nomes de produtos e lojas pertencem aos seus respectivos donos. Imagens e descrições
            de produtos são de domínio público/das lojas, exibidas para fins de comparação e referência.
          </p>
        </Secao>

        <Secao titulo="7. Limitação de responsabilidade">
          <p>
            O PromoDetec é oferecido “como está”, para fins informativos. Não garantimos exatidão absoluta de preços
            nem nos responsabilizamos por decisões de compra, indisponibilidade de produtos ou pela experiência nas
            lojas de terceiros.
          </p>
        </Secao>

        <Secao titulo="8. Alterações">
          <p>Podemos atualizar estes Termos. Mudanças relevantes serão refletidas nesta página, com nova data de atualização.</p>
        </Secao>

        <Secao titulo="9. Lei aplicável e contato">
          <p>
            Estes Termos seguem as leis do <strong className="text-zinc-200">Brasil</strong>. Dúvidas?{" "}
            <a href={`mailto:${CONTATO}`} className="text-brand-2 hover:underline">{CONTATO}</a>.
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
