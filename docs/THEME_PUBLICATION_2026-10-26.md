# Novo visual publicado em 26/10/2026

O domínio continuava com o tema anterior porque o Cloudflare publicava `codex/cloudflare-migration`, enquanto a interface aprovada havia sido integrada na `main` pela PR #7. A versão anterior foi confirmada no painel autenticado como `51d08bbd`, commit `2878a44`, com 100% do tráfego.

## Correção e efeito

A branch de produção e a branch do acionamento manual existente foram alteradas para `main` e relidas após salvar. A `main` foi conferida em `49ef8bb79a6bb97fc53c7fc4398097db742e1c11` antes e depois do acionamento. Novas integrações nessa branch passam a alimentar o build automático do Cloudflare. Não houve mudança de código da aplicação, comandos de build/deploy, DNS, WAF, secrets, bindings, banco ou cobrança.

O token de API local foi recusado; o preflight somente leitura do GitHub também retornou 401, no run [40416399728](https://github.com/carloshg-dev/PromoRadar/actions/runs/40416399728). A sessão existente da conta do domínio foi retomada via Google e o acionamento de publicação já configurado foi usado uma vez, sem gerar ou ampliar credenciais. A URL privada não é parte deste relatório. O arquivo temporário usado para o acionamento foi removido imediatamente.

## Publicação comprovada

| Campo | Resultado |
| --- | --- |
| Conta | `0fcbdab34f0d44e0e948a4bb2f051810` |
| Worker | `promodetec` |
| Fonte | `main` |
| Build | `eae8a468-d4c8-437c-9e26-2bc4e1b28b54` |
| Versão | `12f5eb42-9be8-4c2b-a549-a8800b158c9c` |
| Estado / tráfego | Ready / 100% |
| Home pública | “Encontre seu próximo bom negócio.”, fundo `rgb(246, 247, 243)` |
| HTTP público | 20 aprovados, zero falhas |

O painel não mostrou SHA no registro do acionamento manual. A ponta remota observada antes/depois e a interface servida correspondem ao candidato aprovado; não se apresenta o SHA como metadado copiado desse registro. A homologação anterior do pacote e seus limites permanecem em `docs/MAIN_PROMOTION_2026-10-26.md`.

## Validação e limites

O smoke usou respostas limitadas a 2 MiB e requisições sintéticas de GET/HEAD, sem seguir saídas para lojas. Confirmou apex/www com TLS, HTML/CSS/JS novos, catálogo, busca, produto, comparador, cupons, robots/sitemap, auth anônima e proteção de admin. HEAD e prefetch de `/r` retornaram 204; os dois agentes declarados de teste retornaram 403 e o alias `workers.dev` permaneceu 404. São contratos pontuais, não um teste de carga ou uma avaliação de falsos positivos.

No navegador público, a medição foi rejeitada. Desktop de 1287 px e celular de 390 px exibiram o tema e não apresentaram overflow horizontal na amostra. Menu móvel abriu/fechou; a busca enviada por formulário chegou a `/ofertas?busca=fone`, com 60 produtos. Console verificado sem warnings/erros. O viewport temporário foi restaurado; a home pública foi mantida como resultado visível.

Não foram feitos login/OAuth real, inserção de eventos ou clique humano afiliado. A publicação não comprova melhoria de CPU ou estabilidade sustentada. O token externo usado pelo GitHub continua sem acesso; o acionamento de build do Cloudflare funcionou com sua integração existente. O workflow de comparações conserva o checkout explícito anterior, sem mudança de geração ou retenção nesta tarefa.

Recibos locais agregados, ignorados pelo Git: `reports/theme-publish-trigger-2026-10-26.json`, `reports/theme-cloudflare-version-2026-10-26.json`, `reports/theme-public-smoke-2026-10-26.json` e `reports/theme-publish-preflight-2026-10-26/cloudflare-preflight.json`. Capturas: `reports/theme-live-desktop-2026-10-26.png` e `reports/theme-live-mobile-2026-10-26.png`.

Rollback disponível: reativar a versão anterior `51d08bbd` pelo histórico de implantações, com validação humana e novo smoke. Não foi necessário executar rollback. Os quatro screenshots preexistentes no working tree continuam preservados.
