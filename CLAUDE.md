# PromoDetec

Guia curto para Claude Code, Codex e outros agentes. Mantenha este arquivo com no máximo 100 linhas.

## Leitura obrigatória

1. Leia `MISTAKES.md` antes de planejar ou editar.
2. Leia `docs/PROJECT_STATE.md` antes de afirmar estado de deploy, DNS, coleta ou produção.
3. Leia `docs/ARCHITECTURE.md` antes de alterar fronteiras ou runtimes.
4. Consulte a skill aplicável em `skills/` antes de repetir um fluxo conhecido.
5. Rode `git status --short --branch` e preserve toda mudança que não seja sua.

## Produto

O PromoDetec compara preços públicos, histórico e PromoScore em várias categorias. Ele não vende produtos; links monetizados saem por `/r/{id}` para registrar métricas sem expor segredos no cliente.

## Arquitetura

- Next.js 14 App Router, React 18, TypeScript estrito, Tailwind e Supabase.
- `src/core`: domínio puro, sem I/O.
- `src/infrastructure`: Supabase, repositórios, integrações e adapters.
- `src/services`: orquestra casos de uso. Preserve os contratos de `collection.service.ts`.
- `produtos.repo.ts`: fronteira de leitura da aplicação; não replique consultas em componentes.
- `src/app`: rotas, páginas e composição; `src/components`: UI e interações.
- Feeds grandes nunca vão ao frontend nem são carregados inteiros na RAM. Use streaming e lote no servidor.

## Infraestrutura

- A aplicação pública roda no Cloudflare Workers com OpenNext. Confirme branch, versão e bindings no estado operacional antes de publicar.
- Coletas pesadas continuam no GitHub Actions; o Worker não executa Playwright nem importa o grafo pesado de scraping.
- Supabase é a persistência. `service_role` existe somente em servidor/workflow.
- O estado atual e os gates de cutover ficam em `docs/PROJECT_STATE.md`.

## Segurança operacional

- Não faça deploy, DNS, DDL, rotação de segredo ou mutação em produção sem aprovação humana explícita.
- Nunca mostre, grave em logs ou versione valores de secrets. Valide apenas nomes/presença.
- Não remova Vercel antes de URL do Worker, domínio, TLS, rotas críticas e rollback estarem comprovados.
- Não altere lógica de PromoScore, histórico ou redirect afiliado sem mapear callers, persistência e métricas.
- Separe sempre: fato medido, hipótese e recomendação.

## Fluxo de trabalho

1. Faça análise de impacto e identifique arquivos/callers afetados.
2. Explique o plano e os riscos relevantes.
3. Edite apenas o escopo aprovado; use padrões existentes.
4. Valide conforme `skills/change-validation/SKILL.md`.
5. Mostre arquivos alterados, evidências e limites não verificados.
6. Commit, push, deploy e DNS são etapas separadas; nunca presuma uma pela outra.

## Skills do projeto

- `skills/cloudflare-cutover/SKILL.md`: build, deploy, domínio, DNS, smoke e retirada da Vercel.
- `skills/change-validation/SKILL.md`: validação proporcional, working tree e staging seguro.
- `skills/safe-collection/SKILL.md`: feeds, scraping, upsert, stale sweep e memória limitada.
- `skills/seasonal-campaign/SKILL.md`: campanhas sazonais, assets, calendário e QA responsivo.

Quando uma tarefa recorrente ainda não tiver skill, registre o padrão após a segunda ocorrência. Evite skills para tarefas triviais ou únicas.

## Comandos-base

- Desenvolvimento: `npm run dev`
- Tipos: `npm run typecheck`
- Build Next: `npm run build`
- Build Cloudflare: `npm run cf:build`
- Coleta local: `npm run scrape`

## Git

- Não reverta mudanças de terceiros.
- Prefira staging por caminhos explícitos; evite `git add -A` em árvore suja.
- Antes de commit: `git diff --check`, `git diff --cached --name-only` e revisão do diff staged.
- Só declare publicado após confirmar commit remoto e ambiente de destino.

## Definição de pronto

Código tipado e buildado, comportamento relevante exercitado, UI verificada em desktop/mobile quando aplicável, secrets ausentes do diff e estado descrito sem confundir working tree, GitHub, deploy e produção.
