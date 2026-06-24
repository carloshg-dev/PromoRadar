# 📡 PromoDetec

Plataforma de **inteligência de promoções** de hardware e tecnologia. Não é só um comparador de preços: monitora preços reais, mantém histórico próprio, detecta falsos descontos com o algoritmo proprietário **PromoScore**, e agrega notícias de tecnologia.

- **Produção:** https://promodetec.vercel.app (domínio antigo `promo-radar-mauve.vercel.app` deve redirecionar 301 para cá)
- **Repo:** https://github.com/paulohelon280/PromoRadar
- **Stack:** Next.js 14 (App Router) · TypeScript strict · TailwindCSS · Supabase (Postgres) · Vercel
- **Projeto Supabase:** `sksjukjkxkptresysbno` (região sa-east-1)
- **Auditoria estratégica (segurança, papéis, escala, monetização, parceiros):** [docs/AUDITORIA-ESTRATEGICA.md](docs/AUDITORIA-ESTRATEGICA.md)

> Este README é a fonte de verdade do estado atual. Leia a seção **"Status das fontes de dados"** e **"Pendências"** antes de mexer em scrapers.

---

## 👋 Visão geral (para o dono e não-técnicos)

**O que é o PromoDetec?** Um site que **vigia os preços de hardware e tecnologia**
em várias lojas e avisa quando uma oferta é **realmente boa** — não aquela falsa
promoção de "de R$ 5.000 por R$ 4.999".

**O que ele faz, no dia a dia:**
- 🔍 **Acompanha os preços** em várias lojas (Kabum, Terabyte, Amazon, Mercado Livre, Pichau).
- 📈 **Guarda o histórico** de cada produto — então sabe se o preço de hoje é mesmo barato.
- 🎯 **Dá uma nota de 0 a 100 (PromoScore)** pra cada oferta, desmascarando desconto fabricado.
- ⚖️ **Compara o mesmo produto entre lojas**, mostrando onde está mais barato.
- 📰 **Reúne notícias** de tecnologia/hardware num só lugar.

**Por que é especial:** a maioria dos comparadores só mostra o preço atual. O
PromoDetec tem **memória própria** e um **algoritmo de confiança** — ele diz se a
"promoção" é real comparando com o histórico, não com a vitrine da loja.

**Quanto custa pra manter? Praticamente nada.** 💸 O site roda **sozinho, na nuvem**,
24 horas, usando camadas gratuitas (Vercel + Supabase + GitHub Actions + Firecrawl).
A coleta de preços acontece automaticamente todo dia, **sem depender de nenhum
computador ligado**. Não há servidor pago nem cobrança surpresa.

> Em uma frase: **é um "radar" que encontra as promoções de verdade de hardware,
> com memória de preços e nota de confiança — e se mantém praticamente de graça.**

---

## 🧠 Como o PromoDetec funciona e como ele "pensa" (guia do dono)

> Seção escrita para responder, em português claro, às dúvidas mais comuns: *é uma
> vitrine estática ou de promoções? o que é o PromoScore? o que são os "2 números
> com a bolinha azul" no card? como ganhar dinheiro? por que cadastrar (e por que
> com o Google)?*

### 1. Vitrine estática × radar de promoções (o conceito central)

O PromoDetec **não é um catálogo estático** ("aqui estão 5.000 produtos, escolha um").
Ele é um **radar de preços que vive de coleta diária**. A diferença prática:

- Uma **vitrine** mostra produtos parados, com o preço que o lojista digitou uma vez.
- O **PromoDetec** visita as lojas **várias vezes por dia**, anota o preço de cada
  produto **naquele momento**, **guarda o histórico** e recalcula quão boa é a oferta
  de hoje. O que você vê na home/ofertas é **o estado de agora**, ordenado pelas
  **melhores oportunidades** — não uma lista fixa.

Então sim: pense nele como **"as promoções de hoje", reavaliadas a cada coleta**. Um
produto pode estar em destaque hoje (caiu de preço) e sumir do topo amanhã (voltou ao
normal). A "vitrine" é só a casca; o coração é a **série histórica de preços** que só
o PromoDetec tem.

### 2. De onde vêm os produtos

Robôs de coleta ("adapters") leem as lojas automaticamente e salvam preço, foto, marca
e disponibilidade no nosso banco. Hoje cobrimos **6 verticais**: **Tech** (hardware de
PC), **Mundo Fit** (suplementos), **Casa & Eletro**, **Ferramentas** (oficina + EPIs),
**Gadgets** e **Perfumes** (importados e árabes). Cada loja é um adapter; cada produto
é classificado numa categoria. Ninguém digita produto à mão.

### 3. Anatomia de um card (o que cada elemento significa)

Um card de produto tem 4 sinais visuais — todos baseados em **dado real**, não em
enfeite:

| Onde | O que é | Significado |
|---|---|---|
| **Canto superior esquerdo** | Etiqueta com a cor da loja | De qual loja é aquela oferta (cada loja tem sua cor). |
| **Canto superior direito** | **O "número com a bolinha azul"** = **PromoScore** | Um número de **0 a 100** dentro de um **anel** que se preenche conforme o score (tipo bateria). É a **nota de quão boa é a oferta**. Não são dois números: é **um** número (quase sempre 2 dígitos, ex: `82`), e o arco azul/ciano ao redor é o "medidor" dele. Quanto mais cheio o anel e mais alto o número, melhor a promoção. |
| **Embaixo do preço** | Barrinha mín → máx | Onde o preço de **hoje** cai entre o **menor** e o **maior** preço que já vimos. A bolinha à esquerda = está perto do mínimo histórico (ótimo). À direita = caro. |
| **Canto inferior** | Selo verde `−15%` e/ou `#1` | Desconto e ranking daquela oferta na lista. |

> Resumindo a sua dúvida: **os "2 números no canto superior direito com a barrinha
> circular azul" são o PromoScore** — a nota 0–100 da oferta, com um anel que funciona
> como um velocímetro/medidor do quanto ela é boa.

### 4. PromoScore em 1 minuto

O PromoScore (`core/promo-score/promo-score.ts`) responde: *"esse preço de hoje é
realmente uma boa oportunidade?"* — comparando com o **histórico real do produto**, e
não com o "de/por" que a loja anuncia (que costuma ser inflado). Ele combina 5 sinais:
posição no histórico (35%), distância da média (25%), desconto **real** (20%),
raridade da promoção (10%) e variação recente (5%) + estoque (5%). Faixas: 95+
**excepcional**, 80–94 **excelente**, 60–79 **boa**, abaixo **comum**. Como depende de
histórico, **ele só fica "esperto" depois de vários dias de coleta** — por isso coletar
mais vezes ao dia melhora a qualidade da nota com o tempo.

### 5. Comparador inteligente

Agrupa **o mesmo modelo entre lojas** (ex: "RTX 4060 8GB" na Kabum, Terabyte, Pichau,
ML…) e mostra onde está mais barato. A regra é dura de propósito: **só compara produtos
de verdade equivalentes** (mesma marca/spec/tipo) — para não comparar, p.ex., um
cooktop com um fogão de piso. É o "chamariz" do site: a foto clara de quanto dá pra
economizar comprando na loja certa.

### 6. Cadastro: o que muda (e por que entrar com o Google)

**Sem cadastro (anônimo):** você navega tudo — catálogo, ofertas, comparador, notícias.
O conteúdo é público de propósito (bom para SEO e para o primeiro contato).

**Cadastrado:** o site passa a **trabalhar para você**:
- **Alertas de queda de preço** nos produtos que você acompanha (o recurso-âncora de um
  site de promoções — a tabela `alertas` já existe pra isso).
- **Home/feed personalizados** pelos seus interesses (escolhidos no onboarding).
- **Favoritos** e, no futuro, **avisos de novas promoções** (e-mail/Telegram/WhatsApp/push).

**Por que login com Google:** é **1 toque, sem senha** (nada pra esquecer ou vazar),
o **e-mail já vem verificado** (menos conta falsa/spam) e a **conversão é muito maior**
(menos gente desiste no cadastro). Para o usuário = praticidade e segurança. Para o
negócio = **mais cadastros = maior público notificável**, que é justamente o ativo que
sustenta retenção e receita (próximo tópico).

### 7. Como o PromoDetec pode ganhar dinheiro (≥3 vias)

1. **Afiliados (a via principal e mais natural).** Cada botão "Ir à loja" pode levar
   sua **tag de afiliado** (Amazon Associados, Mercado Livre Afiliados, Magalu, Awin/
   Lomadee, AliExpress…). Quando o usuário compra, você ganha **comissão** — sem mudar
   nada na experiência. O site **já registra cliques** (tabela `cliques`), então a base
   para medir conversão já existe. É o modelo clássico de Promobit/Pelando.
2. **Publicidade e destaque pago.** Quando o tráfego crescer: anúncios (Google AdSense/
   Ad Manager) nas páginas de categoria e notícias, **"oferta em destaque" patrocinada**
   e selos de loja parceira. Receita por exibição/clique, sem custo pro usuário.
3. **Assinatura premium (freemium).** Plano pago com **alertas instantâneos**, histórico
   completo de preço, filtros avançados de PromoScore, **sem anúncios** e acesso
   antecipado às melhores quedas. O grátis vira funil; o premium converte os fãs.
4. **Inteligência de preços (B2B).** O **histórico próprio** de preços é um ativo raro:
   marcas e lojas pagam para saber como o mercado precifica e o que tem demanda
   (relatórios/painel — dados sempre **agregados/anônimos**).

> Estratégia detalhada (segurança, papéis, escala, parceiros) em
> [docs/AUDITORIA-ESTRATEGICA.md](docs/AUDITORIA-ESTRATEGICA.md).

---

## Arquitetura

Clean Architecture + Repository Pattern + Service Layer. Dependências apontam para dentro (`core` não conhece infraestrutura).

```
src/
├── core/                              # Domínio puro (sem I/O)
│   ├── domain/types.ts                # Entidades e contratos (RawProduct, Produto, etc.)
│   ├── promo-score/promo-score.ts     # Algoritmo PromoScore (0–100), testado
│   ├── matching/match.ts              # Assinatura de classe de modelo p/ casar produto entre lojas
│   └── insights/insights.ts           # Insights automáticos da página de produto
├── infrastructure/
│   ├── supabase/
│   │   ├── client.ts                  # Cliente público (anon, browser/SSR)
│   │   ├── server.ts                  # Cliente SSR com sessão via cookies (@supabase/ssr)
│   │   ├── browser.ts                 # Cliente browser (singleton) p/ auth client-side
│   │   └── admin.ts                   # Cliente service_role (SÓ servidor: scrapers/cron)
│   ├── repositories/produtos.repo.ts  # Leitura: ofertas, produto, histórico, notícias
│   ├── integrations/
│   │   └── mercadolivre-auth.ts       # OAuth ML: troca/renova token, salva em `integracoes`
│   ├── news/news.service.ts           # Coletor de notícias (Google News RSS)
│   └── scraping/
│       ├── core/adapter.ts            # StoreAdapter (base) + helpers (parsePrecoBR)
│       ├── core/bright-fetch.ts       # Web Unlocker do Bright Data (anti-bot) — ver Pendências
│       ├── core/browser-fetch.ts      # Chromium headless (Playwright) p/ furar Cloudflare grátis
│       ├── adapters/                  # kabum · mercadolivre · pichau · terabyte
│       └── registry.ts                # Registro dos adapters
├── services/collection.service.ts     # Orquestra coleta → PromoScore → upsert + logs
├── components/
│   ├── ui/                            # Design System: button, input, skeleton, tooltip,
│   │                                  #   kbd, breadcrumbs, empty-state, card, badge
│   ├── auth/                          # auth-form, auth-aside, auth-shell, onboarding-client
│   ├── layout/navbar.tsx
│   ├── command-palette.tsx            # Busca global Ctrl+K (estilo Raycast)
│   ├── produto-card.tsx · score-ring.tsx · price-chart.tsx · user-menu.tsx · search-trigger.tsx
│   └── ...
├── app/
│   ├── page.tsx (home) · ofertas · categoria/[slug] · produto/[id] · noticias · admin
│   ├── login · cadastro · recuperar · onboarding
│   └── api/
│       ├── cron/scrape           # Cron Vercel: coleta ofertas + notícias
│       ├── scrape/[adapter]      # Coleta manual de 1 loja (dashboard)
│       ├── news/collect          # Coleta manual de notícias
│       ├── search                # Busca p/ o command palette
│       └── auth/
│           ├── callback          # Callback do Supabase Auth (Google/email)
│           └── mercadolivre/{start,callback}   # OAuth do Mercado Livre
└── middleware.ts                 # Refresca sessão + protege rotas (/admin, /onboarding, ...)
```

`legacy/` contém o projeto Python original (referência histórica, não usado).

---

## Banco de dados (Supabase)

Tabelas: `lojas`, `categorias`, `produtos`, `historico_precos`, `noticias`, `noticias_categorias`,
`usuarios`, `alertas`, `scrape_jobs`, `scrape_logs`, `integracoes`. View: `vw_ofertas`.

Pontos-chave:
- **`historico_precos`** é append-only, mas um **trigger só insere quando o preço muda** (economiza espaço — ver seção de custos abaixo). Outro trigger mantém `preco_min/max/avg_hist` em `produtos`.
- **`usuarios`** tem `interesses text[]` e `onboarding_completo`; um trigger em `auth.users` cria o perfil automaticamente no cadastro.
- **`integracoes`** guarda os tokens OAuth (ex: Mercado Livre). Acesso só via `service_role` (RLS sem policies).
- **RLS:** leitura pública no catálogo/notícias; escrita só via `service_role`. Alertas/usuários: cada um vê o seu.
- **`scrape_jobs` / `scrape_logs`:** observabilidade das coletas. Os logs são gravados de forma **bufferizada e aguardada** (em serverless, `fire-and-forget` se perde). Para depurar uma coleta: `select * from scrape_logs where job_id = '...'`.

Migrations aplicadas (via MCP): `01_core_catalog` → `06_integracoes_tokens`.

---

## Status das fontes de dados ⚠️ (LEIA ANTES DE MEXER)

| Fonte | Estado | Detalhe |
|---|---|---|
| **Kabum** | ✅ Funciona | API REST aberta. Adapter usa `catalog/v2/products?sort=-discount`, classifica por `attributes.menu`. ~97 produtos. Rodar de IP não-bloqueado. |
| **Notícias (Google News RSS)** | ✅ Funciona | 536+ notícias coletadas. Sem bloqueio. |
| **TerabyteShop** | ✅ Funciona | Cloudflare (desafio JS) bloqueia `fetch` HTTP (403), mas um **Chromium headless** resolve o desafio sozinho — sem proxy pago. Adapter coleta as 8 categorias (~850 produtos/rodada). Detalhe técnico: usar **contexto novo por categoria** (cookies cf limpos) ou o Cloudflare re-desafia. Requer browser → roda **local/runner**, não no cron serverless. |
| **Pichau** | 🟡 Parcial | Cloudflare **+** bloqueio na camada de app: mesmo via browser, só a **home** (`/`) abre. Catálogo (`/hardware/*`), busca, página de produto e GraphQL dão 403 "Site em Manutenção". O adapter raspa as ofertas da home e filtra por categoria — costuma trazer poucos/zero itens das categorias rastreadas. Catálogo completo só via Bright Data / IP residencial. |
| **Mercado Livre** | ✅ Funciona (parcial) | A busca pública `/sites/MLB/search` morreu (403), mas a **API de catálogo** responde: `client_credentials` (só `ML_CLIENT_ID`+`ML_CLIENT_SECRET`, **sem OAuth de usuário**) gera app token → `/products/search` + `/products/{id}/items` (buy box). ~19% dos itens de catálogo têm oferta ativa (~45 produtos/rodada). Só HTTP, roda em qualquer ambiente. |
| **Amazon** (amazon.com.br) | ✅ Funciona | `fetch` HTTP é intermitente (alterna 200/503 por anti-bot), mas o **Chromium headless** serve a busca de forma confiável (~60 resultados/consulta, sem captcha). Adapter busca por categoria (`/s?k=...`) e filtra por relevância no título. Requer browser → roda **local/runner**. |
| **Shopee** | ⛔ Bloqueado | API interna dá **403** (anti-bot `90309999`); testado também **via Firecrawl** → cai em "Página indisponível / Faça login para continuar" (exige **login** + anti-bot agressivo). Inviável no grátis; só com API oficial de afiliado (requer aprovação) ou sessão autenticada + evasão. |

**Implicação:** Terabyte e **Amazon** destravados de graça via Chromium headless (`browser-fetch.ts`) e o Mercado Livre via **API de catálogo** (sem OAuth). Sobram o **catálogo completo da Pichau** e a **Shopee**, que exigiriam **Bright Data Web Unlocker** (`bright-fetch.ts`) — codado, mas **desativado** (decisão de custo; ver Pendências). Adapters que não coletam retornam `[]` sem derrubar a rodada.

> **Coleta das lojas de browser (Terabyte/Amazon/Pichau):** o `browser-fetch.ts`
> usa **Playwright** (Chromium) localmente e **Firecrawl** (API) na nuvem. Em
> produção elas rodam no **GitHub Actions** (não na Vercel, que tem teto de 60s) —
> entenda o porquê na seção **"Hospedagem da coleta"** logo abaixo.

## O que é o Firecrawl (explicação simples, p/ não-técnicos) 🔥

**Em uma frase:** o Firecrawl é um serviço que **visita uma página da internet por
nós e devolve o conteúdo já "limpo"**, mesmo quando o site tenta bloquear robôs.

**A analogia:** algumas lojas (Terabyte, Amazon, Pichau) têm um "segurança na porta"
(proteção anti-robô). Quando nosso programa simples bate na porta, ele toma um "não"
na cara (erro 403). Um **navegador de verdade** (uma pessoa abrindo o Chrome) passa
normal — mas manter um navegador rodando 24h na nuvem é pesado e não cabe no plano
grátis. O **Firecrawl resolve isso terceirizando a visita**: a gente manda o link,
**eles** abrem a página num navegador real nos servidores deles (passando pelo
segurança) e nos entregam o conteúdo pronto.

**Como ele trabalha, em 3 passos:**
1. Nosso coletor manda pro Firecrawl: *"me traz a página de placas de vídeo da Terabyte"*.
2. O Firecrawl abre a página num navegador real (na infra deles), espera carregar e
   **fura a proteção anti-robô**.
3. Devolve o HTML da página; a gente extrai os preços e salva no banco.

**Por que é importante pra nós:** sem o Firecrawl, as lojas Terabyte/Amazon/Pichau só
seriam coletadas rodando da máquina de alguém (com navegador instalado). Com ele, a
coleta dessas lojas roda **sozinha na nuvem, todo dia**, sem depender de PC ligado.

**Os limites do plano grátis no NOSSO projeto:**
- O free do Firecrawl dá cerca de **1.000 páginas por mês**. Cada página renderizada = 1 crédito.
- Nosso consumo: 3 lojas × ~8 categorias ≈ **17 páginas por coleta**, rodando **1×/dia**
  → **~510 páginas/mês**. Ou seja, usamos ~metade do free, com **folga**.
- **Só** Terabyte/Amazon/Pichau usam Firecrawl. **Kabum, Mercado Livre e notícias NÃO
  gastam nada** do Firecrawl (são API/RSS abertos e gratuitos).
- **Se um dia a cota acabar:** só as 3 lojas de browser param de atualizar até o mês
  virar (as outras seguem normais). Nada quebra; é só esperar ou usar o plano B
  (ver a tabela de riscos abaixo).

> 🧾 **Resumo pro dono do projeto:** o Firecrawl é uma "ferramenta terceirizada" que
> entra nas lojas difíceis por nós. É **grátis** no nosso volume (usamos ~510 de
> 1.000 páginas/mês) e só é usado nas 3 lojas que têm bloqueio. As outras fontes não
> custam nada. Não há cobrança surpresa — se acabar a cota grátis, a coleta dessas 3
> lojas simplesmente pausa até o próximo mês.

## Hospedagem da coleta — arquitetura e o "porquê" (📚 leitura p/ estudo)

> Esta seção explica **por que a coleta é dividida em dois lugares**, qual a diferença
> entre eles, o que pode fazer a coleta parar e como resolver. É uma decisão de
> engenharia tomada para rodar **de graça** dentro de limites reais de plataforma.

### As 3 restrições do mundo real (tudo no plano grátis)

1. **Serverless da Vercel não tem navegador.** Cada execução do cron é um
   contêiner efêmero e mínimo — **não existe Chromium** ali. Lojas com anti-bot
   (Terabyte/Amazon = Cloudflare/503) **não abrem** por `fetch` HTTP puro; precisam
   de um browser que renderize JS *ou* de um serviço que faça isso (Firecrawl).
2. **Vercel Hobby mata a função em 60 segundos.** É o teto de duração de uma
   function no plano grátis. Coletar as 3 lojas de browser (≈17 páginas) renderizando
   + re-tentativas passa de 60s → a função é **morta no meio** (vira job `running`).
3. **Firecrawl free tem cota de páginas/mês (~1000).** Cada página renderizada
   gasta 1 crédito. 17 páginas/dia × 30 = ~510/mês → cabe **se rodar 1×/dia**.
   Rodar 2×/dia (~1020) estouraria.

> Há ainda dois pontos de fundo: o **Supabase free pausa após 7 dias sem acesso**
> (o cron 2×/dia mantém o projeto vivo) e o **Vercel Hobby pode atrasar/limitar
> crons**. Por isso o trabalho pesado não fica só na Vercel.

### A solução: dois coletores, cada um no seu forte

| | **Cron da Vercel** | **GitHub Actions** |
|---|---|---|
| O que é | Função serverless agendada (`vercel.json`) | Runner = uma VM Linux temporária (`.github/workflows/scrape.yml`) |
| Teto de tempo | **60s** (Hobby) | até 6h (aqui: 20 min) |
| Tem navegador? | Não | Tem (mas usamos Firecrawl, não Playwright, p/ não depender do IP) |
| Frequência | **2×/dia** (10h e 20h UTC = 07h/17h BRT) | **4×/dia** — 1× completa (06h BRT) + 3× rápida (00h/12h/18h BRT) |
| Coleta | **Kabum + Notícias** (HTTP/API, rápido) | **Completa:** todas as lojas (browser via Firecrawl). **Rápida:** só HTTP/API de custo zero (Kabum, ML, suplementos JSON, VTEX: Americanas/FG/Época) |

> **Cadência 4×/dia (de 6 em 6h) cabe no free** — ver `.github/workflows/scrape.yml`.
> A pegada: as lojas de **browser/Firecrawl rodam só 1×/dia** (na *completa*), então o
> gasto de Firecrawl **não muda**; as 3 coletas *rápidas* extras usam só HTTP/API de
> **custo zero** para pegar **promoções-relâmpago** que duram poucas horas. Minutos de
> GitHub Actions: ~810/mês (de 2.000 grátis em repo privado).
| Segredos em | Vercel → Settings → Environment Variables | GitHub → Settings → Secrets and variables → Actions |
| Custo | Grátis (HTTP, sem Firecrawl) | Grátis + ~17 créditos Firecrawl/dia |

### Por que o cron da Vercel NÃO faz todas as lojas
- **Não tem browser** → Terabyte/Amazon/Pichau (anti-bot) não abrem por HTTP puro.
- Mesmo usando Firecrawl (que é HTTP), as ~17 páginas + re-tentativas do free
  **passam dos 60s** e a função morre. Já aconteceu: a Terabyte entrou parcial
  (220 itens) e o job ficou `running`.
- Então a Vercel faz só o que é **rápido e por API**: Kabum, Mercado Livre e
  notícias — que cabem folgado nos 60s e são baratos de repetir 2×/dia.

### Por que o GitHub Actions NÃO faz todas as lojas
- Ele **poderia** (não tem teto de 60s). Mas:
  - Kabum/ML/notícias **já são feitos pela Vercel 2×/dia** — duplicar seria desperdício.
  - As lojas de browser via Firecrawl gastam ~17 créditos/rodada. Rodando **1×/dia**
    = ~510/mês (cabe no free). Fazer tudo, 2×, ou repetir o que a Vercel já faz
    **queimaria a cota do Firecrawl** rápido.
- Então o GitHub faz **só as 3 lojas de browser, 1×/dia** — o trabalho que a Vercel
  não consegue fazer.

### O que pode parar a coleta e o que fazer 🚨

| Risco | Chance | Como perceber | O que fazer |
|---|---|---|---|
| **Cota do Firecrawl acabar** no mês | Média | `scrape_jobs` das 3 lojas de browser com `failed`/0; logs com `http 402/429` | Esperar virar o mês; reduzir categorias por loja; ou plano B: GitHub Actions com **Playwright** (sem Firecrawl, mas IP de datacenter pode ser barrado pela Cloudflare) |
| **GitHub desativa o workflow agendado** (60 dias sem commits no repo) | Média (repos parados) | Para de rodar sozinho; aviso por e-mail do GitHub | Fazer qualquer commit, ou reativar na aba **Actions** → **Enable workflow** |
| **Loja muda o HTML/anti-bot** | Média/Alta (com o tempo) | Aquela loja com 0 salvos, demais ok | Ajustar o seletor/parsing no adapter (`src/infrastructure/scraping/adapters/...`) |
| **Token/segredo expira ou é rotacionado** (ML, Firecrawl, Supabase) | Baixa | Erro de auth (401/403) nos logs | Gerar nova chave e atualizar o segredo na Vercel **e/ou** no GitHub |
| **Supabase free pausa** (7 dias sem acesso) | Baixa | Tudo falha de uma vez | Reabrir o projeto no painel Supabase; o cron 2×/dia normalmente evita isso |
| **Vercel Hobby atrasa/pula o cron** | Baixa | Lacuna no `scrape_jobs` num horário | Disparar manual: `GET /api/cron/scrape?secret=CRON_SECRET`; ou subir p/ Pro |
| **Mudança de versão (ex: Node sem WebSocket)** | Baixa | Job falha logo no início (ex: `createAdminClient`) | Fixar a versão no workflow (já usamos **Node 22**, que tem WebSocket nativo) |

### Detalhes técnicos de apoio
- **Roteamento (`browser-fetch.ts`):** usa **Firecrawl** quando `VERCEL` *ou*
  `SCRAPE_VIA_FIRECRAWL=1` (e há `FIRECRAWL_API_KEY`); caso contrário, **Playwright**
  local. Assim o mesmo código serve pros três cenários (Vercel, GitHub, sua máquina).
- **Coleta manual completa** (sua máquina, sem gastar Firecrawl, usa Playwright):
  `npm run scrape` (todas) ou `npm run scrape terabyte amazon`.
- **Disparar o GitHub Actions na hora:** aba **Actions** → "Coleta diária" →
  **Run workflow**. (Sempre um *run novo*, não "Re-run", pra pegar o commit atual.)
- **Monitorar:** tabela `scrape_jobs` no Supabase (ver seção acima) — é o "diário de bordo".

---

## PromoScore (0–100)

`core/promo-score/promo-score.ts`. Média ponderada e auditável de 5 sinais, calculada contra o **histórico real** (não a vitrine): `position` (35%), `vsAvg` (25%), `realDisc` (20%, neutraliza desconto fabricado), `rarity` (10%), `freshness` (5%), `stock` (5%). Faixas: 95+ excepcional · 80–94 excelente · 60–79 boa · <60 comum. Sem histórico, cai para fallback conservador (teto 70). **Precisa de várias coletas para ficar significativo** — no 1º dia quase tudo fica com score baixo.

---

## Autenticação (Supabase Auth)

Login, cadastro, recuperação de senha, **Google OAuth**, sessão por cookies (`@supabase/ssr`), rotas protegidas (`middleware.ts`), e **onboarding** de interesses pós-cadastro. Tela premium em split (benefícios + estatísticas reais).

**Config manual necessária no painel Supabase:** URL Configuration (Site URL + Redirect URLs com `/auth/callback`) e, para Google, habilitar o provider com credenciais do Google Cloud. Login por e-mail funciona sem config extra.

---

## Variáveis de ambiente

`.env.local` (local) e Vercel (produção) precisam de:

```
NEXT_PUBLIC_SUPABASE_URL=https://sksjukjkxkptresysbno.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=...        # service_role — só servidor; necessário p/ scrapers
CRON_SECRET=...                      # protege /api/cron/scrape
ML_CLIENT_ID=...                     # Mercado Livre (app de dev)
ML_CLIENT_SECRET=...
ML_REDIRECT_URI=https://promodetec.vercel.app/api/auth/mercadolivre/callback
NEXT_PUBLIC_SITE_URL=https://promodetec.vercel.app   # URL canônica (metadata/OG/sitemap)
BRIGHTDATA_API_KEY=...               # opcional — só se ativar o Bright Data
BRIGHTDATA_UNLOCKER_ZONE=...         # opcional — nome da zona Web Unlocker

# Avisos (opcionais — sem eles, vira no-op; não quebra a coleta)
# --- DONO (operação): coletas + novos cadastros + resumo diário ---
DISCORD_WEBHOOK_URL=...              # webhook do canal privado do dono
TELEGRAM_BOT_TOKEN=...               # bot do Telegram (via @BotFather)
TELEGRAM_CHAT_ID=...                 # chat do DONO (seu privado com o bot, ou grupo de ops)
# --- PÚBLICO (feed de ofertas p/ usuários) — opcional, chaves separadas ---
DISCORD_DEALS_WEBHOOK_URL=...        # webhook de um canal público de ofertas
TELEGRAM_FEED_CHAT_ID=...            # canal público onde o bot posta as ofertas
```

> **Avisos do DONO (`owner.ts`):** ao fim de **cada coleta** vai um resumo (status +
> salvos por loja) ao Discord e ao Telegram; em **cada novo cadastro** vai um aviso
> (nome/e-mail/via); e **1×/dia** (no job `completa`) vai o **resumo de movimento do
> site** (interações, buscas, produtos vistos, novos usuários). Use `npm run tg` para
> descobrir o `TELEGRAM_CHAT_ID` e testar o bot.
>
> **Feed PÚBLICO de ofertas (`promo-feed.ts`):** ao fim de cada coleta, ofertas com
> **queda real** (≥5% vs. anterior, score ≥60) vão para um canal público de Telegram/
> Discord — só em queda real, não repete a cada rodada. Chaves **separadas** das do
> dono (`DISCORD_DEALS_WEBHOOK_URL` / `TELEGRAM_FEED_CHAT_ID`), então as duas coisas
> nunca se misturam. Coloque os secrets que for usar **na Vercel e no GitHub Actions**.

---

## Comandos

```bash
npm install
npm run dev            # http://localhost:3000
npm run build          # produção (TypeScript strict)
npm run scrape kabum   # coleta 1+ lojas (alias: ml, pichau, terabyte; sem arg = todas)
npm run scrape terabyte # coleta via browser headless (precisa do Chromium — ver abaixo)
npm run news           # coleta notícias (Google News RSS)

# coleta via browser (Terabyte/Pichau): instalar o Chromium do Playwright 1x
npx playwright install chromium

# diagnósticos (descobrir estrutura de dados das lojas)
npx tsx scripts/probe-kabum.ts
npx tsx scripts/probe-bright.ts     # testa Pichau/Terabyte via Bright Data (precisa das chaves)
```

Coletas automáticas: `vercel.json` agenda **10:00 e 20:00 UTC = 07:00 e 17:00 BRT** em `/api/cron/scrape` (ofertas + notícias), protegido por `CRON_SECRET`. Atenção: o cron serverless **não roda Terabyte/Pichau** (precisam de browser); essas devem rodar de um host com Chromium (máquina local, GitHub Actions, VPS) via `npm run scrape terabyte pichau`.

---

## Custos / plano free do Supabase

O histórico só cresce quando o preço muda, então o banco cresce devagar — o plano free (500 MB) dura **anos** nesta escala. O cron (2x/dia) mantém o projeto ativo (free pausa após 7 dias sem acesso). Quando crescer: Supabase Pro (~US$25/mês) e Vercel Pro (~US$20/mês), no cartão do dono.

---

## Pendências / próximos passos

1. **Visual "Radical Precision Dark" (Google Stitch) — EM ANDAMENTO.** Migração da identidade visual (paleta mauve `#7C5DFF` + ciano, fundo midnight `#0A0A0C`, fontes Geist + Inter + JetBrains Mono, glassmorphism). Já alterados: `tailwind.config.ts`, `globals.css`, fontes no `layout.tsx`. **Falta:** terminar `score-ring` (gradiente mauve→ciano), refinar cards/home com a nova paleta, e **ainda não foi feito build/push** desta etapa. Designs de referência em `legacy`/uploads do Stitch (DESIGN.md).
2. **Área de notícias na home** — puxar as últimas manchetes para a home (a página `/noticias` já existe e está populada).
3. **Coleta via browser headless (Terabyte ✅ / Pichau 🟡) — IMPLEMENTADO.** `browser-fetch.ts` resolve o desafio do Cloudflare com Chromium (Playwright), sem proxy pago. Terabyte coleta as 8 categorias (~850 produtos). Pichau só acessa a home (poucos itens; catálogo bloqueado na camada de app). **Falta:** rodar essas coletas de um host com browser de forma agendada (a Vercel serverless não tem Chromium) — ex: GitHub Actions/VPS chamando `npm run scrape terabyte`, ou validar a coleta local periódica.
4. **Bright Data (pausado por custo).** `bright-fetch.ts` pronto. Agora só seria necessário para o **catálogo completo da Pichau** (Terabyte e Mercado Livre já resolvidos de graça). Se aprovado (~US$3–5/mês): criar conta + zona Web Unlocker, preencher env, rodar `probe-bright.ts`, implementar a coleta de catálogo via `brightFetch`.
5. **Kabum:** achar o filtro de "ofertas reais" (hoje `sort=-discount` traz preço cheio, desconto 0) e refinar a classificação por `menu` (ainda escapam alguns falsos positivos).
6. **Comparador entre lojas (visão 4.0 do Stitch) — IMPLEMENTADO.** Página `/comparar` agrupa o mesmo modelo entre lojas via assinatura de classe (`core/matching/match.ts`) e mostra a melhor oferta de cada loja, com a mais barata destacada. Matching é por **classe de modelo** (ex: "RTX 4060 8GB"), não SKU exato; filtro de outlier (>3× o menor) descarta mismatches do catálogo do ML. **Refinar:** apertar o matching (marca/variante) e limpar PCs montados do catálogo do ML na origem.
7. **Alertas / avisar usuários quando chega promoção nova:** tabela `alertas` e UI
   parciais; falta o **envio real**. Análise de canais (do mais barato ao mais caro):
   - **Telegram bot** — 100% grátis e ilimitado; é onde vivem as comunidades de promoção
     no Brasil (Promobit/Pelando). **Melhor custo-benefício** para começar.
   - **Web Push (PWA)** — grátis, sem telefone; funciona em Android/desktop e iOS (PWA
     instalado). Bom para "nova oferta" instantânea.
   - **E-mail digest** — grátis no free de provedores (ex: Resend ~3k/mês). Bom p/ retenção.
   - **WhatsApp** — **não é grátis nem imediato**: exige WhatsApp Business **Cloud API**
     (Meta) ou um BSP (Twilio/Zenvia/360dialog), **número verificado**, **templates
     aprovados** e **pagamento por conversa**; e **opt-in** do usuário (LGPD). Para
     habilitar: adicionar coluna `telefone` + flag de consentimento em `usuarios`,
     capturar no onboarding/perfil, e integrar o provedor escolhido.

---

## Convenções

- TypeScript **strict** + `noUncheckedIndexedAccess`. Nada de `any` implícito.
- Código de domínio em português (nomes de função/variável) seguindo o existente.
- Dados externos (títulos de produto) são escapados pelo React automaticamente — não usar `dangerouslySetInnerHTML`.
- Ao depurar coleta, sempre olhar `scrape_logs` no Supabase (os logs são persistidos por job).
