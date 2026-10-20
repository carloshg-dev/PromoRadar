# PromoDetec: crescimento com confiança e medição

Data: 19/10/2026. Estado: primeira entrega implementada no checkout local, sem publicação.

Continuação em 20/10: [coleta, saúde do catálogo e validação em Linux/navegador](AVANCO_CRESCIMENTO_2026-10-20.md). Os bloqueios de compilação e navegador descritos abaixo são o registro histórico da primeira etapa; foram resolvidos no laboratório da continuação.

## Decisão

O diferencial a construir é ajudar a pessoa a decidir **o que comprar, onde comprar e se vale esperar**, com preço recente, histórico explicável e comparação correta. Um catálogo maior, isoladamente, não entrega esse valor.

Comecei por descoberta, retorno ao site e medição, aproveitando Next.js, Supabase, Cloudflare e GitHub Actions existentes. A identidade visual foi preservada. A próxima prioridade operacional é atualizar e qualificar o catálogo antes de aumentar a divulgação.

Não há promessa de audiência ou receita. As metas abaixo são critérios propostos para experimentos, não resultados alcançados.

## Evidência disponível

### Banco: nova leitura em 19/10

Consultas somente de leitura ao projeto Supabase identificado pelo ambiente local. Nenhum evento, clique, produto ou usuário foi criado por estas verificações.

| Indicador | Resultado | Interpretação |
| --- | ---: | --- |
| Produtos cadastrados | 118.363 | Inventário, não audiência |
| Disponíveis e com preço positivo | 107.564 | Estado cadastral, não confirmação no checkout da loja |
| Disponíveis, com preço positivo e sem atualização há mais de 7 dias | 58.397 (54,3%) | Risco de preço/estoque desatualizado; não prova que todos venceram |
| Imagem nula entre os disponíveis com preço | 0 | Não prova que todas as URLs de imagem respondem |
| Eventos nos 7 dias da extração | 96 | Ações registradas; não pessoas únicas |
| Visualizações de produto registradas | 86 | Eventos de visualização |
| Buscas registradas | 5 | Termos: cama (3), monitor (1), ryzen 5 (1) |
| Aberturas de comparação / categoria | 1 / 4 | Pequeno volume, sem conclusão sobre preferência do público |
| Requisições registradas de redirecionamento para lojas | 43 | Não equivale a cliques reconhecidos pelas redes ou vendas |
| Cadastros no período | 1 | Não equivale a comprador |

O recorte de movimento vai de 12/10 às 06:01 UTC a 19/10 às 06:01 UTC; é uma janela móvel. A contagem foi paginada até o fim e marcada como completa. Os tipos novos de evento aparecem zerados porque a atualização ainda não está publicada. Isso não permite afirmar que ninguém salvou ou compartilhou uma oferta.

A amostra de qualidade contém os 200 produtos disponíveis atualizados mais recentemente, todos da Shopee. É uma amostra não aleatória e não representa o catálogo inteiro. Um deles exibia diferença de pelo menos 80% entre preço original informado e preço coletado; isso é apenas uma referência anunciada, não economia histórica comprovada.

Evidências: [movimento](evidence/growth-2026-10-19.json), [catálogo](evidence/catalog-2026-10-19.json).

### Painéis consultados anteriormente nesta investigação

Estes resultados vieram dos painéis consultados durante a conversa, antes da implementação local; não foram extraídos novamente pelo relatório novo.

| Período GA4 | Usuários ativos | Sessões | Visualizações |
| --- | ---: | ---: | ---: |
| Junho | 70 | 166 | 461 |
| Julho | 97 | 233 | 796 |
| Agosto | 33 | 50 | 116 |
| Setembro | 265 | 304 | 707 |
| Outubro, parcial até dia 19 | 377 | 398 | 502 |

Na janela de 12–18/10, o GA4 mostrou 298 usuários, 305 sessões e 337 visualizações; 242 usuários foram atribuídos à China e 50 ao Brasil. A concentração geográfica merece investigação, mas não identifica robôs por si só. Não somar usuários mensais para obter pessoas únicas no período inteiro.

- Amazon, tag `promodetec-20`, 01/01–18/10: 159 cliques, zero pedidos e R$ 0 de ganhos no painel consultado.
- Awin, duas contas verificadas: nenhuma transação/comissão de junho ao recorte de outubro; a conta configurada tinha 215 cliques no relatório consultado.
- Shopee e Lomadee: receita ainda não confirmada nos painéis. Não concluir que toda a receita do projeto é zero.
- O painel Cloudflare mostrava cerca de 21,57 mil invocações e 1,08 mil erros em 24 horas, majoritariamente excesso de CPU. Esse retrato anterior não foi revalidado depois de uma publicação, pois nenhuma publicação ocorreu.

Não misturar invocações do Worker, eventos próprios, usuários GA4, redirecionamentos e conversões aprovadas pelas redes. São medições diferentes.

## O que foi implementado localmente

### Descoberta e retorno

- Busca visível na página inicial, com formulário funcional e sugestões de termos. A home passa a ter um H1 principal.
- Busca rápida com cancelamento de resposta antiga, carregamento, falha com nova tentativa, navegação por teclado, foco e fechamento acessível.
- Radar de até 30 ofertas salvas neste navegador, sem cadastro. Guarda somente identificador e título; o preço é consultado ao abrir o produto. Não envia alertas nem sincroniza entre aparelhos.
- Compartilhamento pelo recurso nativo do aparelho ou cópia do link interno do produto, com identificação da origem do compartilhamento.
- Botões com estados e mensagens de confirmação. Texto da vitrine deixa de prometer alertas ainda inexistentes.

### Medição de ações

Tipos permitidos: visita pública, busca, busca sem resultado, abertura/seleção da busca, visualização de produto/categoria, comparação, filtro, salvar/remover oferta, compartilhar, intenção de ir à loja e copiar cupom.

- Coleta do navegador somente após consentimento; respeita DNT/GPC e armazenamento bloqueado.
- Google Analytics e Clarity também passam a depender dessa escolha. Há acesso às preferências no rodapé e interrupção por recarga ao revogar consentimento.
- Lotes de até 20 ações, limite de 8 KiB no endpoint e fila limitada no cliente. Reduz chamadas individuais sem guardar uma fila crescente em memória.
- Validação no cliente e no servidor, UUID válido, tipos de evento permitidos e origem normalizada. Campos desconhecidos são descartados.
- Termos com aparência de contato, URL ou segredo são descartados. Não há coleta nova de IP, cidade, e-mail, identificador persistente de pessoa ou conteúdo de formulário por esse coletor.
- Requisições de robôs reconhecíveis, prefetch e origem externa são ignoradas. Isso reduz ruído, mas não é uma solução completa contra fraude; cabe rate limit na borda antes de divulgar amplamente.
- Erro de gravação produz resposta 503 e aviso técnico sem conteúdo pessoal. A ação do visitante continua funcionando.
- A medição própria não cria perfis individuais nem prova uma jornada por pessoa. Clarity é um fornecedor separado, sujeito à configuração de mascaramento e consentimento; não foi inspecionado visualmente nesta etapa.

`saida_loja` mede a intenção observada no navegador, com consentimento. A tabela operacional `cliques` continua sendo o registro do redirecionamento pelo servidor. Não somar as duas contagens.

### Google e compartilhamento de produtos

- Canonical específico nos produtos, categorias e páginas comerciais alteradas. Foi removida a canonical da home que se propagava para páginas internas.
- Metadata Open Graph/Twitter por produto e dados estruturados Product/BreadcrumbList, com preço efetivamente cadastrado, estoque e loja. Não foram criadas avaliações fictícias.
- Serialização de JSON-LD protegida contra encerramento de script por conteúdo do catálogo.
- Sitemap com páginas públicas, categorias e até 1.000 produtos disponíveis com preço positivo. A leitura usa apenas identificador e atualização, com cache diário.
- O sitemap curado não cobre os 107 mil produtos disponíveis. Divisão em sitemaps e política de indexação por qualidade ficam para a próxima etapa.
- Desconto informado pela loja é diferenciado do desconto contra média histórica. Os gráficos limitados agora usam os pontos mais recentes em ordem cronológica.
- A comparação é apresentada como comparação de classe/especificações semelhantes; o matching atual ainda não garante modelo/variante idênticos.

Metadata adequada torna o conteúdo interpretável por mecanismos de busca; não garante indexação ou destaque visual no Google.

### Operação, relatórios e automação

- Middleware compartilhado: páginas públicas sem cookie de sessão deixam de chamar Auth. Rotas protegidas continuam exigindo identidade validada pelo servidor e o admin mantém a verificação de papel.
- Assets, sitemap, busca, medição e redirects ficam fora dessa renovação de sessão.
- Relatórios usam paginação por identificador e processamento por página. Uma resposta curta do Supabase não é confundida com fim dos dados.
- Teto explícito de 100 mil eventos no relatório; a CLI falha se o total for incompleto. Rankings têm limites de diversidade sinalizados, sem reter todos os eventos na RAM.
- O admin limita o processamento a 5 mil eventos para conter trabalho no Worker. Ao ultrapassar esse teto, informa indisponibilidade em vez de mostrar uma contagem parcial como completa. Em escala, a solução é agregação no banco/rollup aprovado.
- `npm run report:growth -- --days 7 --output reports/growth.json`: relatório somente de leitura, sem notificação externa.
- Workflow diário preparado para 09:30 de Brasília, com artefato GitHub por 30 dias e permissão de repositório somente de leitura. O acesso ao banco usa o secret de servidor já previsto; migrar depois para credencial de menor privilégio quando houver política de leitura definida.
- Workflow de validação preparado para tipos e testes em pull requests.
- O resumo diário já existente foi enriquecido com buscas sem resultado, salvos, compartilhamentos e redirects; falhas de leitura interrompem o envio. Não executei esse resumo nem enviei mensagens.

Os workflows novos estão apenas no disco. Nenhum agendamento remoto novo foi ativado.

## Impacto e fronteiras

| Área | Mudança e efeito a revisar |
| --- | --- |
| `/api/track` | Passa a aceitar lote com `consent: accepted`; clientes antigos enviando formato individual são ignorados. As contagens não são comparáveis diretamente antes/depois. |
| Tabela `eventos` | Reutiliza colunas existentes. Não houve migration. Novos valores de `tipo` ainda precisam ser gravados e lidos em homologação para validar permissões e possíveis constraints. |
| `/r/{id}` | Preserva a construção de link afiliado. HEAD/prefetch não contam; robôs identificados vão ao produto interno. Falha de medição não impede a saída. Origem deixa de aceitar texto livre. |
| Auth | Cookie presente continua sendo validado; presença de cookie não concede acesso. O gate de papel do admin foi preservado. |
| Repositório de produtos | Busca escapa coringas; paginação de entrada é limitada; histórico traz os últimos pontos. Cache de render fica na página Next para manter uso do repositório em scripts Node. |
| Relatórios | Falha de banco e leitura incompleta não equivalem a movimento zero. O ranking legado de redirects no admin está explicitamente rotulado como amostra; ainda não é ranking completo. |
| Público | Salvar é local ao navegador. Nenhum cadastro automático, e-mail promocional ou alerta de preço foi ativado. |

As alterações anteriores em `.gitignore`, `navbar.tsx`, documentos de entrada e exclusões de `cronograma-site` foram preservadas. Elas não são parte desta entrega. `package-lock.json` não foi alterado e não foram adicionadas dependências.

## Prioridades para os próximos ciclos

### 1. Confiabilidade e receita: antes de ampliar aquisição

| Prioridade | Trabalho | Critério proposto |
| --- | --- | --- |
| P0 | Diagnosticar preços antigos por loja, última coleta válida, erro e cobertura. Rever a exibição de ofertas sem atualização recente. | Toda oferta de destaque tem coleta recente segundo SLA definido por fonte; amostragem confere destino/preço e informa diferenças de frete, PIX e cupom. |
| P0 | Corrigir CPU e caches por rota no Worker; medir home, produto, comparação, busca e bots separadamente. Avaliar a fila `direct`, que o OpenNext desaconselha em produção. | Versão isolada sem 1102 nos testes representativos; meta inicial de erro abaixo de 1% por 7 dias após rollout, sem afirmar que já foi atingida. |
| P0 | Validar atribuição real de cada rede. No código, Mercado Livre pode ser considerado monetizado mesmo com mapa de afiliado vazio. | Matriz por rede com URL gerada, identificação esperada e clique reconhecido no painel. Sem compras artificiais e sem confundir clique com comissão. |
| P0 | Impedir stale sweep depois de falha parcial de upsert na Shopee; processar candidatos em estruturas limitadas. Converter leitura integral gzip/CSV Awin para streaming/lotes. | Testes com falha parcial preservam produtos válidos; memória limitada em feed grande; reexecução idempotente. Não executar coleta real como teste. |
| P0 | Rate limit de `/api/track` e `/api/search`, cache e tratamento de bots com medição. | Abuso não gera escrita ilimitada nem bloqueia visitante legítimo; regras verificadas em ambiente isolado. |
| P1 | Prova de restauração do backup e recuperação do acesso administrativo. | Restaurar cópia em laboratório e conferir tabelas/contagens. Um job verde sozinho não prova backup recuperável. |

A recuperação do login do painel Supabase foi adiada conforme sua orientação. A leitura via ambiente local funciona, mas não comprova posse administrativa do painel. O conector Supabase desta sessão não tem permissão sobre esse projeto; o conector Cloudflare está em outra conta. Não usei esses conectores para alterar recursos alheios ao PromoDetec.

### 2. Um motivo concreto para preferir o PromoDetec

1. **Comprar agora ou esperar:** exibir janela do histórico, quantidade de observações, última coleta e motivo da recomendação. Se faltarem dados, dizer que faltam. Não chamar desconto de “menor preço histórico” sem base suficiente.
2. **Comparação exata:** grupo de produto por EAN/GTIN, marca, modelo, capacidade, voltagem e variante. Separar explicitamente alternativas semelhantes de ofertas do mesmo item. Mostrar preço final quando frete/cupom/forma de pagamento forem conhecidos; sinalizar o que não foi obtido.
3. **Radar útil:** evoluir a função local para preço alvo opt-in, com confirmação do canal, frequência, cancelamento e deduplicação. Exige persistência, políticas RLS e homologação; ainda não está implementado.
4. **Seleção editorial pequena:** escolher poucos achados com justificativa e prova de preço, em vez de dar o mesmo destaque a milhares de produtos. Reutilizar a curadoria e o pipeline de conteúdo existentes.
5. **Compartilhamento com contexto:** preparar cards e textos com preço, data e link do produto, gerados fora do Worker pesado. O botão de compartilhar já é a primeira parte desse ciclo.

Não recomendo adicionar de início mais fornecedores de IA, chat pesado ou rede social interna. O valor mais defensável vem de informação verificável, boa busca e motivo para voltar.

### 3. Aquisição em 30 dias após a liberação técnica

- Selecionar duas categorias piloto com estoque atualizado e boa oferta afiliada. As cinco buscas registradas são insuficientes para decidir o nicho vencedor.
- Publicar guias originais com intenção de compra e comparações reais. Cada guia aponta para produtos ativos e explica histórico, especificações e limites. Evitar páginas repetidas geradas em massa.
- Conectar o trabalho ao Search Console: cobertura, sitemap, impressões, consultas, páginas de entrada e CTR por categoria. Ainda não há prova de indexação/posição nesta entrega.
- Usar o pipeline existente para preparar conteúdo revisável, limitar frequência e retirar ofertas vencidas. Não criar outro autopost concorrente nem publicar sem autorização.
- Compartilhar achados com contexto nos canais próprios já autorizados e medir origem. Nesta etapa, nenhum conteúdo foi enviado a Discord, WhatsApp, Telegram ou redes sociais.
- Revisar em ciclos semanais: entradas qualificadas, produtos consultados, buscas sem resultado, saídas para lojas e cliques reconhecidos pelas redes. Corrigir o gargalo observado antes de ampliar investimento.

### 4. Retenção e escala em 60–90 dias

- Alertas de preço por escolha explícita, somente depois da qualidade de dados e da deduplicação estarem comprovadas.
- Radar sincronizado opcional, sem obrigar cadastro para consultar ofertas.
- Monitor de atualização por fonte, queda de cobertura, erro de coleta, medição indisponível e mudança de preço suspeita; avisar o dono somente quando houver ação necessária.
- Agregados diários no banco, política de retenção dos eventos e expurgo autorizado. Não manter coleta ilimitada sem finalidade definida.
- Experimentos de mensagem e categoria com amostra suficiente. Com o volume atual, mudanças direcionadas e entrevistas curtas valem mais que alegações de significância em testes A/B pequenos.

## Painel de decisão proposto

| Pergunta | Medida | Limite |
| --- | --- | --- |
| Estamos chegando ao público pretendido? | GA4 por origem, país e página de entrada; Search Console por consulta | Consentimento e ruído automático alteram a leitura |
| A busca ajuda? | Buscas, resultados vazios, seleção de sugestão e abertura de produto | São ações; ainda sem associação por pessoa/sessão |
| Há motivo para voltar? | Salvar, remover, compartilhar; retorno no GA4 quando disponível | Salvos são locais; não existe contagem de contas com radar |
| O visitante vai à loja? | Intenção consentida e redirects operacionais, apresentados separadamente | Não são usuários únicos e não comprovam atribuição |
| A receita existe? | Cliques, pedidos e comissões aprovadas por rede e período | Não extrapolar receita a partir do catálogo ou Worker |
| Podemos divulgar mais? | Frescor do catálogo, disponibilidade das páginas, erros e integridade de medição | Aprovação técnica precede aumento de tráfego |

## Validação desta entrega

- `npm run test:growth`: 24 testes aprovados, com banco e rede simulados nos testes de escrita/redirect.
- `npm run typecheck`: aprovado.
- `npm run build`: aprovado. Home: aproximadamente 246 kB de JS inicial; produto: 223 kB; middleware: 82,1 kB. São saídas do build, não medições de Web Vitals.
- Servidor Next de produção local: home, produto real, categoria, ofertas, paginação inválida, privacidade, comparação e cupons responderam 200; busca retornou até 8 sugestões; CSS respondeu 200; admin sem sessão redirecionou ao login.
- Sitemap local: 1.044 URLs, sendo 1.000 de produto.
- Inspeção estática Impeccable nos oito alvos de UI: nenhum alerta. Isso não substitui revisão visual.
- YAML dos dois workflows novos: parse válido, jobs e permissões conferidos.
- `git diff --check`: sem erros de whitespace; Git emite avisos locais de conversão LF/CRLF.
- Varredura dos valores privados conhecidos no ambiente local, nos arquivos de aplicação examinados e nos assets do navegador: nenhuma ocorrência em 110 arquivos. [Escopo e limite da verificação](evidence/secret-scan-2026-10-19.json). Não é auditoria de todo o histórico Git.
- Relatório de movimento e inventário: leitura real, com resultados nos artefatos acima.
- Evidência HTTP: [smoke local](evidence/smoke-local-2026-10-19.json). Os tempos são locais e não constituem benchmark de produção.

### Limites e decisão de publicação

**NO-GO para publicação automática.** Esta é uma entrega local para revisão.

O navegador está desativado nas configurações desta sessão; não foi possível verificar renderização desktop/mobile, console do navegador e interações reais. A verificação HTTP não deve ser apresentada como QA visual concluído.

O primeiro build OpenNext no Windows encontrou incompatibilidade de caminhos `file:///C:/...` e importação de Playwright sem a flag específica do build. A repetição com `OPENNEXT_CLOUDFLARE=1`, igual ao workflow existente, eliminou os dois erros de importação do Playwright, mas falhou nos três caminhos `file:///C:/...` da configuração gerada. Não fiz remendos em dependências nem declarei o bundle pronto. O dry-run Wrangler não foi executado sobre um pacote incompleto. A medição de tamanho e o build Cloudflare permanecem pendentes em Linux.

O OpenNext também avisou sobre um arquivo de cache local que não pôde ser interpretado. Não apaguei caches ou arquivos da árvore como tentativa de resolver o erro de plataforma.

O workflow existente `cloudflare-deploy.yml` já oferece validação Linux com `deploy=false`. Não o disparei, porque o código ainda não foi enviado ao GitHub. A fila `direct` e a medição de CPU continuam pendentes de validação isolada.

A skill local e o workflow antigo tratam 3 MiB gzip como limite do Free. A documentação oficial consultada em 19/10/2026 informa 64 MiB sem compressão e nenhum limite de tamanho comprimido. Não flexibilizei o gate antigo nem alterei o plano da conta: registrar ambos os tamanhos e revisar a regra com a conta alvo antes de liberar uma publicação.

Antes da liberação: revisão do diff por escopo, QA visual, gravação/leitura dos novos eventos em homologação, Auth real, URL de teste Cloudflare, medição de CPU, atribuição afiliada e rollback. Um build Next verde não substitui essas provas.

Nenhum commit, push, deploy, DNS, migration remota, troca de segredo ou envio externo foi realizado. O requisito de aprovação humana para produção permanece o de `CLAUDE.md`.

O build Next final e os 24 testes foram repetidos depois da correção que impede uma falha de consulta de ser contabilizada como busca sem resultado. O smoke HTTP anterior cobre a navegação saudável; não foi realizado novo QA visual.

## Referências técnicas consultadas

- [Google: Product structured data](https://developers.google.com/search/docs/appearance/structured-data/product-snippet): conteúdo do produto e elegibilidade, sem garantia de rich result.
- [Google: canonicalização](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls): URLs preferenciais para conteúdo duplicado.
- [Cloudflare: Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/): recursos, limites e execução.
- [Cloudflare: limites atuais](https://developers.cloudflare.com/workers/platform/limits/#worker-size): medir tamanho sem compressão e startup, em vez de presumir limite antigo.
- [Cloudflare: comandos Wrangler](https://developers.cloudflare.com/workers/wrangler/commands/): validação do pacote com dry-run, sem publicação.
