# PromoRadar — Redesign UX + Autenticação

## 1. Auditoria do frontend anterior (problemas)

1. Sem feedback de carregamento (nenhum skeleton).
2. Estados vazios crus, sem orientar a próxima ação.
3. Navegação rasa: sem busca global, sem command palette, sem breadcrumbs.
4. Sem design system — `Card`/`Badge` soltos, estilos inline repetidos.
5. Página de produto era só um gráfico, não uma central de inteligência.
6. Autenticação inexistente (login/cadastro eram cosméticos).
7. Hierarquia visual plana — PromoScore e menor preço não saltavam aos olhos.
8. Nenhuma personalização/onboarding.

## 2. Melhorias entregues

**Design System** (`src/components/ui/`): `Button` (variantes/tamanhos), `Input`, `Skeleton` + `GridSkeleton`, `Tooltip`, `Kbd`, `Breadcrumbs`, `EmptyState`, refino de tokens de cor no Tailwind.

**Navegação**: navbar reprojetada com busca, menu de usuário reativo à sessão, e **Command Palette estilo Raycast (Ctrl+K)** com busca de produtos em tempo real e atalhos.

**Página de produto → central de inteligência**: KPIs (preço atual, menor histórico, média, tendência %), gráfico de histórico, e **insights automáticos** gerados por regras (`src/core/insights/`) — ex: "menor preço já registrado", "37% abaixo da média", "tendência de queda".

**Ofertas/Categoria**: breadcrumbs, filtros, e estados vazios inteligentes com ação.

**Microinterações**: animações `fade-up`, hover states, `active:scale`, foco acessível.

## 3. Componentes novos

`ui/button`, `ui/input`, `ui/skeleton`, `ui/tooltip`, `ui/kbd`, `ui/breadcrumbs`, `ui/empty-state`, `command-palette`, `search-trigger`, `user-menu`, `layout/navbar`, `auth/auth-form`, `auth/auth-aside`, `auth/auth-shell`, `auth/onboarding-client`, `core/insights`.

## 4. Autenticação Supabase (completa)

- **Login, Cadastro, Recuperação de senha** — páginas `/login`, `/cadastro`, `/recuperar`.
- **Login com Google** (OAuth) — botão integrado.
- **Sessão persistente** via cookies (`@supabase/ssr`), com `middleware.ts` refrescando a sessão.
- **Rotas protegidas**: `/admin`, `/onboarding`, `/alertas`, `/conta` redirecionam para login.
- **Tela premium**: split com benefícios + estatísticas reais (produtos/preços do banco) ao lado do formulário.
- **Onboarding**: após o 1º login, o usuário escolhe interesses (GPUs, CPUs, SSDs…), salvos no perfil para personalização futura.
- **Banco**: trigger cria o perfil em `usuarios` automaticamente no cadastro; colunas `interesses`, `onboarding_completo`, RLS por usuário.

## 5. Configuração necessária no painel do Supabase (você precisa fazer)

A autenticação por e-mail já funciona após o deploy. Para os extras:

### a) URLs de redirecionamento
Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://SEU-SITE.vercel.app`
- **Redirect URLs**: adicione `https://SEU-SITE.vercel.app/auth/callback` e `http://localhost:3000/auth/callback`

### b) Login com Google (opcional, mas pedido)
1. Crie credenciais OAuth no Google Cloud Console (gratuito): APIs & Services → Credentials → OAuth client ID → tipo "Web application".
2. Em "Authorized redirect URIs" cole a URL que o Supabase mostra (algo como `https://sksjukjkxkptresysbno.supabase.co/auth/v1/callback`).
3. Copie o **Client ID** e **Client Secret**.
4. No Supabase → **Authentication → Providers → Google** → cole os dois e ative.

Sem esse passo, o botão "Continuar com Google" mostra erro; o login por e-mail continua funcionando normalmente.

### c) Confirmação de e-mail
Por padrão o Supabase exige confirmação por e-mail no cadastro. Em **Authentication → Providers → Email** você pode desligar "Confirm email" para testes, ou manter ligado em produção.

## 6. Dependência nova

Foi adicionada `@supabase/ssr` ao `package.json`. Rode `npm install` antes do build.

## 7. O que fica para a próxima fase

- Página `/conta` para redefinir senha após o link de recuperação.
- Usar os interesses do onboarding para filtrar a home e alimentar alertas.
- Skeletons com Suspense streaming nas listagens (componentes já prontos em `ui/skeleton`).
- Painel admin com KPIs visuais ampliados.
