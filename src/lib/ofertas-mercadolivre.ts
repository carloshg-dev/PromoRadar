import { ehLinkMonetizado } from "@/lib/afiliados";

/**
 * Showcase Mercado Livre — links de afiliado CURADOS, gerados 1-a-1 no painel do
 * ML (meli.la). Espelha o padrão da Carrefour em ofertas-verificadas.ts: o dono
 * cola aqui os links que cunha no painel e CADA UM vira um card monetizado na home.
 *
 * Por que lista manual? O código meli.la é OPACO (gerado no servidor do ML) — não
 * dá pra computar a partir da URL do produto. Enquanto a API ML Afiliados
 * (Linkbuilder) não libera (só após as 1as vendas), ESTA é a via de monetização do
 * ML. O resto do catálogo que o robô raspa segue no modelo "Dois Níveis" (CTA
 * "Comparar preço", sem clique de graça).
 *
 * ┌─ COMO PREENCHER (copie um bloco { ... } e ajuste) ─────────────────────────┐
 * │ titulo    — nome do produto.                                  (OBRIGATÓRIO) │
 * │ url       — o link meli.la do painel.                          (OBRIGATÓRIO) │
 * │ cat       — ícone: notebook|celular|audio|smartwatch|tablet|gadget|         │
 * │             perfume|eletro|games|fit|casa|ferramenta.            (opcional)  │
 * │ imagemUrl — foto do produto; sem ela, mostra um ícone.          (opcional)  │
 * │ preco     — preço atual em R$ (ex.: 199.9); sem ele, mostra "Preço no       │
 * │             anúncio" (evita preço velho).                       (opcional)  │
 * │ precoDe   — preço "de" pra riscar (ex.: 279.9).                 (opcional)  │
 * │ selo      — etiqueta curta: "Frete grátis", "12% OFF"...        (opcional)  │
 * │ ativo     — false esconde o item sem apagar.       (opcional, default true) │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * Regra de segurança: só entra no ar se a `url` for de afiliado (meli.la). Se você
 * colar um link cru do ML por engano, ele é ignorado (não damos clique de graça).
 */
export interface OfertaML {
  titulo: string;
  url: string;
  cat?: string;
  imagemUrl?: string;
  preco?: number;
  precoDe?: number;
  selo?: string;
  ativo?: boolean;
}

export const OFERTAS_MERCADOLIVRE: ReadonlyArray<OfertaML> = [
  // ⚠️ EXEMPLOS (os links são reais e seus, mas título/preço/foto são PLACEHOLDER
  //    só pra você ver o formato). Apague estes 2 e cole os seus 25 reais abaixo.
  {
    titulo: "EXEMPLO — troque pelo nome real do produto",
    url: "https://meli.la/2MTTvCN",
    cat: "gadget",
    preco: 199.9,
    precoDe: 279.9,
    selo: "Frete grátis",
  },
  {
    titulo: "EXEMPLO 2 — cole aqui outro produto do painel ML",
    url: "https://meli.la/2rWqsZw",
    cat: "celular",
    // sem `preco`: o card mostra "Preço no anúncio" (zero risco de preço velho)
  },
  // ↑↑ apague os exemplos · ↓↓ cole os reais no mesmo formato
];

/**
 * Só os itens ATIVOS e que são DE FATO link de afiliado (guarda contra colar um
 * link cru do ML por engano). Fonte da verdade do "é afiliado?" = ehLinkMonetizado.
 */
export function ofertasMLAtivas(): OfertaML[] {
  return OFERTAS_MERCADOLIVRE.filter((o) => o.ativo !== false && ehLinkMonetizado(o.url));
}
