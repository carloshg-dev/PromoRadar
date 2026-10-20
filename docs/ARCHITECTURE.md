# Arquitetura do PromoDetec

Este documento descreve fronteiras estáveis. Estado de deploy e incidentes pertencem a `docs/PROJECT_STATE.md`.

## Aplicação

- Next.js 14 App Router, React 18, TypeScript estrito e Tailwind.
- `src/core`: domínio e regras puras, sem I/O.
- `src/services`: casos de uso e orquestração. Preserve contratos de `collection.service.ts`.
- `src/infrastructure`: Supabase, repositórios, scraping e integrações externas.
- `src/app`: rotas, páginas, handlers e composição.
- `src/components`: apresentação e interação; consultas devem vir de serviços/repositórios.

## Dados

- Supabase guarda produtos, histórico, métricas e logs.
- `produtos.repo.ts` é a fronteira de leitura de produtos; evite SQL duplicado em UI.
- PromoScore, histórico e identidade do produto são contratos core. Mudanças exigem análise de callers, persistência e regressão.
- Feeds grandes são processados no servidor por streaming, seleção limitada e upsert em lote. O frontend recebe somente o conjunto curado.

## Runtimes

- Cloudflare Worker com OpenNext atende a aplicação web.
- GitHub Actions executa coleta, ingestão, manutenção e backup.
- Playwright e Chromium pertencem ao runtime de coleta e não podem entrar no bundle do Worker.
- Secrets de servidor nunca usam prefixo `NEXT_PUBLIC_` nem chegam ao navegador.

## Links afiliados

- Saídas monetizadas passam por `/r/{id}` para preservar tracking e métricas.
- Componentes não devem montar URLs secretas nem substituir o redirecionamento por links diretos sem decisão explícita.

## Pendência conhecida

Há `middleware.ts` na raiz e `src/middleware.ts` com responsabilidades e matchers diferentes. Não remova nenhum deles até mapear qual arquivo o build consome e consolidar autenticação/proteção em uma alteração própria.
