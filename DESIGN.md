---
name: PromoDetec
description: Orientação clara para encontrar produtos, comparar preços e escolher a loja.
colors:
  brand: "rgb(27 101 73)"
  brand-deep: "rgb(22 75 53)"
  lime: "rgb(217 239 185)"
  paper: "rgb(246 247 243)"
  surface: "#ffffff"
  surface-soft: "rgb(237 241 232)"
  surface-over: "#e5ecdf"
  ink: "rgb(32 55 45)"
  muted: "rgb(82 101 91)"
  line: "rgb(219 227 215)"
  positive: "#1a7045"
  warning: "#865b13"
  danger: "#b33c3c"
  fit: "#a64350"
  eletro: "#825917"
  tool: "#285d96"
  gadget: "#28685f"
  parfum: "#7a4a78"
  campaign: "rgb(23 34 29)"
  black-friday-paper: "rgb(247 248 244)"
  black-friday-ink: "rgb(24 33 29)"
  black-friday-lime: "rgb(243 221 89)"
  black-friday-campaign: "rgb(16 20 18)"
  cyber-monday-paper: "rgb(243 246 251)"
  cyber-monday-surface-soft: "rgb(231 238 248)"
  cyber-monday-ink: "rgb(24 42 64)"
  cyber-monday-line: "rgb(211 222 237)"
  cyber-monday-muted: "rgb(73 92 117)"
  cyber-monday-brand: "rgb(38 74 130)"
  cyber-monday-brand-deep: "rgb(26 52 94)"
  cyber-monday-lime: "rgb(198 221 255)"
  cyber-monday-campaign: "rgb(18 35 58)"
  esquenta-natal-paper: "rgb(248 247 241)"
  esquenta-natal-surface-soft: "rgb(239 241 230)"
  esquenta-natal-ink: "rgb(29 52 40)"
  esquenta-natal-line: "rgb(222 225 208)"
  esquenta-natal-brand: "rgb(27 91 65)"
  esquenta-natal-lime: "rgb(241 222 169)"
  esquenta-natal-campaign: "rgb(30 61 45)"
  natal-paper: "rgb(249 246 242)"
  natal-surface-soft: "rgb(245 235 231)"
  natal-ink: "rgb(67 34 35)"
  natal-line: "rgb(230 216 208)"
  natal-muted: "rgb(108 83 78)"
  natal-brand: "rgb(141 37 44)"
  natal-brand-deep: "rgb(105 27 33)"
  natal-lime: "rgb(243 220 164)"
  natal-campaign: "rgb(83 31 36)"
typography:
  campaign-display:
    fontFamily: "var(--font-display), var(--font-sans), sans-serif"
    fontSize: "clamp(2.75rem, 4.1vw, 3.625rem)"
    fontWeight: 750
    lineHeight: 0.99
    letterSpacing: "-0.035em"
  campaign-display-mobile:
    fontFamily: "var(--font-display), var(--font-sans), sans-serif"
    fontSize: "clamp(1.875rem, 7.5vw, 2.5rem)"
    fontWeight: 750
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  price:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontSize: "clamp(1.35rem, 2.2vw, 1.85rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "var(--font-display), var(--font-sans), sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: "2.25rem"
    letterSpacing: "-0.025em"
  title:
    fontFamily: "var(--font-display), var(--font-sans), sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: "2rem"
    letterSpacing: "-0.025em"
  body:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontSize: "0.875rem"
    lineHeight: "1.5rem"
  label:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontSize: "0.75rem"
    lineHeight: "1rem"
rounded:
  md: "0.625rem"
  lg: "0.75rem"
  xl: "0.875rem"
  2xl: "1rem"
  full: "9999px"
spacing:
  2: "0.5rem"
  3: "0.75rem"
  4: "1rem"
  5: "1.25rem"
  6: "1.5rem"
  8: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    height: "44px"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.brand-deep}"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    height: "44px"
    padding: "0 16px"
  button-ghost:
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    height: "44px"
    padding: "0 16px"
  button-subtle:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    height: "44px"
    padding: "0 16px"
  button-danger:
    backgroundColor: "rgb(179 60 60 / 0.9)"
    textColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    height: "44px"
    padding: "0 16px"
  input:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    height: "40px"
    padding: "0 14px"
  navigation-link:
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
  category-chip:
    textColor: "{colors.muted}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.2xl}"
  campaign-hero:
    backgroundColor: "{colors.campaign}"
    textColor: "{colors.surface}"
    rounded: "{rounded.2xl}"
    padding: "24px 32px"
  campaign-action:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  card-store-action:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  card-save:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.brand}"
    rounded: "{rounded.full}"
    height: "44px"
    width: "44px"
  footer:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
  footer-action:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
---

# Design System: PromoDetec

## Overview

**Creative North Star: "Sinalização de metrô traduzida para catálogo"**

Papel claro, tinta verde profunda e sinais pequenos orientam a leitura. Geist mantém títulos, navegação e dados na mesma família. A identidade aparece no contraste, nas setas e nas categorias; imagens reais dos produtos ocupam áreas brancas, com espaço para reconhecer o objeto.

A composição combina áreas abertas com módulos de dados compactos. A hierarquia dá prioridade a produto, preço, loja e atualização. Nome, logo existente e português brasileiro permanecem os compromissos de marca. Este registro mescla o sistema confirmado com a implementação e as capturas locais de 31/10/2026. A campanha “Black em evidência” aplica uma variação comercial à identidade existente; não redefine a marca. Não atesta publicação ou melhoria de CPU em produção.

**Key Characteristics:**
- Base clara com superfícies brancas e divisórias suaves.
- Verde para ações, foco e comparação, com substituições sazonais nomeadas e cores discretas para categorias.
- Uma família tipográfica, hierarquia por escala e peso.
- Fotografias de catálogo contidas, preço destacado e origem próxima.
- Estados e expansão explícitos; movimento curto de resposta.

## Colors

A paleta combina neutros levemente verdes com acentos funcionais contidos. Os valores normativos estão no frontmatter; as chaves abaixo correspondem a esses tokens.

### Primary
- **Verde de orientação — brand:** ações principais, links, busca e foco.
- **Verde profundo — brand-deep:** hover de ação principal e links secundários.
- **Verde claro — lime:** seleção de texto, apoio ao foco da busca e painéis de comparação; no rodapé, marca, ação e foco.

### Secondary
- **Rosa Fit — fit; ocre Casa — eletro; azul Ferramentas — tool; verde Gadgets — gadget; ameixa Beleza — parfum:** pontos, ícones e filtros de categoria. Tech usa a família brand. O rótulo acompanha a cor.
- **Verde positivo — positive; âmbar de atenção — warning; vermelho de erro — danger:** tendência, histórico e feedback. Os aliases de código `neon` e `ok` resolvem ao verde positivo discreto; o nome legado não define luminosidade.

### Neutral
- **Papel — paper:** fundo de página.
- **Branco — surface:** cabeçalho, fotografias e cards.
- **Papel suave — surface-soft:** campos, ações secundárias e agrupamentos.
- **Papel de apoio — surface-over:** trilho do histórico no card.
- **Tinta — ink:** títulos, valores e texto principal; superfície de encerramento do rodapé compartilhado.
- **Tinta secundária — muted:** origem, data e explicações legíveis.
- **Divisória — line:** contornos e separação entre áreas.

### Named Rules
**The Orientação Rule.** A cor de categoria acompanha texto ou ícone reconhecível; nunca é o único identificador.

**The Encerramento em Tinta Rule.** O rodapé compartilhado encerra a página em tinta, com branco e lime para leitura e ação. O hero sazonal também usa inversão escura; ambas as áreas preservam a base clara do catálogo e acompanham os tokens da fase ativa.

### Variações sazonais

As variáveis RGB de `src/app/globals.css` são normativas. `paper`, `surface-soft`, `ink`, `line`, `muted`, `brand`, `brand-deep`, `lime` e `campaign` correspondem a `--page-rgb`, `--soft-rgb`, `--ink-rgb`, `--line-rgb`, `--muted-rgb`, `--brand-rgb`, `--brand-deep-rgb`, `--accent-rgb` e `--campaign-rgb`. As cores fixas de categoria, status, branco e surface-over não mudam com o calendário.

| Fase | Tokens substituídos pelo prefixo da fase |
| --- | --- |
| Esquenta Black / neutro | Base; campaign é o fundo do hero ativo |
| black-friday | paper, ink, lime, campaign |
| cyber-monday | paper, surface-soft, ink, line, muted, brand, brand-deep, lime, campaign |
| esquenta-natal | paper, surface-soft, ink, line, brand, lime, campaign |
| natal | paper, surface-soft, ink, line, muted, brand, brand-deep, lime, campaign |

Cada nome da tabela resolve ao token `fase-nome` no frontmatter; propriedades omitidas herdam a base. As substituições alcançam também foco, ações e o rodapé compartilhado, sem mudar sua estrutura. Não há nova família de cores por componente.

**The Fase Coerente Rule.** Faixa, hero e controles compartilham a mesma fase; o catálogo continua branco e as cores de categoria mantêm seus rótulos.

## Typography

**Display Font:** Geist Sans do pacote `geist/font/sans`, exposta por `--font-display`.
**Body Font:** a mesma Geist Sans, exposta por `--font-sans`, com fallback system-ui/sans-serif.

**Character:** títulos compactos e sem ornamentação; textos de apoio mais leves. As classes chamadas “mono” nos metadados mantêm a família sans e ativam números tabulares, sem exigir uma segunda família.

### Hierarchy
- **Headline:** títulos de seção crescem de title para headline a partir de sm; a chamada do comparador chega a 36px.
- **Title:** títulos de prateleira e áreas de navegação, com peso semibold; autenticação e detalhe também usam 24px, em bold.
- **Body:** descrições e controles em 14px; a introdução da busca usa 16px/28px. Descrições de prateleira têm largura máxima de prosa.
- **Label:** origem, data e ações compactas em 12px; valores auxiliares do histórico usam 11px. Metadados herdados de detalhe chegam a 10px e não estabelecem o tamanho de novos textos essenciais.
- **Preço:** cards usam o token price, bold e números tabulares; referência riscada, loja e data são subordinadas. O detalhe conserva sua própria hierarquia, sem pressupor cobertura global da classe price.
- **Campanha:** campaign-display no desktop; campaign-display-mobile abaixo de 768px. A missão usa 24px/1.15 e peso 650, passando a 17px/1.25 no celular. Sua copy usa 14px/1.65, máximo 64ch, e 13px/1.5 no celular. São papéis da abertura sazonal, não tamanhos globais de títulos.
- **Card compacto:** título de 13px/20px em mobile e 14px/20px em sm, peso 500, limitado a duas linhas; metadados em 11px/16px e mínimo/máximo em 10px/16px. Essa densidade descreve os cards existentes e não estabelece tamanho para novos textos essenciais.

### Named Rules
**The Números Comparáveis Rule.** Nas vitrines, preços usam números tabulares; loja e data permanecem próximos ao valor que qualificam.

## Layout

Home, cabeçalho, rodapé e ofertas compartilham contêiner central de até 1400px. Recuos laterais passam de 16px para 24px em sm e 40px em lg. O detalhe usa contêiner mais estreito, até 1152px, com recuos 16/24/32px. Esses dois contextos coexistem.

O ritmo parte de 4px, com gaps recorrentes de 8/12/16/24/32px. Prateleiras usam 44px de respiro vertical, reduzido a 32px abaixo de 640px. Divisórias horizontais marcam a progressão do catálogo. A home abre com hero sazonal: campanha e missão lado a lado a partir de 768px, em proporção 1:1.05 e gap de 48px. Abaixo disso, empilham com gap de 14px. Padding de 24px/32px passa a 20px no celular. Busca e categorias precedem a grade; nenhum produto isolado antecede a primeira vitrine. A primeira prateleira usa respiro de 24px/44px, reduzido a 20px/32px abaixo de 768px.

As prateleiras mostram uma coluna abaixo de 360px, duas a partir de 360px e quatro em lg. Categorias da home podem rolar horizontalmente; filtros de catálogo quebram em linhas dentro do painel. Abaixo de lg, o painel de filtros começa recolhido e mantém o resumo da seleção visível; o botão anuncia expansão. Em desktop, o painel fica visível. O detalhe reorganiza KPIs de duas para quatro colunas em md e posiciona a compra ao lado do histórico em lg.

Breakpoints observados: 360px (grade e marca compacta), sm 640px, md 768px e lg 1024px. Não reduzir todos os componentes a uma única grade ou largura.

O rodapé usa três áreas em lg: marca/ação, navegação com dois grupos e atendimento/privacidade, cada área ocupando quatro das doze colunas. Entre sm e lg, marca e navegação ficam lado a lado; atendimento e privacidade compartilham uma linha própria. Abaixo de sm, as áreas se empilham e a navegação mantém duas colunas. A faixa legal fica abaixo de uma divisória, alinhada à mesma grade. O respiro vertical principal passa de 32px para 48px em sm e 56px em lg, com gaps de 24px entre colunas e 32/40px entre linhas.

## Elevation & Depth

Cards e painéis são planos em repouso: branco, tonalidade de papel e borda de 1px fazem a separação. As classes herdadas glass/card-grad resolvem a branco sólido; não implicam vidro ou gradiente. O menu móvel aberto é uma exceção contextual: overlay preto a 70% e sombra ampla separam navegação do conteúdo. O cabeçalho fica sticky acima da página.

### Named Rules
**The Superfície Calma Rule.** Cards de catálogo usam contorno e contraste tonal como profundidade; a resposta de hover muda borda ou imagem, sem levantar o card.

## Shapes

Retângulos suavemente arredondados predominam. A configuração redefine lg para 12px, xl para 14px e 2xl/3xl para 16px: não aplicar os valores padrão do Tailwind por memória. Botões usam lg, campos xl, cards 2xl; chips e pequenos pontos usam full. Badges de desconto usam md. O botão circular de salvar tem 44px e pertence ao card; não é a forma de todo botão.

## Components

### Buttons
Firmes e compactos. Primary tem verde e texto branco; outline combina branco e borda suave; ghost deixa a superfície visível; subtle usa papel suave; danger usa vermelho. Alturas do componente: sm 40px, padrão/ícone 44px, lg 48px. Peso 600, cantos lg e ícones com texto quando há espaço.

Hover troca cores, sem deslocamento. Foco do Button usa contorno verde de 2px com offset de 2px; o foco global tem offset de 4px. Disabled reduz opacidade à metade e bloqueia interação. Cards monetizados usam ação sólida de saída “Ver oferta na loja”; os demais usam “Comparar preço” com contorno. O detalhe conserva sua ação de saída para a loja.

### Chips
Filtros têm contorno, formato pill, padding 4px/12px e texto de 12px. Inativos usam tinta secundária; selecionados combinam borda da categoria, fundo a 15% e texto correspondente, além de aria-current. Não confundir chip de filtro com botão primário.

### Cards / Containers
Cards de produto usam branco, borda suave e raio 16px. A fotografia é contida em branco, com altura de 144px, 176px em sm e 192px em lg; não há proporção 4:3 fixa no contêiner. Conteúdo usa 12px laterais/inferiores no celular e 16px em sm, com 4px no topo. Título tem mínimo de 40px e duas linhas; histórico, atualização e ação se alinham abaixo do preço. Desconto somente quando calculável; “Menor preço histórico” depende dos valores disponíveis. Sem histórico suficiente, o card informa condições da loja.

O link do card abre o detalhe; coração e CTA de loja têm camadas próprias. Salvar usa coração SVG em círculo branco com borda, 44px, no canto superior direito; selecionado preenche o coração e colore a borda. Hover usa lime; disabled reduz opacidade. `aria-pressed`, nome acessível e status anunciam resultado. O radar salva neste navegador, com limite de 30 ofertas, e informa erro de armazenamento; não exige login para essa ação.

Fotografias vêm de Produto.imagemUrl e CDNs das lojas; a campanha não introduz novos rasters. Logo e ícones raster preexistentes conservam sua origem; assets históricos não referenciados não representam o sistema atual.

### Inputs / Fields
O Input compartilhado tem fundo de papel suave, altura 40px, padding horizontal 14px e raio xl. Foco combina borda verde a 60% e anel de 2px a 20%. A busca da home é outra composição: casca branca, campo transparente e ação sólida; focus-within aplica borda verde e anel lime de 3px.

Formulários de autenticação têm rótulos persistentes acima dos campos e largura máxima 384px. Placeholders exemplificam conteúdo; não substituem rótulo. Feedback usa texto e região status para sucesso ou alert para erro, além de cor e contorno. A busca possui rótulo acessível e nome explícito no botão compacto.

### Navigation
Cabeçalho branco com borda inferior, altura mínima 68px no celular e 76px em sm, além da faixa de campanha de no mínimo 44px, e logo existente. Links de desktop são de 14px e aparecem em lg; hover usa fundo suave e tinta verde profunda. Categorias abrem painel por hover ou foco interno. No celular, botão de 44px abre navegação abaixo do cabeçalho; categorias se expandem com chevron e estado anunciado. Setas e símbolos da composição usam Lucide/SVG, sem emojis decorativos.

### Resposta e movimento
Mudanças de cor duram 150–200ms; a imagem de produto cresce apenas para 1.035 em 300ms com curva `cubic-bezier(.16,1,.3,1)`. Foco e expansão são estados visíveis. O stylesheet reduz animações/transições a .01ms quando prefers-reduced-motion está ativo. A descoberta não depende de movimento automático. A área do gráfico de histórico tem animação desativada (`isAnimationActive={false}`); a curva não percorre preços intermediários durante a captura ou abertura.

### Campanha sincronizada
Hero escuro, título pesado com acento e missão literal; faixa usa acento com texto tinta. A partir de sm, o hero inclui frase da campanha e ação para #achados; no celular ficam a missão e a busca, enquanto a faixa mantém a ação “Ver ofertas”. Em estado neutro, não há faixa nem título comercial; o painel passa a surface-soft e a missão é h1.

O calendário em `src/lib/seasonal.ts` usa America/Sao_Paulo e janelas inclusivas de 2026: Esquenta Black de 30/10 a 26/11; Black Friday de 27 a 29/11; Cyber Monday em 30/11; Esquenta Natal de 01 a 13/12; Natal de 14 a 25/12; neutro em 26/12 e sem repetição automática em 2027. Override de preview é explícito. Bootstrap aplica a pele antes da pintura mesmo com HTML em cache; o provider sincroniza copy, faixa, cores e theme-color na montagem, a cada minuto em aba visível, no retorno à aba e em pageshow. Somente IDs e datas públicos entram no bootstrap. São comportamentos verificados no código; fases futuras não foram capturadas no navegador.

Evidência da extensão sazonal: fontes CSS, layout, componentes de campanha/card/prateleira e calendário; capturas em `.impeccable/review/black-evidencia/`. `layout.json` mede home em 1440/768/390/320 CSS, 24 cards únicos, sem overflow horizontal e sem imagens visíveis quebradas. Os JPEGs podem estar reduzidos proporcionalmente; medidas vêm do recibo/CSS. Capturas de ofertas, produto, comparação e login complementam o conjunto; comparação cobre indisponibilidade, não resultado carregado. As recapturas do produto acompanham o gráfico sem animação. A referência crítica é a opção A aprovada em `reports/seasonal-preview-2026-10-30/`, não uma comp métrica nem um QUALITY BAR externo.

### Rodapé compartilhado
Base plana em tinta, sem sombra ou cards decorativos. Marca em 30px/36px semibold, com terminação lime; lema em body e branco a 70%. A chamada usa 24px/30px medium e cresce para 30px/37.5px em sm. Títulos dos grupos e links usam body; os títulos são semibold e os links usam branco a 75%. O texto legal usa label com entrelinha de 20px, passando a 24px em sm, e branco a 70%. Divisórias usam branco a 15%.

A ação lime tem cantos lg, texto tinta e seta SVG de 16px; hover troca o fundo para branco. Links clareiam para branco e ganham sublinhado no hover. Preferências de privacidade permanece um botão sublinhado e reabre o consentimento existente. Todos os alvos têm altura mínima de 44px; foco usa contorno lime de 2px com offset de 4px. O endereço de atendimento pode quebrar para caber em telas estreitas. Nome, lema, chamada e texto legal preservam o conteúdo existente; links internos mantêm prefetch desativado.

Evidência desta extensão: `src/components/layout/footer.tsx`, `PrivacySettings` em `src/components/analytics/cookie-consent.tsx` e capturas de `/contato` em `.impeccable/review/footer/`, nas larguras 1920/1024/768/390/320. `layout.json` registra alvos mínimos de 44px. Os JPEGs foram reduzidos proporcionalmente pelo capturador; medidas vêm do CSS/recibo, não de pixels do JPEG. A revisão desta extensão não certifica outros componentes nem publicação.

## Do's and Don'ts

### Do:
- **Do** usar papel claro, branco e tinta verde como base das novas superfícies.
- **Do** manter fotografia contida, preço, loja e atualização legíveis na decisão.
- **Do** preservar rótulos acessíveis, foco visível e estados anunciados nos controles.
- **Do** reutilizar o mapa de categorias com rótulos e símbolos Lucide/SVG.
- **Do** distinguir informação ausente, preço antigo e falha de leitura com texto explícito.

### Don't:
- **Don't** usar brilho neon ou sombras coloridas herdadas como identidade das novas superfícies.
- **Don't** transformar metadados compactos em tamanho padrão para instruções ou decisões.
- **Don't** usar cor sozinha para indicar categoria, erro ou tendência.
- **Don't** inventar fotografias, avaliações, descontos ou selos para preencher a interface.

Não canonizado: glow RGBA e gradientes herdados ainda consumidos por SubcategoriaNav; rótulos uppercase de detalhe/subcategoria como linguagem de títulos; marca Google branca em botão outline branco como solução de ícone. São resíduos/defeitos locais, não regras para novas superfícies. Metadados de 10–11px descrevem a densidade comercial existente, sem legitimar sua adoção como corpo de texto ou instrução. Este registro não certifica todos os estados do repositório, datas futuras no navegador ou publicação.
