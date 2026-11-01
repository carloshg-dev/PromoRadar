# Relatórios organizados no Discord — 01/11/2026

> Atualização posterior: o proprietário autorizou integrar/publicar as alterações. O resultado do release será registrado em `docs/PROJECT_STATE.md`; o restante deste documento registra a validação local anterior, sem transformar as prévias em envios reais.

**Preparado e validado localmente. Não enviado ao Discord nem integrado à main.** Continua vigente a suspensão de publicação pedida pelo proprietário. As prévias usam relatórios agregados históricos já salvos, sem consulta remota nova.

## Padrão de leitura

O relatório diário/semanal deixa de juntar os rankings em parágrafos e cortar mensagens pelo número de caracteres. Um único envio reúne três blocos nativos do Discord, com cores, tópicos, ícones e uma linha por item:

| Bloco | Conteúdo | Organização |
|---|---|---|
| 📊 Movimento | Ações consentidas, páginas, produtos vistos, buscas, salvos, cupons, saídas, cadastros e dispositivos | Indicadores destacados; período no topo em Brasília |
| 🔎 Interesse do público | Buscas, produtos vistos, lojas, produtos com saídas e categorias | Top 5 de cada ranking, numerado; lista retornada pelo agregador preservada no CSV |
| 💰 Vendas e comissões | Awin BRL por situação; produtos nas compras quando informados | Pendentes/aprovadas/recusadas/excluídas/não reconhecidas separadas; sem deduzir pagamento |

Os avisos operacionais de coleta, inventário das afiliadas e movimento de 24 horas seguem a mesma hierarquia, com indicadores separados e CSV próprio. A janela móvel do digest fica explícita, para não ser confundida com os dias completos do relatório comercial.

Inventário cadastrado com rede de afiliação deixa de ser rotulado como prova de monetização. Sua contagem não aplica o filtro de recência da vitrine. O texto antigo sobre retirada obrigatória de lojas abaixo de 200 produtos não é repetido.

## Arquivos para Excel e IA

- **CSV:** UTF-8 com BOM, separador `;`, CRLF, números sem separador de milhar e decimais com vírgula. Uma linha por indicador, posição de ranking ou situação financeira. Colunas estáveis de período, seção, item, quantidade, valores BRL, fonte, estado e observação. A coluna `secao` permite filtrar movimento, dispositivos, rankings, financeiro e cobertura.
- **JSON:** dados agregados com `schemaVersion: 1`, cobertura e unidades explícitas. Valores `sales`/`commission` da Awin permanecem em **centavos de BRL**; as colunas financeiras do CSV estão em **reais**. As contagens e a unidade da cesta ficam identificadas para a IA.
- Arquivos diários/semanais são anexados ao mesmo envio dos blocos. O JSON de dados não antecipa um recibo de envio; `discordSent` continua somente no relatório operacional e só muda após resposta HTTP aceita.
- Indisponibilidade, fonte não configurada, fonte não integrada e nomes não fornecidos ficam identificados. Valores ausentes ficam vazios no CSV; zero só é usado quando observado na consulta retornada.
- Prefixos capazes de iniciar fórmulas em células de texto são neutralizados. Aspas, delimitadores e acentos são preservados; quebras/controles viram espaços. Números continuam numéricos. Os anexos novos não contêm contatos, IPs, sequências individuais de navegação ou pedidos.

## Impacto e limites

`scripts/daily-business-report.ts` continua usando as mesmas consultas/janelas e o mesmo resumo financeiro. A apresentação pura fica em `src/core/reporting`; transporte em `src/infrastructure/notify/discord-report.ts`. O digest passa seu limite superior já usado na leitura para identificar a janela exata. Não há nova tabela, evento de tracking, coleta de visitante, credencial, dependência ou cron.

`owner.ts` também atende o aviso de cadastro chamado pelo callback. Esse contrato permanece best effort, com prazo de quatro segundos e falha sem interromper o fluxo principal. O Telegram existente conserva HTML legível e não promete anexos exclusivos do Discord. Não foi feito login real ou envio para validar esses caminhos em produção.

Limites do payload inteiro são verificados antes do POST, incluindo 6.000 caracteres dos embeds, 1.024 por valor de campo e 25 campos por embed. Os anexos são agregados pequenos, até 512 KiB por arquivo; CSV limitado a 1.000 linhas. Uso de memória não cresce com a série bruta de eventos. O envio usa multipart e `wait=true`, sem repetição automática que possa duplicar mensagens. Referências: [limites de mensagens do Discord](https://docs.discord.com/developers/resources/message#embed-limits) e [execução de webhook e anexos](https://docs.discord.com/developers/resources/webhook#execute-webhook).

## Validação

- **129/129 testes de crescimento**, incluindo oito testes novos de apresentação/transporte: dinheiro, período, completude, rankings, limites, BOM, CSV seguro, HTTP de erro e compatibilidade Telegram. POSTs somente simulados, sem rede externa.
- Tipos da aplicação e dos runners diário/digest/cupons aprovados. CI de crescimento passa a observar os dois runners e o tsconfig compartilhado; o upload existente `reports/business-*` já inclui os novos arquivos, sem mudar agendamentos.
- Build Next Linux somente leitura **`dinN3tcJ0v0jy7FrREGe9`**, com as fontes atuais copiadas para laboratório separado. Não é homologação OpenNext/workerd do novo lote nem prova de CPU/entrega no Discord.
- Prévias históricas: diário de **31/10**, 35 ações/27 saídas; semanal **25–31/10**, 177 ações/122 saídas. Os dados foram preservados, não medidos novamente. Arquivos em `reports/discord-format-preview/`; recibo com fontes, períodos e tamanhos em `preview-receipt.json`.
- A aparência no cliente Discord real e no Excel nativo ainda não foi conferida. Os blocos usam o layout nativo do Discord, que adapta as colunas à largura; CSV é exportação de dados, sem formatação de workbook `.xlsx`.

Depois da suspensão ser retirada, integrar o lote separado e conferir o primeiro envio autorizado/agendado, seus anexos e a leitura no cliente real. Não houve acionamento manual do workflow ou do webhook neste trabalho.
