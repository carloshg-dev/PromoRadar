# Retenção das comparações: candidato para revisão

25/10/2026, Brasília. Esta etapa prepara a manutenção do cache privado no runner. Não publica uma nova aplicação nem executa exclusões em produção.

## Estado medido

- O gatilho automático `workflow_run` executou com sucesso o Actions [40201873261](https://github.com/carloshg-dev/PromoRadar/actions/runs/40201873261), concluído em 25/10 às 11:24:59 BRT. Checkout `675b9d318f7a23cf1d24d598d188750be0f8a710`; recibo com 38.159 ofertas, 211 comparações, 45 escopos e índice `2882b9cb-2047-40dc-8e71-171a3a6dbd80`. É prova de uma execução automática após coleta; não prova repetição diária por `schedule`.
- A leitura real do Storage às 22:37:32 BRT encontrou esse índice ativo e três gerações sem manifesto individual. A simulação preservou todas: zero objetos candidatos e zero exclusões. O guard de rede permitiu somente GET e o POST de listagem: sete GETs e duas listagens, nenhuma tentativa de mutação. Não foram criados manifests retroativos com base em suposições.
- Nova conferência pública HEAD: catálogo 200; Awario e MJ12 403; alias `workers.dev` 404. Não houve carga artificial nem escrita de eventos. CPU antes/depois continua dependendo de janelas comparáveis; a checagem de 26/10 às 11h BRT já estava agendada.

## Impacto e política

- O gerador grava um manifesto imutável `v1/<UUID>/index.json` depois de todos os objetos e antes do ponteiro global. Falhar nesse manifesto preserva o ponteiro anterior. O leitor público continua usando o mesmo schema, versão e caminhos; não há mudança em páginas, autenticação, PromoScore ou links afiliados.
- A ferramenta `npm run cache:comparisons:retention` simula por padrão. Mantém sempre o índice ativo, as três gerações completas mais recentes e qualquer geração com menos de sete dias. Gerações antigas/partidas sem manifesto são preservadas para revisão manual; não há promessa de eliminar esses órfãos automaticamente.
- Só considera os caminhos conhecidos desse bucket, com UUID/hash/schema válidos e metadados seguros. Interrompe em leitura incompleta, paginação repetida, objeto desconhecido, data recente/futura ou tamanho inválido.
- A RAM contém uma página de 100 metadados, três manifestos recentes e um lote de até 100 exclusões. Os caminhos do plano ficam em NDJSON temporário, lidos por stream. Há tetos de varredura por prefixo e de 100.000 objetos candidatos; atingir um teto interrompe o planejamento antes de qualquer exclusão.
- Exclusão exige `--apply --expected-version=<UUID ativo>`, após revisão. Revalida elegibilidade dos manifestos e o índice antes de cada lote; mudança do índice interrompe a operação. Uma falha após lotes bem-sucedidos pode deixar remoção parcial, sem retorno de sucesso; repetir exige nova simulação. O marcador da geração é emitido por último para favorecer retomada.
- O Storage permanece privado, sem DDL, novas policies, chaves ou migração de conta. Nenhum produto, histórico ou evento é removido.

## Automação proposta

O workflow existente recebe somente uma etapa de **simulação** após gerar o cache e anexa os dois recibos, inclusive quando uma etapa falha. Não contém `--apply`. A alteração do workflow precisa chegar também a `main`, depois da aprovação do código no ramo de produção; a agenda usa a versão do workflow em `main` e faz checkout de `codex/cloudflare-migration`.

Geração, manutenção e rollback precisam usar a mesma exclusão operacional (`comparison-snapshots`). A checagem do índice reduz corridas, mas não é uma transação distribuída: não executar um rollback manual ou outro writer em paralelo com `--apply`. O modo automático proposto não exclui nada.

## Revisão e ativação

1. Revisar a PR do código e validar CI antes de integrar no ramo de produção. A integração nesse ramo inicia o fluxo de publicação existente; não foi acionada nesta etapa.
2. Integrar depois a PR de `main` contendo somente o workflow. Assim a simulação acompanha cada geração sem depender deste computador.
3. Aguardar gerações com manifesto e revisar um recibo com candidatos reais antes de autorizar exclusão. Os três legados atuais continuam fora da limpeza.

O procedimento respeita `CLAUDE.md`: “Não faça deploy, DNS, DDL, rotação de segredo ou mutação em produção sem aprovação humana explícita” e a instrução de gerar, validar e aguardar revisão. Apenas preparo e leituras remotas nesta etapa.

## Referências

- [Supabase: exclusão de objetos](https://supabase.com/docs/guides/storage/management/delete-objects): usar Storage API; exclusão é permanente, não SQL.
- [Supabase: listagem paginada](https://supabase.com/docs/reference/javascript/storage-from-list): a implementação usa o método estável `list`, com limite/offset e ordenação; não depende do `listV2` experimental.
- Evidência agregada em `evidence/comparison-retention-2026-10-25.json`. A validação e as PRs são registradas ao concluir a revisão local.

## Validação concluída e entrega para revisão

- [PR #5: código](https://github.com/carloshg-dev/PromoRadar/pull/5) e [PR #6: workflow em main](https://github.com/carloshg-dev/PromoRadar/pull/6), ambas em rascunho, sem integração. #6 depende da integração de #5.
- [CI 40256036514](https://github.com/carloshg-dev/PromoRadar/actions/runs/40256036514), código `d2fc5e3b0d81825e6154020dfbf26bf3cb858382`, Node 22/Linux: tipagem da aplicação e dos dois scripts, 67 testes de crescimento (dez de retenção), 22 de coleta e teste de memória da coleta aprovados. Os ensaios de 20 mil/200 mil linhas de coleta mediram 129,3/157,9 MiB; não são medição de RSS da retenção nem de CPU do Worker.
- Windows: tipagem da aplicação/dos scripts aprovada; 88 contratos antes do último caso de retenção e dez casos de retenção após esse acréscimo. CLI `--help` funciona sem credencial; `--apply` sem UUID esperado é rejeitado antes de acessar o banco.
- YAML válido; somente dry-run na etapa automática; zero valores de secrets conhecidos nos arquivos staged. Os quatro screenshots locais da etapa anterior ficaram fora dos commits.
- Não foi repetido build/preview do Worker: os callers afetados são somente runners/testes, sem novo import em rotas. A validação de runtime público desta etapa usa o release já publicado. O status Vercel continua com o bloqueio anterior da conta; o CI de contratos é o gate aprovado, sem afirmar que todos os provedores estão verdes.
- Nenhum merge, deploy ou comando de exclusão remota foi executado. O relatório e o diff foram abertos no Codex para revisão humana.
