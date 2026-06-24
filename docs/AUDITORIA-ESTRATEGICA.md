# 🔍 Auditoria Estratégica — PromoDetec

> **Data:** 09/06/2026 · **Escopo:** segurança, papéis, painel, escalabilidade, infraestrutura,
> crescimento, migração, monetização e o futuro programa de Parceiros Confiáveis.
>
> O PromoDetec **não é loja**: não vende, não processa pagamento, não guarda cartão.
> É uma **vitrine inteligente** — detecta, compara e direciona o usuário à loja oficial.
> Toda a análise abaixo parte dessa premissa.

---

## TL;DR para o dono (10 respostas em 1 minuto)

1. **Segurança:** encontrei 3 falhas críticas — **todas já corrigidas hoje** (detalhe abaixo). Restam ajustes menores com passo a passo pronto.
2. **Admin Master:** `carlinhoct@gmail.com` agora é **Super Admin**. Existe hierarquia: Super Admin → Admin → Moderador → Operador → Usuário. **Ninguém consegue se autopromover** (bloqueado no banco, em 2 camadas).
3. **Painel:** ganhou gate por papel, contagem de usuários e lista da equipe. O roadmap do "centro de comando" (cliques, conversões, receita estimada, auditoria) está desenhado abaixo, com o SQL pronto.
4. **Escalabilidade:** no plano grátis o site aguenta **milhares de visitas/dia** tranquilamente. O primeiro gargalo real é a **cota do Firecrawl (1.000 páginas/mês)** — já estamos usando ~metade.
5. **GitHub:** o repositório está **público** — recomendo tornar **privado** agora (2 cliques; nosso uso de Actions cabe no limite do privado).
6. **Quando pagar:** os gatilhos são concretos — ~50 mil visitas/mês, egress do Supabase > 4 GB ou primeira receita recorrente. Antes disso, grátis dá conta.
7. **Migração:** Vercel Free→Pro e Supabase Free→Pro são **um botão, sem derrubar nada** (mesmas URLs, sessões e banco). A única coisa para fazer CEDO é **comprar o domínio próprio** (trocar domínio depois desloga usuários e zera SEO).
8. **Monetização:** afiliados é o motor certo para começar. Depois: destaque patrocinado e assinatura de lojas parceiras. Anúncio programático (AdSense) eu evitaria — corrói a credibilidade de quem compara preços.
9. **Parceiros verificados:** **sim, eu implementaria** — mas na fase 3 (com tráfego e processo de verificação de pé). É a melhor receita recorrente possível para este modelo. O risco reputacional se controla com verificação séria + selo honesto + kill-switch.
10. **Área "Parceiros Confiáveis":** desenhada abaixo (onde fica, selos, painel, banco). O banco já ganhou o primeiro tijolo hoje (`lojas.selo` está especificado; schema completo pronto para aplicar quando você aprovar).

---

## 1. Segurança — auditoria completa

### O que foi auditado
Supabase (RLS, policies, grants, funções, advisors oficiais), rotas de API, middleware,
login (e-mail + Google), sessões, variáveis de ambiente, histórico do git, visibilidade
do GitHub e configuração da Vercel.

### 🔴 Críticas (encontradas hoje — **já corrigidas hoje**)

| # | Falha | Risco | Correção aplicada |
|---|-------|-------|-------------------|
| C1 | **Escalação de privilégio**: a API permitia a qualquer usuário logado executar `UPDATE usuarios SET is_admin=true` na própria linha (grant de UPDATE em todas as colunas + policy de "atualizar o próprio perfil"). | Qualquer conta virava admin com 1 requisição. | Revogados INSERT/UPDATE/DELETE da tabela; devolvido UPDATE **apenas** nas colunas seguras (`nome`, `avatar_url`, `interesses`, `onboarding_completo`); trigger `trg_protege_privilegios` barra qualquer alteração de `role`/`is_admin` que não venha do service_role. Verificado em produção. |
| C2 | **`/api/scrape/[adapter]` sem autenticação**: qualquer pessoa na internet podia disparar coletas. | Queimar a cota do Firecrawl (1.000/mês), estourar limites da Vercel, poluir o banco. | Rota agora exige papel com permissão de coleta (sessão) **ou** `CRON_SECRET` via header. |
| C3 | **`/api/news/collect` aberto, com GET**: até um robô de busca indexando a URL disparava coleta. | Mesmo de C2. | Mesma guarda de C2 + GET removido. |

### 🟡 Médias (1 corrigida, 2 com passo a passo)

| # | Falha | Status |
|---|-------|--------|
| M1 | **Cron "fail-open"**: se `CRON_SECRET` não estivesse configurado, `/api/cron/scrape` ficava aberto; e aceitava o secret por query string (vaza em logs de acesso). | ✅ Corrigido: falha fechado + só header. |
| M2 | **Sessões caducando**: não havia `middleware.ts` — Server Components não regravam cookies, então o token (Google/e-mail) expirava ~1h após o login. | ✅ Corrigido: middleware de renovação de sessão adicionado (padrão oficial Supabase). |
| M3 | **Sem backup automático**: o Supabase Free **não faz backup**. Hoje, um `DELETE` errado seria irreversível. | ⏳ Pendente — receita pronta na seção "Backups" abaixo. |

### 🟢 Baixas (do linter oficial do Supabase — SQL pronto abaixo)

- 3 funções (`fn_registrar_historico`, `fn_atualizar_stats`, `fn_touch_produto`) sem `search_path` fixo (mitiga ataque de sombreamento de schema).
- `fn_handle_new_user` (security definer) executável via RPC por anon/authenticated — deve ter EXECUTE revogado (só o trigger interno a usa).
- Extensão `pg_trgm` no schema `public` (cosmético).
- "Leaked password protection" desativado no Auth (checa senhas vazadas no HaveIBeenPwned). **Ação sua (2 cliques):** Dashboard Supabase → Authentication → Sign In / Providers → ativar *Leaked password protection*.

```sql
-- Hardening fino (rodar no SQL Editor do Supabase, ou me peça para aplicar):
alter function public.fn_registrar_historico() set search_path = public, pg_temp;
alter function public.fn_atualizar_stats()    set search_path = public, pg_temp;
alter function public.fn_touch_produto()      set search_path = public, pg_temp;
alter function public.fn_handle_new_user()    set search_path = public, pg_temp;
revoke execute on function public.fn_handle_new_user() from public, anon, authenticated;
```

### O que já estava certo (crédito ao projeto)
- RLS habilitado em **todas** as tabelas; dados de catálogo são leitura pública (correto — são públicos mesmo); `integracoes` (tokens do Mercado Livre), `scrape_jobs` e `scrape_logs` sem nenhuma policy = acessíveis só pelo service_role. ✅
- `SUPABASE_SERVICE_ROLE_KEY` usada **somente** no servidor (`infrastructure/supabase/admin.ts`); nunca exposta ao navegador. ✅
- `.env*` no `.gitignore` e **nunca commitado** (verifiquei o histórico inteiro do git). ✅
- Login Google via Supabase Auth com PKCE (padrão do `@supabase/ssr`), cookies httpOnly. ✅

### Vetores de ataque considerados
- **Escalação de privilégio** → era real (C1), fechado em 2 camadas (grants por coluna + trigger).
- **Abuso de quota / DoS barato** → era real (C2/C3), fechado. Para DoS volumétrico, a CDN da Vercel absorve; rate-limit fino fica para a fase paga (Vercel WAF/Upstash).
- **Injeção SQL** → uso exclusivo do client oficial supabase-js (parametrizado); sem SQL cru com input de usuário. OK.
- **XSS** → React escapa por padrão; não há `dangerouslySetInnerHTML` com dado externo. OK.
- **Vazamento de segredo** → nada no git; chaves só em `.env.local`, GitHub Secrets e Vercel env. Recomendo marcar as env vars da Vercel como *Sensitive* e ativar **2FA** nas contas GitHub, Vercel, Supabase e Google (a conta é o elo mais fraco agora).
- **Scraping do nosso próprio banco** → dados são públicos por natureza; sem PII exposta. `usuarios` agora invisível para anon. OK.

### Checklist do nível profissional (ordem de prioridade)
1. ✅ ~~Fechar escalação de privilégio~~ (feito hoje)
2. ✅ ~~Autenticar rotas de coleta~~ (feito hoje)
3. ✅ ~~Middleware de sessão~~ (feito hoje)
4. ⬜ Tornar o repositório **privado** (seção 5)
5. ⬜ Ativar **2FA** em GitHub/Vercel/Supabase/Google
6. ✅ ~~Rodar o SQL de hardening fino~~ (aplicado em 10/06, migration `hardening_funcoes`)
7. ⬜ Ativar leaked-password protection (2 cliques)
8. 🟡 Backup semanal: workflow criado (`.github/workflows/backup.yml`) — **falta você criar o secret `SUPABASE_DB_URL`** (instruções no topo do arquivo)
9. ⬜ (fase paga) Rate-limit nas APIs + monitoramento de erros (Sentry free tier)

---

## 2. Papéis de acesso (implantado hoje)

**Fonte da verdade:** coluna `usuarios.role`. O antigo `is_admin` virou espelho legado.

| Papel | Quem | Poderes |
|-------|------|---------|
| **Super Admin** | `carlinhoct@gmail.com` e `helon280@gmail.com` | Tudo + gestão da equipe (ver/promover papéis) |
| **Admin** | — | Painel completo + coletas + conteúdo |
| **Moderador** | — | Conteúdo (notícias, futuras avaliações de parceiros); sem coletas/infra |
| **Operador** | — | Coletas e monitoramento; sem gestão de pessoas |
| **Usuário** | todos os demais | Nenhum acesso administrativo |

**Garantias anti-escalação (2 camadas no banco):**
1. *Grants por coluna* — a API só consegue alterar `nome`, `avatar_url`, `interesses`, `onboarding_completo`. `role`/`is_admin` nem existem para o papel `authenticated`.
2. *Trigger `trg_protege_privilegios`* — mesmo que um grant amplo volte por engano, qualquer UPDATE em `role`/`is_admin` que não venha do service_role é rejeitado com erro.

**Para promover alguém no futuro** (até existir a tela de gestão no painel):
```sql
update public.usuarios u set role = 'moderador'  -- ou admin / operador
from auth.users a where u.auth_id = a.id and a.email = 'email@exemplo.com';
```

---

## 3. Painel administrativo — hoje e o roadmap do centro de comando

**Hoje (após as mudanças):** gate por papel; chip mostrando seu papel; métricas de produtos,
pontos de preço, usuários e coletas; coleta manual (só para quem pode); tabela de coletas;
lista da equipe (só Super Admin).

**Roadmap em 3 fases — pensado como dono:**

### Fase 1 — Medir (pré-requisito de TUDO: receita, parceiros, decisões)
A peça que falta é o **rastreio de cliques**: trocar os links "Ir à loja" por uma rota
interna `/r/{id}` que registra o clique e redireciona em 302. Sem isso não existe
"conversão", "receita estimada" nem argumento de venda para parceiros.

```sql
-- ✅ APLICADO em 10/06/2026 (migration cliques_e_selos):
create table if not exists public.cliques (
  id bigint generated always as identity primary key,
  produto_id uuid references public.produtos(id) on delete set null,
  loja_slug text,
  origem text,          -- card | produto | comparador | destaque
  movel boolean,        -- veio de celular?
  criado_em timestamptz not null default now()
);
alter table public.cliques enable row level security;       -- sem policy = só service_role
revoke all on public.cliques from anon, authenticated;
create index if not exists idx_cliques_produto on public.cliques (produto_id, criado_em desc);
create index if not exists idx_cliques_data    on public.cliques (criado_em desc);
```
A rota `/r/[id]` (**no ar desde 10/06**): lê a URL real do produto no servidor, grava o clique
(produto, loja, origem, mobile — **sem IP, amigável à LGPD**), filtra bots pelo
user-agent e redireciona. O `robots.txt` que subi hoje já bloqueia `/r/` preventivamente.

**Painel ganha:** cliques/dia, top produtos clicados, cliques por loja, % mobile,
e **receita estimada** = cliques × taxa de conversão típica (3–5%) × ticket médio × comissão.

### Fase 2 — Operar
- Saúde das coletas com **alerta** (se uma loja falhar 2x seguidas → e-mail/Telegram pro admin).
- Log de auditoria (`audit_log`: quem disparou coleta, quem mudou papel, quando).
- Gestão de papéis na tela (promover/rebaixar com clique — só Super Admin).
- Curadoria de notícias (moderador esconde/fixa matérias).

### Fase 3 — Crescer
- Aba **Parceiros** (seção 10): aprovar, suspender, documentos, planos, selos.
- Funil: visitas → cliques → conversões estimadas, por categoria e por loja.
- Relatório mensal exportável (o "prestação de contas" pro sócio).

---

## 4. Escalabilidade no plano grátis — números reais

| Recurso | Limite free | Nosso uso hoje | Veredito |
|---------|------------|----------------|----------|
| Vercel bandwidth | 100 GB/mês | ~zero (imagens vêm das lojas, não de nós) | ≈ 400–500 mil pageviews/mês caberiam |
| Vercel funções | 100 GB-hora/mês; **60 s máx/execução** | minutos/dia | folga enorme |
| Vercel cron | 2 crons, diários | 2 (10h e 20h UTC) | no limite exato (ok) |
| Supabase banco | 500 MB | **~5 MB** | ~1% usado — anos de folga |
| Supabase egress | 5 GB/mês | baixo | 1º limite de banco a estourar com tráfego |
| Supabase Auth | 50.000 usuários ativos/mês | 3 | folga absurda |
| Firecrawl | 1.000 páginas/mês | **~450–600/mês** (3 lojas × ~5-6 págs × 30 dias) | ⚠️ **gargalo nº 1** |
| GitHub Actions | ilimitado (repo público) / 2.000 min/mês (privado) | ~300–450 min/mês | cabe mesmo privado |

**Quantos usuários simultâneos?** A home e as listas são renderizadas e **cacheadas na CDN**
(ISR); usuário anônimo quase não toca o banco. Na prática: **centenas de simultâneos sem
suar; milhares de visitas/dia ok**. O ponto fraco eram as páginas de produto (a comparação
varre até 2.000 linhas por render) — hoje subi o cache delas de 2 para 10 minutos, cortando
~5x o egress no pior caso.

**O que quebra primeiro, em ordem:**
1. **Firecrawl 1.000/mês** — se adicionarmos lojas/frequência. Mitigação: já temos retry com backoff; dá para alternar lojas em dias pares/ímpares, ou pagar o plano Hobby do Firecrawl (US$ 16/mês, 3.000 páginas) quando doer.
2. **Supabase egress 5 GB** — com tráfego alto em páginas de produto. Mitigação aplicada (cache 10 min); próxima: pré-computar comparações na coleta (tabela `comparacoes`), aí cada página lê 1 linha.
3. **Pausa por inatividade do Supabase Free (7 dias)** — *não nos afeta*: os crons tocam o banco 2x/dia.
4. Vercel bandwidth/function-hours — longe.

**Atenção desde já (independe de tráfego):**
- **Backup:** Supabase Free não tem backup. Receita: GitHub Action semanal com `pg_dump` guardando o arquivo como artifact (90 dias de retenção). Posso montar quando quiser — 1 secret (`DATABASE_URL`) + 20 linhas de YAML.
- **Histórico de preços cresce para sempre** (1.611 pontos hoje; ~1.000–2.000/dia em coleta cheia ≈ 30–60 MB/ano). Tranquilo por ora; em 1 ano, compactar pontos antigos (1/dia por produto).

---

## 5. GitHub público × privado

**Hoje: público** (`paulohelon280/PromoRadar`). Sem segredos no histórico (auditei), então não há vazamento — mas:

| | Público | Privado |
|---|---------|---------|
| Código/estratégia de matching e adapters | exposto a qualquer concorrente | protegido |
| Convite a clones do projeto | sim | não |
| Actions | minutos ilimitados | 2.000 min/mês (usamos ~400) |
| Portfólio (você é estudante de ADS) | visível | precisa convidar |

**Recomendação: PRIVADO agora.** O produto é o *banco de dados próprio + matching*, e o
repositório entrega o mapa da mina de graça. O custo (limite de Actions) não nos atinge.
Quando quiser portfólio, extraia depois um repositório-vitrine sem os adapters.
**Como:** GitHub → Settings → General → Danger Zone → *Change visibility* → Private.
(Vercel e Actions continuam funcionando normalmente — a integração usa permissão própria.)

---

## 6. Quando migrar para infraestrutura paga (gatilhos)

| Gatilho | Limiar | Ação |
|---------|--------|------|
| Visitas | > ~40–50 mil/mês sustentado | Vercel Pro (US$ 20/mês): tira o limite de 60 s, crons ilimitados, analytics |
| Egress Supabase | > 4 GB/mês (80% da cota) | Supabase Pro (US$ 25/mês): 250 GB egress, **backups diários**, sem pausa |
| Coleta | precisar de mais lojas/frequência | Firecrawl Hobby (US$ 16/mês) — provavelmente o **primeiro** upgrade |
| Receita | 1º mês com comissão de afiliado recorrente | reinvestir: domínio + e-mail profissional + 1 plano pago |
| Parceiros | 1º parceiro pagante | Supabase Pro vira obrigatório (backup = responsabilidade contratual) |

Ordem provável de gasto: **domínio (~R$ 40/ano) → Firecrawl → Supabase Pro → Vercel Pro**.

---

## 7. Migração futura sem derrubar ninguém

A notícia boa: a arquitetura atual **não exige migração de mudança**, só de upgrade.

- **Vercel Free → Pro / Supabase Free → Pro:** é um botão. Mesmo deploy, mesmas URLs,
  mesmas chaves → **zero downtime, sessões preservadas, banco intacto, SEO intacto**.
- **Domínio próprio (fazer CEDO, não depois):** cookies de sessão e SEO pertencem ao
  domínio. Se trocarmos `promo-radar-mauve.vercel.app` → `promodetec.com.br` com usuários
  ativos, todos deslogam e o Google reaprende do zero. Comprando agora: aponta o DNS na
  Vercel, o `.vercel.app` passa a redirecionar 301 automaticamente, e o custo é ~R$ 40/ano.
  Depois, atualizar `NEXT_PUBLIC_SITE_URL` e as *Redirect URLs* no Supabase Auth e no Google OAuth.
- **Se um dia sair do Supabase** (cenário remoto): exportar com `pg_dump` → novo Postgres;
  o ponto sensível é o **Auth** (hashes de senha exportam; logins Google re-vinculam por e-mail).
  Plano: janela de leitura-somente de ~10 min de madrugada, dual-write de cliques durante a
  troca, e manter o Supabase 30 dias como fallback. Mas honestamente: o caminho natural é
  ficar e escalar o plano.

---

## 8. Monetização — além dos afiliados

| Fonte | Viabilidade | Vantagem | Risco |
|-------|------------|----------|-------|
| **Afiliados** (núcleo) | Alta — já desenhado | Alinhado ao produto; sem atrito | Receita volátil; depende de aprovação dos programas; exige *disclosure* |
| **Destaque patrocinado** | Alta (fase 2) | Margem ~100%; vende com os dados de cliques | Precisa rótulo "patrocinado" claro, senão mina a confiança |
| **Lojas parceiras (assinatura)** | Alta (fase 3 — seção 9/10) | **Receita recorrente previsível** — a melhor espécie | Reputacional; exige verificação séria |
| **Premium para usuários** (alertas avançados, histórico longo, sem patrocinados) | Média (fase 3+) | Recorrente | Só funciona com base grande; alertas precisam existir antes |
| **Newsletter de ofertas** | Alta e barata | E-mail é **ativo próprio** (ninguém tira) | Exige consistência editorial |
| **AdSense/display** | Baixa | Dinheiro fácil | **Não recomendo**: anúncio aleatório em site de comparação destrói credibilidade e suja o design |

**Obrigações desde já:** página "Como o PromoDetec ganha dinheiro" (transparência), aviso de
afiliado perto dos botões de loja (programas como Amazon Associates **exigem** disclosure),
e política de privacidade (LGPD — hoje só coletamos e-mail/nome; cliques sem IP mantêm isso leve).
O rodapé do site já declara, desde hoje: *"O PromoDetec não vende produtos: comparamos preços
públicos e direcionamos você à loja oficial."*

---

## 9. Parceiros Comerciais Verificados — análise estratégica

**Entendimento correto do modelo:** os marketplaces grandes (Kabum, Terabyte, Pichau, ML,
Amazon, Shopee) seguem como **Lojas Oficiais** — nós os exibimos por interesse nosso, com
nossos links de afiliado, e eles não pagam. O programa pago é para **PMEs de tecnologia**
(lojas de informática, e-commerces regionais, montadores, revendas) entrarem na vitrine
**mediante verificação + assinatura**.

### Minha opinião como arquiteto e dono
**Implementaria? Sim — convicto.** É a evolução natural: transforma autoridade (tráfego +
confiança) em receita recorrente, e PMEs não têm canal barato para chegar a comprador
qualificado de hardware. **Mas só na fase certa:** com menos de ~30–50 mil visitas/mês não
há o que vender ao parceiro, e o custo do processo de verificação não se paga.

**Riscos que enxergo (em ordem):**
1. **Reputacional** — um golpe de parceiro respinga na marca. Controle: verificação séria, selo honesto, monitoramento contínuo, kill-switch.
2. **Jurídico (CDC)** — se o PromoDetec parecer parte da venda, pode ser responsabilizado solidariamente. Controle: deixar cristalino que somos **publicidade/indicação** (a transação ocorre 100% no site do parceiro), contrato dizendo isso, selo definido como "verificação documental na data X" e não como garantia de entrega.
3. **Conflito de interesse percebido** — se parceiro pago "vencer" comparações injustamente, o usuário percebe. Controle: ranking de preço **nunca** é alterado por pagamento; destaque pago é rotulado.
4. **Operacional** — verificação manual consome gente. Controle: automatizar o que dá (CNPJ via BrasilAPI, HTTPS, Reclame Aqui raspado periodicamente) e limitar o nº de parceiros no começo (ex.: 10 primeiros).

**Potencial de receita compensa?** Compensa pela *qualidade* da receita (recorrente,
previsível, margem alta), não pelo volume inicial. Cenário realista no 1º ano do programa:
10–30 parceiros × R$ 99–299/mês = **R$ 1.000–9.000/mês** — mais estável que afiliado.

**Quando:** Fase 3. Gatilhos: 50 mil visitas/mês + rastreio de cliques rodando há 3+ meses
(para mostrar números ao parceiro) + 1 pessoa dona do processo de verificação.

**O que construir desde já (custo ~zero, e já comecei):**
- ✅ Rastreio de cliques (SQL pronto — Fase 1 do painel) → vira o argumento de venda.
- ✅ Selo nas lojas (`lojas.selo`) → especificado; aplicar junto com cliques.
- ✅ Disclaimer "não somos loja" no rodapé (no ar hoje).
- ⬜ Página institucional `/confianca` ("Como verificamos lojas") — barata, planta a semente da autoridade.

### Processo de verificação (sua lista, com upgrades)
**Documental (automatizável):** CNPJ ativo e situação na Receita (consulta grátis via
BrasilAPI/minhareceita) · razão social × nome fantasia × domínio do site batendo ·
HTTPS válido · política de privacidade/termos/troca publicadas · endereço e telefone verificáveis.
**Histórico:** mínimo **2 anos de CNPJ** (corta golpista de ocasião) · presença digital consistente (Instagram/Google Business com atividade real) · domínio com idade > 1 ano.
**Reputação (monitorar SEMPRE, não só na entrada):** Reclame Aqui — nota ≥ 7, taxa de resposta > 80%, sem padrão de "não entrega" · Google Reviews ≥ 4,0 · raspagem trimestral automática: se a nota cair do piso → selo suspenso automaticamente até revisão.
**Operacional:** teste de resposta (e-mail/WhatsApp respondido em < 48 h) · política de devolução compatível com o CDC (7 dias) · *upgrade meu:* **compra-teste** (mystery shopping) num item barato antes de aprovar, e re-verificação **trimestral** automática + anual documental.
**Período probatório:** primeiros 90 dias com selo ⚠️ *Em Avaliação* independentemente de tudo acima.

---

## 10. Área "Parceiros Confiáveis" — projeto

**Nome:** "Parceiros Verificados" vence "Parceiros Confiáveis" — *verificado* descreve um
processo (defensável juridicamente); *confiável* promete um resultado (responsabilidade que
não queremos assumir). Os selos abaixo seguem essa lógica.

### Selos (sistema visual)
| Selo | Quem | Visual |
|------|------|--------|
| ✅ **Loja Oficial** | Os 5+ marketplaces que NÓS integramos | discreto, cinza-verde, ao lado do nome da loja |
| 🛡️ **Parceiro Verificado** | PME aprovada no processo | azul-aço com tooltip "verificado em DD/MM/AAAA — veja os critérios" linkando `/confianca` |
| ⭐ **Parceiro Premium** | Verificado + assinatura de destaque | dourado sutil + rótulo **"patrocinado"** quando em posição de destaque |
| ⚠️ **Em Avaliação** | Parceiro nos primeiros 90 dias | âmbar — honestidade que blinda a marca |

Regra de ouro: o selo aparece no **card do produto, na página do produto e na comparação** —
sempre ao lado do nome da loja, nunca maior que o preço. E **selo jamais altera ordenação por preço**.

### Onde fica na plataforma (decisão de UX)
- **Produtos de parceiros MISTURADOS nas listas e comparações** — com o selo visível. É isso
  que o parceiro compra (estar na disputa real) e o selo é o que protege o usuário. Aba
  separada esconderia os parceiros e mataria o valor do produto.
- **Seção própria na home**: "🛡️ Ofertas de Parceiros Verificados" (4–8 cards) — vitrine que
  justifica o plano Premium.
- **Página institucional `/parceiros`**: o que é o programa, critérios públicos de verificação,
  formulário de candidatura. No rodapé desde já; no menu principal só quando houver ≥ 5 parceiros.
- **Nas buscas**: filtro "só verificados" (checkbox) — controle na mão do usuário.

### Painel admin (aba Parceiros — fase 3)
Fila de candidaturas com checklist de verificação → aprovar/reprovar com motivo · documentos
anexados · status do selo (ativo/suspenso/em avaliação) · plano e cobrança (Stripe/Mercado Pago
por fora no início) · reputação monitorada (gráfico Reclame Aqui ao longo do tempo) · botão
**suspender imediatamente** (kill-switch) · histórico de re-verificações.

### Banco de dados — preparar agora?
**Sim para o tijolo barato, não para o prédio.** Hoje: a coluna `lojas.selo`
(`oficial | verificado | premium | avaliacao`) — custo zero, já especificada (aplico junto
com a tabela de cliques quando você autorizar). O schema completo abaixo fica **pronto no
papel** e só entra quando o programa for real (tabela vazia não dá lucro, só ruído):

```sql
-- FASE 3 — aplicar quando o programa de parceiros nascer:
create table public.parceiros (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references public.lojas(id),
  cnpj text not null unique,
  razao_social text not null,
  site text not null,
  contato_email text not null,
  status text not null default 'candidato'
    check (status in ('candidato','em_verificacao','aprovado','suspenso','encerrado')),
  plano text check (plano in ('basico','premium')),
  selo text not null default 'avaliacao' check (selo in ('verificado','premium','avaliacao')),
  aprovado_em timestamptz, suspenso_em timestamptz, criado_em timestamptz not null default now()
);
create table public.parceiros_verificacoes (
  id bigint generated always as identity primary key,
  parceiro_id uuid not null references public.parceiros(id) on delete cascade,
  tipo text not null,           -- cnpj | https | reclame_aqui | reviews | compra_teste | reverificacao
  resultado text not null,      -- ok | alerta | reprovado
  detalhe jsonb, verificado_em timestamptz not null default now()
);
alter table public.parceiros enable row level security;
alter table public.parceiros_verificacoes enable row level security;
-- sem policies = só service_role/painel admin
```

### Como gero receita sem estragar a experiência
1. Preço continua mandando em toda comparação (inegociável).
2. Patrocínio = **posição extra** (seção da home, destaque), nunca posição *roubada*.
3. Tudo pago é rotulado "patrocinado" (além de ético, é exigência do CONAR).
4. Densidade controlada: máx. ~1 destaque pago a cada 8 cards orgânicos.
5. O selo conta a verdade: data da verificação + link para os critérios públicos.

---

## Mudanças aplicadas nesta auditoria (resumo técnico)

| Commit | O quê |
|--------|------|
| `fbdecc2` | Página de produto enriquecida (comparação entre lojas, histórico gracioso, relacionados) |
| `dc2de5b` | Rebrand **PromoDetec** (logo, favicons, manifest, metadados, textos) |
| `7cf6e21` | Papéis + guardas de API + middleware de sessão + robots.txt |
| (este) | Cache da página de produto 2→10 min (egress) + este documento |
| Banco | Migration `papeis_admin_e_bloqueio_escalacao` aplicada e verificada em produção |

**Aplicado em 10/06/2026, após aprovação do dono:** helon280 = Super Admin · hardening fino das
funções (`hardening_funcoes`) · tabela `cliques` + rota `/r/` (cliques contando) · `lojas.selo`
(`cliques_e_selos`) · workflow de backup criado.

**Pendências que dependem de você:** repositório privado (5.) · 2FA nas contas · leaked-password
protection (2 cliques) · secret `SUPABASE_DB_URL` no GitHub para o backup rodar (instruções no
topo de `.github/workflows/backup.yml`).
