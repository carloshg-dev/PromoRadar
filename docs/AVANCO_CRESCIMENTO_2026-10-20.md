# PromoDetec: catálogo confiável e validação da entrega

20/10/2026. Implementação e laboratório locais. **Sem publicação ou alteração no banco de produção.**

Continuação no mesmo dia: [curadoria recente da home e redução de prefetch](UPGRADE_HOME_2026-10-20.md). O registro abaixo descreve a etapa anterior; a política das vitrines foi ampliada na continuação.

Esta etapa continua o [plano de crescimento](PLANO_CRESCIMENTO_2026-10-19.md). O avanço principal foi corrigir a coleta que escondia falhas, medir a idade do catálogo e tornar os preços antigos explícitos para o visitante. O bloqueio anterior de compilação no Windows foi contornado com um laboratório Linux isolado; o navegador também ficou disponível para QA.

## O problema comprovado

A [execução agendada Shopee de 19/10](https://github.com/carloshg-dev/PromoRadar/actions/runs/39203743608), no SHA `6d398524c171da9403c76bce01f6561ed743afc4` da `main`, leu 100.000 linhas, considerou 98.513 candidatos válidos e salvou 7.955 selecionados. A retirada de ofertas antigas recebeu `statement timeout`, mas o workflow terminou verde. A consulta aos logs foi somente de leitura e os resumos foram sanitizados.

Evidência: [execução e causa](evidence/shopee-run-2026-10-20.json). Isso não comprova que todos os produtos antigos estejam esgotados nas lojas.

A nova leitura do banco ocorreu entre 19/10 às 23:51:52 e 23:51:58 de Brasília, com corte móvel de sete dias:

| Indicador | Resultado |
| --- | ---: |
| Ofertas públicas disponíveis com preço positivo | 107.617 |
| Sem nova observação há mais de sete dias | 61.107 (56,8%) |
| Disponíveis sem `visto_em` | 0 |
| Shopee disponíveis / sem observação recente | 73.986 / 38.639 |
| AliExpress disponíveis / sem observação recente | 14.121 / 11.307 |
| Amazon disponíveis / sem observação recente | 2.701 / 1.902 |
| Extra e Ponto Frio disponíveis, todos antigos | 899 / 898 |

Contagens cadastrais, sem conferência no checkout e sem snapshot transacional único. Divergem da leitura anterior porque o catálogo continua mudando. O relatório separa observação (`visto_em`) de alteração (`atualizado_em`) e mostra a última coleta por loja e os últimos jobs.

Evidências: [saúde por loja](evidence/catalog-stores-2026-10-19.json), [última coorte Shopee](evidence/shopee-cohort-2026-10-20.json). A coorte mais recente tinha 7.955 produtos; não deve ser confundida com um job integralmente bem sucedido.

## O que mudou no código

### Coleta e persistência

- Shopee passa a deduplicar em SQLite temporário no disco, preservando a última linha de cada item e a ordem de entrada. A seleção Top N usa estruturas limitadas por categoria e mantém o desempate do algoritmo anterior.
- O SQLite é nativo do Node, exige Node 22.13 ou superior e ainda emite aviso experimental no Node 22. Não é outro banco Supabase nem exige dependência ou migration nova. Uma falha no arquivo temporário interrompe a rodada.
- CSV/gzip são lidos em streams, incluindo campos com vírgula/quebra de linha, detecção de gzip por bytes, schema obrigatório e limite de 1 MiB por linha. A coleta cancela a leitura quando atinge a cota.
- Awin deixa de carregar e descompactar feeds inteiros na RAM. URLs e campos são limitados; falhas parciais chegam ao serviço de coleta e impedem a manutenção que desativa lojas por queda de volume.
- Shopee registra início e conclusão em `scrape_jobs`. Upserts e retirada usam lotes de 250. Qualquer erro interrompe a execução, impede conclusão verde e deixa status parcial/falha.
- A retirada só começa após todos os upserts. Filtra loja, prefixo automático `shopee-` e observação anterior à rodada; preserva itens manuais e observações mais novas.
- Queda superior a 50% em relação ao último job completo bloqueia alterações em produtos. O bootstrap legado usa a última coorte observada, evitando comparar 7.955 selecionados com 73.986 registros acumulados. Uma execução já ultrapassada por outra mais recente também é rejeitada.
- Checkpoint final, gravação de logs e conclusão do coletor são conferidos. Falha parcial resulta em saída não zero da CLI.

**Impacto que exige revisão antes de ativar:** o feed Shopee é curado por Top N. A regra legada retira do catálogo itens fora dessa seleção; não confirma falta de estoque na loja. Na base medida, a diferença entre disponíveis e última coorte era 66.031 itens. A primeira rodada corrigida pode retirar dezenas de milhares de ofertas acumuladas. Nenhuma retirada foi executada nesta investigação; revisar essa semântica e simular o conjunto antes do saneamento real.

A fonte Awin mantém as regras anteriores de preço/câmbio e seleção. Elas ainda merecem validação por comerciante, forma de pagamento e variante; a mudança de transporte não resolve a qualidade comercial do feed.

### Experiência do visitante

- Sugestões da busca rápida exigem estoque disponível, preço positivo e coleta nos últimos sete dias, sem timestamps futuros. A busca completa continua acessível e não foi limitada a essa janela.
- Produto antigo recebe aviso antes dos indicadores, rótulo “Último preço coletado”, preço neutro e ação “Conferir preço”. Recomendações positivas e desconto histórico deixam de promover esse preço como oportunidade atual.
- Dados estruturados deixam de publicar `Offer` quando o preço está antigo ou a data é inválida. Produto e breadcrumbs permanecem.
- Menu compacto evita o corte dos controles em telas menores. O menu completo aparece a partir de 1.720 px; Escape e mudança para desktop fecham o menu e seu overlay. A identidade e o fundo da navbar foram preservados.
- Radar local, compartilhamento, busca visível e medição por consentimento da primeira entrega permanecem.

Os destaques e cards legados da home ainda podem mostrar produtos antigos. A política de frescor implementada nesta etapa cobre sugestões e página de produto; a curadoria dos destaques continua pendente.

### Operação e automação preparadas

- `npm run report:catalog -- --days 7 --output reports/catalog-health.json`: contagens exatas por loja, concorrência limitada e falha explícita, sem carregar o catálogo na memória.
- Workflow diário de crescimento inclui saúde do catálogo, mesmo se o relatório de movimento falhar. Mantém a falha visível e guarda artefatos privados por 30 dias.
- Workflow de validação inclui testes de coleta e ensaio sintético de memória, além dos testes de crescimento e tipos.
- Ambos estão apenas no disco. O agendamento remoto novo não está ativo e nenhuma notificação foi enviada.

## Validação e seus limites

| Verificação | Resultado |
| --- | --- |
| Testes de crescimento / coleta | 27 / 22 aprovados no Windows e no Linux |
| Escritas, Auth e redirects nos testes | Simulados; nenhuma chamada de escrita ao banco real |
| TypeScript | Aprovado, também no laboratório Linux |
| Next + OpenNext Cloudflare | Compilação aprovada no Linux, com `OPENNEXT_CLOUDFLARE=1` |
| Wrangler | Dry-run aprovado: 7.568,37 KiB sem compressão / 1.574,49 KiB gzip; sem upload/deploy |
| Interface | Navegação, busca, radar e consentimento conferidos no navegador local, desktop e celular |
| Impeccable | Sem alertas nos alvos desta etapa |
| Workflows | YAML válido e permissões `contents: read` |
| Segredos conhecidos | Nenhuma ocorrência dos nove valores privados verificados em 292 arquivos textuais e assets |

[Registro de validação](evidence/validation-2026-10-20.json), [escopo da varredura de segredos](evidence/secret-scan-2026-10-20.json). A varredura compara valores conhecidos; não detecta todos os segredos desconhecidos ou codificados. O metafile do bundle tinha 308 inputs, sem os módulos de navegador/coleta procurados.

O laboratório usa Ubuntu/WSL e Node oficial 22.23.3 com checksum conferido. Recebeu somente URL/chave pública Supabase, URL pública do site e a flag de analytics desligado. Nenhuma chave privada foi copiada para ele. Os coletores pesados permanecem fora do Worker.

No ensaio sintético com heap limitado a 192 MiB:

| Linhas do CSV | Selecionados | Pico RSS do processo | Tempo |
| ---: | ---: | ---: | ---: |
| 20.000 | 400 | 129,1 MiB | 9,32 s |
| 200.000 | 400 | 152,9 MiB | 28,10 s |

O teste executa a CLI em dry-run e aponta explicitamente para banco inválido. RSS inclui runtime, parser e memória nativa do SQLite; o limite de heap não é limite de RSS. Não é benchmark de produção nem comparação antes/depois. [Evidência](evidence/collection-memory-2026-10-20.json).

No QA, a busca rápida retornou oito sugestões recentes; o formulário levou a `/ofertas?busca=fone+bluetooth`; salvar persistiu na navegação e remover retornou ao estado vazio. Um produto com coleta de 97 dias mostrou o aviso e deixou de expor `Offer` no JSON-LD. Consentimento foi aberto, aceito e revogado. O teste nativo de compartilhamento foi cancelado, sem envio; não comprova entrega nem fallback de clipboard.

Analytics ficou desativado no laboratório e não havia scripts GA/Clarity no documento. A consulta final ao console trouxe 12 falhas históricas de fetch/prefetch RSC entre 03:40 e 03:42 UTC, coincidindo com a parada controlada do servidor para recompilar; não havia entradas posteriores ao último reinício no lote consultado. Não tratar esse histórico como console globalmente vazio nem como erro comprovado de produção. Isso não valida gravação de novos eventos em homologação, SDKs em produção ou atribuição de clique nas redes.

Capturas: [home desktop](evidence/screenshots/home-desktop-validated-2026-10-20.jpg), [menu completo em 1.720 px](evidence/screenshots/home-wide-validated-2026-10-20.jpg), [home celular](evidence/screenshots/home-mobile-validated-2026-10-20.jpg), [produto antigo no celular](evidence/screenshots/product-mobile-validated-2026-10-20.jpg). As capturas sem `validated` são do diagnóstico anterior.

## Próximo passo concreto

Revisar o candidato por escopo e levá-lo a homologação. Antes de publicar:

1. Validar escrita/leitura dos novos tipos em `eventos` e `scrape_jobs`, permissões e constraints em banco isolado; não houve DDL nesta etapa.
2. Simular a primeira retirada Shopee e decidir como representar item fora da curadoria versus estoque esgotado. Conferir amostra de preço, loja e URL afiliada.
3. Executar o Worker em ambiente de teste com bindings corretos. Medir startup/CPU/1102, cache e concorrência; a fila `direct` continua com o aviso do OpenNext. Build e dry-run não são prova de runtime Cloudflare.
4. Confirmar login/admin reais, limites de abuso, reconhecimento de cliques nas redes e plano de rollback. Depois, obter aprovação humana explícita para produção.

Após essa liberação, a próxima melhoria de produto é limitar destaques a boas ofertas recentes e comparar o mesmo modelo/variante com histórico explicável. Isso oferece uma razão concreta para voltar antes de ampliar divulgação.

Não foram feitos commit, push, deploy, DNS, migration, coleta real, limpeza de produção ou envio a Discord/WhatsApp/Telegram. `package-lock.json` permanece igual. Exclusões de `cronograma-site`, `.gitignore` e demais alterações anteriores do usuário foram preservadas; `navbar.tsx` recebeu apenas ajustes explícitos de layout além do fundo anterior.

## Referências

- [Node: SQLite nativo e requisitos](https://nodejs.org/docs/latest-v22.x/api/sqlite.html).
- [csv-parser: strict e maxRowBytes](https://github.com/mafintosh/csv-parser).
- [Cloudflare: Wrangler deploy e dry-run](https://developers.cloudflare.com/workers/wrangler/commands/#deploy).
- [Google: dados estruturados Product](https://developers.google.com/search/docs/appearance/structured-data/product-snippet).
