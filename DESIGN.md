---
name: PromoDetec
description: Shop escuro de achados, com produto, preço e origem junto da decisão.
colors:
  brand: "rgb(255 122 0)"
  brand-deep: "rgb(255 145 31)"
  lime: "rgb(255 218 114)"
  page: "rgb(16 17 20)"
  surface-soft: "rgb(35 37 42)"
  surface: "rgb(26 28 32)"
  ink: "rgb(246 246 247)"
  muted: "rgb(176 179 188)"
  line: "rgb(58 60 68)"
  campaign: "rgb(22 23 27)"
  on-brand: "rgb(25 18 15)"
  white: "#ffffff"
  photo-ink: "#191a1e"
  coupon-ink: "#201b11"
  footer: "#111316"
  danger: "#b33c3c"
typography:
  display:
    fontFamily: "var(--font-display), var(--font-sans), sans-serif"
    fontSize: "clamp(2rem, 3.7vw, 3.5rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "var(--font-display), var(--font-sans), sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: "1.25rem"
  body:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontSize: "0.875rem"
    lineHeight: "1.5rem"
  label:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontSize: "0.75rem"
    lineHeight: "1rem"
  price:
    fontFamily: "var(--font-sans), system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 2vw, 1.6rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.025em"
rounded:
  base: "0.5rem"
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
    textColor: "{colors.on-brand}"
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
    textColor: "{colors.white}"
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
    height: "44px"
  budget-chip:
    textColor: "{colors.ink}"
    rounded: "{rounded.base}"
    padding: "0.45rem 1rem"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
  quick-view:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.2xl}"
    width: "min(680px, calc(100vw - 2rem))"
  coupon-action:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.coupon-ink}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "44px"
---

# Design System: PromoDetec

## Overview

**Creative North Star: "Feira digital noturna"**

Feira digital noturna: carvão e grafite sustentam um catálogo denso, laranja vivo conduz ações e amarelo sinaliza cupons. Fotografias reais sobre branco tornam o objeto reconhecível. Geist une títulos, controles e números; produto, preço, loja e coleta aparecem perto da decisão.

Este registro atualiza o sistema claro histórico para o Shop escuro aprovado pelo proprietário em 01/11/2026, incluindo o laranja vivo aprovado. Nome, logo existente, português brasileiro, missão e texto legal permanecem. Descreve o candidato local conferido, não uma publicação. Os seletores sazonais Esquenta Black/Black Friday ativam estes valores; outras fases ainda existem no código, mas não são o padrão visual desta documentação.

**Key Characteristics:**
- Carvão e grafite, com ações laranja e cupons amarelos.
- Fotografias reais contidas em campos brancos.
- Catálogo denso, preço tabular e origem identificada.
- Trilhos horizontais no celular e revelações curtas dispensáveis.

## Colors

Acentos comerciais quentes sobre neutros frios; os valores normativos estão no frontmatter, preservados no formato RGB das variáveis de origem.

### Primary
- **Laranja de ação — brand:** ações, preços na consulta rápida, links, categorias e foco. Cor aprovada pelo proprietário, equivalente a #FF7A00.
- **Laranja de resposta — brand-deep:** hover das ações e links.

### Secondary
- **Amarelo de cupom — lime:** cupons, descontos de referência, faixa de campanha e ação do rodapé; o alias legado não significa verde neste mundo.
- **Vermelho de erro — danger:** variante destrutiva da biblioteca compartilhada; não é acento comercial.

### Neutral
- **Carvão — page:** fundo; **grafite — surface:** cards, cabeçalho e modal; **grafite elevado — surface-soft:** campos e estados secundários.
- **Tinta clara — ink:** texto principal; **cinza de leitura — muted:** origem e informações auxiliares; **divisória — line:** contornos e separadores.
- **Campanha — campaign:** hero baixo. **Rodapé — footer:** fechamento escuro plano.
- **Branco — white:** fotografia e logos. **Tinta de fotografia — photo-ink:** texto nos módulos brancos. **Tinta de ação — on-brand** e **tinta de cupom — coupon-ink:** contraste escuro sobre os dois acentos.

### Named Rules

**The Ação e Cupom Rule.** Laranja orienta ações e foco; amarelo destaca cupons e a faixa de campanha. A fotografia conserva seu campo branco.

Os seletores sazonais continuam na folha global; este documento não determina a aparência futura de Cyber Monday ou Natal. Cores fixas de categorias/lojas e feedback existentes em Tailwind são auxiliares, não substituem a dupla comercial do Shop.

## Typography

**Display Font:** Geist Sans, via `--font-display` e `--font-geist-sans`, com sans-serif de fallback.
**Body Font:** Geist Sans, via `--font-sans`, com system-ui/sans-serif de fallback.

**Character:** uma família, pesos claros e títulos compactos. O display usa a fonte Geist empacotada; system-ui é apenas fallback.

### Hierarchy
- **Display:** título comercial pesado; em até 767px usa 2rem. Peso, tracking e escala desktop estão no frontmatter.
- **Headline:** prateleiras usam 1.35rem/1.25 no celular, passando ao token headline em sm. Seções auxiliares também usam 1.5rem; títulos do modal usam 1.25rem/1.375 e peso 600.
- **Title:** nome de produto em duas linhas; 13px/20px no celular e o token title a partir de sm, com altura mínima de 2.5rem.
- **Body:** explicações e condições; o hero tem cópia compacta de 12px/1.55 e limite de 65ch, sem generalizar essa exceção para instruções.
- **Label:** controles auxiliares e apoio. Metadados de 11px existem nos cards/logos; não definem o corpo de novas telas.
- **Price:** números tabulares com tracking compacto; no modal sobe a 1.875rem e ganha brand. Hero usa 1rem no celular e 1.15rem no desktop.

### Named Rules

**The Preço Legível Rule.** Valores monetários usam números tabulares e tracking compacto; loja e coleta continuam junto da decisão, inclusive na consulta rápida.

## Layout

Contêiner compartilhado com máximo de 1540px. Home usa laterais de 12px, 24px em sm e 40px em lg; cabeçalho/rodapé partem de 16px. Espaçamento recorrente de 8/12/16/20/24/32px organiza controles e módulos.

Grade do feed: duas colunas com gap de .65rem; três em 640px com gap de 1rem; cinco em 1024px; seis em 1280px. As prateleiras seguem fluxo vertical; a principal tem padding de 1.5rem/2.75rem no desktop e 1.25rem/2rem no móvel. Prateleiras comuns usam 2.75rem por eixo vertical, reduzindo para 2rem abaixo de 640px.

O hero usa duas áreas (1.15fr/1fr), gap de 2rem e padding de 1.5rem/2rem. Até 767px empilha texto e fotos, com padding de 1.1rem/0. A amostra preserva três colunas fotográficas; imagens medem 104px de altura no desktop e 76px no móvel. Essa composição é a implementação da home, não uma obrigação para todas as telas.

Carrossel entre hero e categorias: rolagem nativa com snap de proximidade, itens de 112px (104px abaixo de 640px), logos de 42px e controles de 44px. No móvel, rótulo/controles ficam acima do trilho. Categorias e faixas de orçamento também rolam horizontalmente. Não há autoplay.

Cabeçalho sticky: linha principal de 68px, 76px em sm; busca inline aparece em md, navegação expandida em lg. Busca da home aparece abaixo de md. O rodapé passa de grupos empilhados para duas colunas em sm e doze trilhas em lg.

## Elevation & Depth

Predomina separação por tom e borda sólida. Cards não têm sombra de repouso. Fotografias brancas oferecem o contraste material; modais e sugestões ganham sombra preta e são sobreposições reais.

### Shadow Vocabulary
- **Consulta rápida:** `0 20px 70px #0007`; backdrop `#000b`.
- **Sugestão dispensável:** `0 12px 40px #0006`.
- **Busca focada:** `0 0 0 3px rgb(var(--accent-rgb))`, com borda brand; é indicação de foco, não iluminação de marca.

### Named Rules

**The Plano e Revelação Rule.** Cards repousam planos, separados por tom e borda. Sombras pretas ficam nas sobreposições existentes; não se tornam brilho de marca.

Revelações do modal/sugestão duram .24s com `cubic-bezier(.16,1,.3,1)`, translação de 8px e recorte. Foto no hover escala a 1.035 em .3s com a mesma curva. Links transitam cores em .15s; busca em .2s. Movimento reduzido derruba animações/transições a .01ms e torna a rolagem do carrossel imediata.

## Shapes

Retângulos com curvas moderadas: cards, miniaturas do hero e categorias usam 12px; logos, orçamento e controles do carrossel usam 8px; modal e avisos de recuperação usam 16px. A biblioteca Tailwind mantém passos intermediários de 10/14px. Ações usam 12px; fechar/salvar usam círculo. Fotografias usam object-fit contain; os cards recortam overflow. Bordas funcionais usam 1px; logos reservam 2px transparentes que mudam no hover.

## Components

### Buttons
Firmes e compactos. A biblioteca oferece primary, outline, ghost, subtle e danger. Tamanho padrão de 44px, alternativas de 40/48px e ícone quadrado de 44px. Primary usa brand/on-brand, hover brand-deep. Outline mantém superfície e borda line; hover surface-soft e brand a 40%. Ghost revela surface-soft; subtle passa a line. Danger usa 90% da cor no repouso. Disabled reduz opacidade a 50% e bloqueia ponteiro.

Foco global é contorno brand de 2px/offset 4px; Button usa offset de 2px. Ações de cupom/rodapé usam lime/coupon-ink; a ação do rodapé passa a branco no hover. Não confundir estes tratamentos com novas variantes inexistentes.

### Chips
Orçamento em botão contornado de pelo menos 44px, com 8px de raio; hover muda contorno e texto para brand. Descontos de referência usam amarelo e texto escuro, acompanhados da explicação de sua origem; não representam variação histórica.

### Cards / Containers
Card plano com superfície grafite, contorno line e raio de 12px. Campo fotográfico branco com 144px de altura, 160px em sm, imagem contida. Conteúdo tem laterais de 12px, passando a 16px em sm. Título em duas linhas, preço, loja, coleta e condição de histórico permanecem visíveis. Hover do título usa brand; focus-within muda a borda. Falha de foto carregada retira o card; imagem não é fabricada. Ação afiliada segue à loja; alternativa não monetizada oferece comparação.

### Inputs / Fields
Input compartilhado de 40px, superfície suave, raio de 14px e borda line; foco usa borda brand a 60% e anel de 2px brand a 20%. Busca da home usa contêiner grafite e seu próprio focus-within. Busca no cabeçalho combina campo suave com botão laranja. Placeholder usa muted; rótulos acessíveis permanecem presentes.

### Navigation
Cabeçalho grafite, divisórias discretas e nome com terminação laranja. Links de 44px usam texto claro; hover usa superfície suave e brand-deep. Categorias usam SVGs e texto. Carrossel apresenta logo sobre branco e nome abaixo; erro do logo troca a imagem pelo nome, sem inventar marca. Controles têm rótulos e respondem a teclado; trilhos aceitam rolagem direta.

### Consulta rápida e sugestão
Consulta rápida abre um dialog nativo com até 680px e 85dvh, duas colunas em sm e uma no móvel, fotografia branca e conteúdo grafite. Loja, coleta, preço, mínimo disponível e condições aparecem antes da decisão. Escape, fechar e clique no backdrop dispensam o modal; abertura usa dados já carregados.

Sugestão pequena de no máximo 340px aparece após rolagem de 900px, consentimento existente e aba visível, uma vez por sessão; fecha e abre a consulta do mesmo produto. Não impede navegação nem gira produtos automaticamente.

### Recuperação de catálogo e rodapé
Aviso grafite de recuperação distingue falha de carregamento de ausência no filtro. Alternativas identificam a própria loja; o teto curado de até R$300 respeita orçamentos menores e é explicado separadamente do filtro escolhido. Não é prova de que a loja original possui esses itens.

Rodapé plano escuro, texto claro, grupos de links e divisórias brancas a 15%. Marca e ação amarelas; alvos principais de 44px. Preservar missão, atendimento, privacidade e texto legal existentes. O e-mail pode quebrar para caber.

Evidência deste registro: `src/app/globals.css`, `tailwind.config.ts`, layout, home e componentes citados; `.impeccable/review/shop-{1440,1680,820,320}[-top].jpg`, `shop-mobile.jpg`, `shop-quick-view.jpg`, `store-desktop.jpg`, `store-mobile.jpg` e `reports/shop-home-mobile-final-2026-11-01.jpg`. Capturas Chromium em larguras emuladas 320/390/820/1440/1680, não dispositivos físicos. O parecer completo iniciou em fix; `affiliate-verdict.md` marca resolved os quatro ajustes e ship somente desse lote, sem certificar backend, CPU ou produção. O estado atual da publicação está em `docs/PROJECT_STATE.md`. A direção é fixa e aprovada; seed histórica 5badb485 permanece sem recibo independente e não é uma rolagem comprovada.

## Do's and Don'ts

### Do:
- **Do** usar os tokens escuros de Esquenta Black/Black Friday nas novas superfícies deste Shop.
- **Do** manter fotografia real contida, preço, loja e coleta junto da decisão.
- **Do** preservar foco visível, rótulos acessíveis e alternativas identificadas pela loja real.
- **Do** manter trilhos de rolagem nativa e respeitar movimento reduzido.

### Don't:
- **Don't** restabelecer o mundo claro histórico como padrão deste Shop aprovado.
- **Don't** usar borda luminosa ou glow colorido como identidade.
- **Don't** inventar fotografias, desconto, avaliação, selo ou urgência para preencher a interface.
- **Don't** usar somente cor para comunicar categoria, erro ou tendência.

Não canonizado: metadados de 11px e texto compacto de 12px do hero não são padrões para instruções; glow/gradientes e kickers uppercase legados fora deste Shop não são sua linguagem. A base clara anterior e os tokens de fases futuras não recebem autoridade como padrão do Shop escuro. Esses resíduos/exceções não devem ser replicados para legitimar defeitos de legibilidade ou de acabamento.
