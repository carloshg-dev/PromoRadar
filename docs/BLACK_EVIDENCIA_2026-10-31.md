# Black em evidência — release de 31/10/2026

## Resultado verificado

Direção A escolhida pelo proprietário, com continuidade e publicação pré-aprovadas. [PR #11](https://github.com/carloshg-dev/PromoRadar/pull/11) integrada na `main` em `0ed13376498c034cef119b181fcfee976d4a9e68`. O candidato funcional `d7c84eff01d556b0c3c67490367a10cdb426d3e9` e a integração têm os mesmos arquivos da aplicação/workflow.

Painel autenticado da conta `0fcbdab34f0d44e0e948a4bb2f051810`: Worker `promodetec`, fonte `main`/`0ed1337`, build `7a679339-fdce-4ab2-b85c-b80edbb3345c`, versão **108b097a**, **Ready / 100%**, duração exibida 2m43s. O domínio público carregou a campanha `esquenta-black`, CSS/JS atuais, missão literal e 24 ações de salvar. Não foi necessário acionar hook manual ou alterar branch, DNS ou rotas.

## Mudanças e impacto

- Hero compacto em tinta/lime; produtos, preço, histórico e CTA ganham prioridade. A missão aprovada e o conteúdo do rodapé foram preservados.
- Curadoria em memória sobre pools já limitados: diversidade de lojas/categorias, histórico real como critério e deduplicação entre vitrines. Filtro de perfume pessoal evita aromatizadores automotivos nessa vitrine. As restrições de segurança das lojas permanecem. Duas leituras do destaque antigo foram removidas.
- Salvar nos cards reaproveita radar local e eventos existentes, condicionados ao consentimento. Não cria tracking, identificador, schema ou persistência remota novos.
- Calendário explícito 2026 em `America/Sao_Paulo`, conforme `SEASONAL_PLAN_2026-10-30.md`. Bootstrap e provider sincronizam paleta/copy em páginas com cache e abas abertas. Verificação a cada minuto só em abas visíveis; sem fetch, cron no computador ou novo deploy por fase.
- Animação de entrada do histórico removida para exibir o ponto final estável também no celular. Sem alteração dos dados/séries.

## Validação do candidato

- Tipos, build Next e **74 testes** aprovados; testes cobrem diversidade/deduplicação/segurança, filtro de perfume e todas as fronteiras do calendário/VM bootstrap.
- [CI de crescimento 41171259007](https://github.com/carloshg-dev/PromoRadar/actions/runs/41171259007) aprovado.
- [OpenNext/workerd 41171255955](https://github.com/carloshg-dev/PromoRadar/actions/runs/41171255955) aprovado sem publicar: **1.573,17 KiB gzip**, limite 3.072 KiB; **23/23 contratos HTTP**; buildId `xcRLzoBgpQuzbHxtWhZ4X`, Wrangler 4.151.2 e compatibilidade pedida/efetiva `2026-08-23`. O subprocesso recebeu somente variáveis públicas, sem service role/token Cloudflare. Recibo local: `reports/black-evidencia-ci-41171255955/worker-ui-receipt.json`.
- QA local de home em 1440/768/390/320 e ofertas/produto/comparador/login nas coberturas registradas. Revisão Impeccable fresca encerrou seed/cartão de referência, histórico mobile e documentação, com **ship**. Esse parecer cobre os ajustes apontados, sem certificar backend/produção. Detector executado uma vez; 14 observações consultivas, sem achado primário.
- WSL local não iniciou; não houve reinício compartilhado. O preflight API `41171257797` recebeu **401**, separado do build aprovado. Sessão já existente do navegador permitiu confirmar a conta/publicação e os nove nomes de variáveis de runtime. Não foi criado/rotacionado segredo. `NEXT_PUBLIC_TEMA_FORCE` ausente nos nomes de configuração consultados.

## Verificação pública

**17/17 contratos HTTP** aprovados, incluindo apex/www, campanha/copy, CSS das fases futuras, JS, busca/categoria, cupons, login, contato, robots/sitemap, comparação com dados, busca de produto, detalhe com orientação da loja, admin/callback anônimos e HEAD técnico de saída. Recibo: `reports/black-evidencia-public-smoke-2026-10-31.json`.

Home em 1440/390/320 sem overflow horizontal observado. A amostra publicou **24 produtos únicos**; a primeira seleção local incluiu sete lojas. Busca enviada no navegador retornou 60 cards, salvar/remover alterou `aria-pressed` e o radar, e o item próprio de teste foi removido. Comparador público mobile exibiu **60 grupos reais**, sem a recuperação de indisponibilidade vista no laboratório. Medição rejeitada; console da amostra sem warnings/erros. Capturas/recibo: `.impeccable/review/black-evidencia/public-*`.

Uma foto externa da Dufrio ficou indisponível fora da primeira tela durante a inspeção; nenhuma foto visível da abertura falhou. Isso limita a afirmação sobre integridade de todas as imagens e merece o próximo lote de qualidade do catálogo.

Leitura separada do Storage, somente GET com limite de bytes: índice gerado em `2026-10-30T17:00:51.265Z`, idade 12,25 h na consulta de 31/10 às 05:15 UTC, dentro de 48 h. Schema e versão/horário do escopo tech válidos; 60 grupos e 60 atuais. Recibo: `reports/black-evidencia-comparison-readonly.json`. Não foi regenerado índice nem alterado dado para este release.

## Limites e próxima ação

Viradas de campanha foram provadas por testes/VM, sem captura de navegador com relógio futuro. Não houve OAuth/login real, gravação sintética de evento, clique afiliado humano ou compra. HTTP e build não medem CPU, carga, falsos positivos do WAF nem aumento de conversão; o problema de CPU anterior não está declarado resolvido por este visual. Não houve cobrança, DDL, mudança de DNS/WAF ou recuperação/migração do banco.

Próxima ação operacional: medir CPU/1102 em janelas equivalentes deste release, separando bots/pessoas e latência/CPU; tratar a foto externa indisponível no lote de qualidade do catálogo. Campanhas posteriores já usam o calendário publicado, sem nova escolha de direção.
