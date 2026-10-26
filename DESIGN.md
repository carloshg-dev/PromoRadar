---
name: PromoDetec
description: Orientação clara para encontrar produtos, comparar preços e escolher a loja.
colors:
  brand: "#1b6549"
  brand-deep: "#164b35"
  lime: "#d9efb9"
  paper: "#f6f7f3"
  surface: "#ffffff"
  surface-soft: "#edf1e8"
  surface-over: "#e5ecdf"
  ink: "#20372d"
  muted: "#5b6b61"
  line: "#dbe3d7"
  positive: "#1a7045"
  warning: "#865b13"
  danger: "#b33c3c"
  fit: "#a64350"
  eletro: "#825917"
  tool: "#285d96"
  gadget: "#28685f"
  parfum: "#7a4a78"
typography:
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
---

# Design System: PromoDetec

## Overview

**Creative North Star: "Sinalização de metrô traduzida para catálogo"**

Papel claro, tinta verde profunda e sinais pequenos orientam a leitura. Geist mantém títulos, navegação e dados na mesma família. A identidade aparece no contraste, nas setas e nas categorias; imagens reais dos produtos ocupam áreas brancas, com espaço para reconhecer o objeto.

A composição combina áreas abertas com módulos de dados compactos. A hierarquia dá prioridade a produto, preço, loja e atualização. Nome, logo existente e português brasileiro permanecem os compromissos de marca. Este registro descreve o código e as capturas da prévia local de 26/10/2026; não atesta publicação visual.

**Key Characteristics:**
- Base clara com superfícies brancas e divisórias suaves.
- Verde para ações, foco e comparação; cores discretas para categorias.
- Uma família tipográfica, hierarquia por escala e peso.
- Fotografias de catálogo contidas, preço destacado e origem próxima.
- Estados e expansão explícitos; movimento curto de resposta.

## Colors

A paleta combina neutros levemente verdes com acentos funcionais contidos. Os valores normativos estão no frontmatter; as chaves abaixo correspondem a esses tokens.

### Primary
- **Verde de orientação — brand:** ações principais, links, busca e foco.
- **Verde profundo — brand-deep:** hover de ação principal e links secundários.
- **Verde claro — lime:** seleção de texto, apoio ao foco da busca e painéis de comparação.

### Secondary
- **Rosa Fit — fit; ocre Casa — eletro; azul Ferramentas — tool; verde Gadgets — gadget; ameixa Beleza — parfum:** pontos, ícones e filtros de categoria. Tech usa a família brand. O rótulo acompanha a cor.
- **Verde positivo — positive; âmbar de atenção — warning; vermelho de erro — danger:** tendência, histórico e feedback. Os aliases de código `neon` e `ok` resolvem ao verde positivo discreto; o nome legado não define luminosidade.

### Neutral
- **Papel — paper:** fundo de página.
- **Branco — surface:** cabeçalho, fotografias e cards.
- **Papel suave — surface-soft:** campos, ações secundárias, rodapé e agrupamentos.
- **Papel de apoio — surface-over:** trilho do histórico no card.
- **Tinta — ink:** títulos, valores e texto principal.
- **Tinta secundária — muted:** origem, data e explicações legíveis.
- **Divisória — line:** contornos e separação entre áreas.

### Named Rules
**The Orientação Rule.** A cor de categoria acompanha texto ou ícone reconhecível; nunca é o único identificador.

## Typography

**Display Font:** Geist Sans do pacote `geist/font/sans`, exposta por `--font-display`.
**Body Font:** a mesma Geist Sans, exposta por `--font-sans`, com fallback system-ui/sans-serif.

**Character:** títulos compactos e sem ornamentação; textos de apoio mais leves. As classes chamadas “mono” nos metadados mantêm a família sans e ativam números tabulares, sem exigir uma segunda família.

### Hierarchy
- **Headline:** títulos de seção crescem de title para headline a partir de sm; a chamada do comparador chega a 36px.
- **Title:** títulos de prateleira e áreas de navegação, com peso semibold; autenticação e detalhe também usam 24px, em bold.
- **Body:** descrições e controles em 14px; a introdução da busca usa 16px/28px. Descrições de prateleira têm largura máxima de prosa.
- **Label:** origem, data e ações compactas em 12px; valores auxiliares do histórico usam 11px. Metadados herdados de detalhe chegam a 10px e não estabelecem o tamanho de novos textos essenciais.
- **Preço:** em cards, `clamp(1.2rem, 2vw, 1.65rem)` semibold, entrelinha 1 e tracking negativo; o destaque usa 30px/36px, crescendo para 36px/40px. A classe price ativa números tabulares e tracking de -0.025em. Nem todo preço do detalhe usa essa classe: não pressupor cobertura global.
- **Título da descoberta:** expressão específica da home, com `clamp(2.65rem, 4.9vw, 4.8rem)`, peso 600, entrelinha 1.02 e tracking -0.035em; não é tamanho padrão de outras páginas.

### Named Rules
**The Números Comparáveis Rule.** Nas vitrines, preços usam números tabulares; loja e data permanecem próximos ao valor que qualificam.

## Layout

Home, cabeçalho, rodapé e ofertas compartilham contêiner central de até 1400px. Recuos laterais passam de 16px para 24px em sm e 40px em lg. O detalhe usa contêiner mais estreito, até 1152px, com recuos 16/24/32px. Esses dois contextos coexistem.

O ritmo parte de 4px, com gaps recorrentes de 8/12/16/24/32px. Prateleiras usam 44px de respiro vertical, reduzido a 32px abaixo de 640px. Divisórias horizontais marcam a progressão do catálogo. A home abre em duas colunas somente em lg; em telas menores a busca precede o destaque.

As prateleiras mostram uma coluna abaixo de 360px, duas a partir de 360px e quatro em lg. Categorias da home podem rolar horizontalmente; filtros de catálogo quebram em linhas dentro do painel. Abaixo de lg, o painel de filtros começa recolhido e mantém o resumo da seleção visível; o botão anuncia expansão. Em desktop, o painel fica visível. O detalhe reorganiza KPIs de duas para quatro colunas em md e posiciona a compra ao lado do histórico em lg.

Breakpoints observados: 360px (grade e marca compacta), sm 640px, md 768px e lg 1024px. Não reduzir todos os componentes a uma única grade ou largura.

## Elevation & Depth

Cards e painéis são planos em repouso: branco, tonalidade de papel e borda de 1px fazem a separação. As classes herdadas glass/card-grad resolvem a branco sólido; não implicam vidro ou gradiente. O menu móvel aberto é uma exceção contextual: overlay preto a 70% e sombra ampla separam navegação do conteúdo. O cabeçalho fica sticky acima da página.

### Named Rules
**The Superfície Calma Rule.** Cards de catálogo usam contorno e contraste tonal como profundidade; a resposta de hover muda borda ou imagem, sem levantar o card.

## Shapes

Retângulos suavemente arredondados predominam. A configuração redefine lg para 12px, xl para 14px e 2xl/3xl para 16px: não aplicar os valores padrão do Tailwind por memória. Botões usam lg, campos xl, cards 2xl; chips e pequenos pontos usam full. Badges de desconto usam md. O círculo com seta do destaque é um dispositivo de ação específico, não a forma de todo botão.

## Components

### Buttons
Firmes e compactos. Primary tem verde e texto branco; outline combina branco e borda suave; ghost deixa a superfície visível; subtle usa papel suave; danger usa vermelho. Alturas do componente: sm 40px, padrão/ícone 44px, lg 48px. Peso 600, cantos lg e ícones com texto quando há espaço.

Hover troca cores, sem deslocamento. Foco do Button usa contorno verde de 2px com offset de 2px; o foco global tem offset de 4px. Disabled reduz opacidade à metade e bloqueia interação. CTAs de card usam papel suave com texto verde; o detalhe usa uma ação sólida de saída para a loja.

### Chips
Filtros têm contorno, formato pill, padding 4px/12px e texto de 12px. Inativos usam tinta secundária; selecionados combinam borda da categoria, fundo a 15% e texto correspondente, além de aria-current. Não confundir chip de filtro com botão primário.

### Cards / Containers
Cards de produto usam branco, borda suave e raio 16px. Imagem 4:3 contida em branco, sem recortar o produto; conteúdo com 16px de padding e preço alinhado após o título. Título limitado a duas linhas; a área de preço e condições se alinha na parte inferior. Origem, desconto quando calculável e atualização acompanham o produto. Histórico só aparece quando há dados suficientes.

O destaque da home usa painel tonal e fotografia branca; seu tom específico não vira uma nova família de tokens. Fotografias vêm de Produto.imagemUrl e CDNs das lojas; não são ilustrações produzidas para a identidade. Os rasters locais ativos preservam origem preexistente; assets históricos não referenciados não representam o sistema atual.

### Inputs / Fields
O Input compartilhado tem fundo de papel suave, altura 40px, padding horizontal 14px e raio xl. Foco combina borda verde a 60% e anel de 2px a 20%. A busca da home é outra composição: casca branca, campo transparente e ação sólida; focus-within aplica borda verde e anel lime de 3px.

Formulários de autenticação têm rótulos persistentes acima dos campos e largura máxima 384px. Placeholders exemplificam conteúdo; não substituem rótulo. Feedback usa texto e região status para sucesso ou alert para erro, além de cor e contorno. A busca possui rótulo acessível e nome explícito no botão compacto.

### Navigation
Cabeçalho branco com borda inferior, altura mínima 76px e logo existente. Links de desktop são de 14px e aparecem em lg; hover usa fundo suave e tinta verde profunda. Categorias abrem painel por hover ou foco interno. No celular, botão de 44px abre navegação abaixo do cabeçalho; categorias se expandem com chevron e estado anunciado. Setas e símbolos da composição usam Lucide/SVG, sem emojis decorativos.

### Resposta e movimento
Mudanças de cor duram 150–200ms; a imagem de produto cresce apenas para 1.035 em 300ms com curva `cubic-bezier(.16,1,.3,1)`. Foco e expansão são estados visíveis. O stylesheet reduz animações/transições a .01ms quando prefers-reduced-motion está ativo. A descoberta não depende de movimento automático.

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

Não canonizado: glow RGBA e gradientes herdados ainda consumidos por SubcategoriaNav; rótulos uppercase de detalhe/subcategoria como linguagem de títulos; marca Google branca em botão outline branco como solução de ícone. São resíduos/defeitos locais, não regras para novas superfícies. A revisão final fornecida cobre quatro correções específicas, não uma certificação de todos os estados do repositório.
