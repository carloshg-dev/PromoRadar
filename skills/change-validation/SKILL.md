---
name: promodetec-change-validation
description: Use antes de declarar qualquer alteração do PromoDetec pronta, antes de staging/commit e sempre que o usuário pedir build, revisão ou verificação. Protege árvore suja, escolhe testes proporcionais e exige runtime visual para frontend.
---

# Validação de mudanças do PromoDetec

## Antes de editar

1. Leia `MISTAKES.md`.
2. Rode `git status --short --branch`.
3. Identifique mudanças pré-existentes e não as reverta, mova ou formate.
4. Mapeie callers, contratos e persistência dos arquivos afetados.

## Matriz de validação

- TypeScript/serviço: `npm run typecheck` e teste focado, se existir.
- Next.js/rotas compartilhadas: `npm run typecheck` + `npm run build`.
- Cloudflare/OpenNext: use também `skills/cloudflare-cutover/SKILL.md`.
- UI: build mais servidor real, console e inspeção desktop/mobile.
- Banco: valide migrations e contratos; nenhuma DDL remota sem aprovação.
- Feed grande: prove streaming/lotes e uso limitado de memória; nunca carregue o arquivo inteiro.

## Checklist de UI

1. Inicie o servidor em porta livre.
2. Teste a rota alterada com dados reais ou fallback honesto.
3. Confira desktop e mobile, overflow, texto, imagens, interação e estados vazios.
4. Leia erros do console e falhas de rede relevantes.
5. Pare o servidor ao terminar.

## Autenticação e medição com persistência real

Quando alterar autenticação, `/api/track`, relatórios ou o contrato de eventos, não usar HTTP 204 ou mocks como prova de gravação:

1. Usar Supabase local próprio e vazio, com API/PG somente em loopback e credenciais locais fora do checkout. Conferir os bindings efetivos.
2. O fixture `tests/integration/fixtures/measurement-auth.sql` requer transação com `SET LOCAL promodetec.lab = 'measurement-auth'`. É referência local, não migration nem cópia das políticas remotas.
3. Preparar cópia separada da aplicação sem `.env`/`.dev.vars`. Executar `npm run test:auth-measurement` no Linux com `PROMODETEC_AUTH_LAB_APP` e `PROMODETEC_AUTH_LAB_ENV` absolutos. Ver procedimento e pré-requisitos em `docs/AUTH_MEDICAO_2026-10-20.md`.
4. Conferir persistência dos tipos, deltas do relatório, consentimento, falhas atômicas e cookies reais de usuário/admin. A ferramenta não segue a loja nem permite `fetch` externo; não remover essas guardas para contornar uma falha.
5. Registrar o limite: fixture/Next dev não prova RLS de produção, OAuth, recuperação de senha ou escrita no Cloudflare. Encerrar somente os serviços próprios ao terminar, preservando volumes.

## Revisão do diff

```powershell
git diff --check
git diff --stat
git status --short
```

Revise arquivos binários, lockfile, line endings e segredos. Não atribua ao seu trabalho mudanças que já estavam na árvore.

## Staging seguro

Somente quando autorizado, use caminhos explícitos:

```powershell
git add -- caminho1 caminho2
git diff --cached --check
git diff --cached --name-only
git diff --cached
```

Evite `git add -A` em árvore suja. Commit, push e deploy exigem pedidos próprios.

## Saída esperada

Relate alterações, comandos aprovados, resultado objetivo, limitações e estado de publicação. “Build passou” não significa “site no ar”.
