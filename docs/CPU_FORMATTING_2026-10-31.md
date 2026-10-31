# CPU: formatação compartilhada publicada — 31/10/2026

## Entrega confirmada

A [PR #15](https://github.com/carloshg-dev/PromoRadar/pull/15) foi integrada na `main`, commit `9d1d5119614cd536307507d7f36436a69e07bb1e`, às 16:15:23 de Brasília. O candidato funcional é `21bde1931f62e526921453e606128d1435ff8835`; a árvore do merge coincide integralmente com ele.

O painel autenticado da conta `0fcbdab34f0d44e0e948a4bb2f051810` confirmou o Worker `promodetec`, build `f27a0f4e-d508-4f3a-a7cd-8b850b8e8b29`, fonte `main/9d1d511`, versão **335c0c74**, **Pronto / 100% do tráfego**. O domínio confirmou buildId **NvQNmZRlmaST2Vcn94Upg**. Foram relidos somente os nomes/presença dos nove secrets/variáveis esperados, do bucket de cache e da autorreferência. Não houve contratação, alteração de DNS, WAF, credenciais ou DDL nesta entrega.

## Mudança e impacto

`src/core/formatting.ts` compartilha objetos imutáveis `Intl.NumberFormat` e `Intl.DateTimeFormat`. Antes, cada preço e cada ponto do histórico construíam um formatador. Os callers existentes de moeda permanecem compatíveis; histórico de produto, vitrine e validade de cupom usam a mesma função de data. O módulo não mantém estado de visitantes nem uma coleção crescente.

Foram preservados texto aprovado, CSS, preços coletados, estoque, PromoScore, histórico, autenticação e saída afiliada. Dois testes de equivalência cobrem arredondamento, valores ausentes/especiais, datas com deslocamentos e datas inválidas. O microensaio local de 4.800 preços produziu o mesmo checksum: 173,68 ms com construção repetida / 3,80 ms com o objeto compartilhado. Esse ensaio não mede uma página inteira nem CPU faturada no Cloudflare.

## Validação

- Tipos e 88 testes de crescimento aprovados. CI de contratos [41214257418](https://github.com/carloshg-dev/PromoRadar/actions/runs/41214257418) aprovado no SHA funcional.
- OpenNext/workerd limpo [41214209351](https://github.com/carloshg-dev/PromoRadar/actions/runs/41214209351): **35/35**, incluindo expiração/recuperação nativas e **512 respostas quentes** nas concorrências 1/8/32/64 sem falhas; gzip **1.575,08 KiB**. BuildId `aEKFlX4cGpOO7sIGvbImW`, Wrangler 4.151.2, compatibilidade efetiva `2026-08-23`. É um laboratório, não um teste de carga remoto.
- Uma rodada WSL adicional ficou em **32/35**: timeout da busca (503), leitura de produto dependente sem produto e HIT inesperado na expiração. Não se repetiram no CI limpo do mesmo código. A causa local continua inconclusiva; não descartar essa divergência nem chamá-la de falha corrigida.
- Prévia Next real: home com 24 cards, busca com 60, detalhe com 11 pontos de histórico, salvar/remover o próprio item do radar, menu móvel e copiar cupom. Sem overflow observado em 1680/768/390/320 px; console da amostra sem warnings/erros. Primeira tela móvel sem imagens quebradas; não cobre todas as imagens externas/lazy.
- Produção: **19 verificações HTTP** aprovadas em home, assets, HTML/RSC e variantes, busca Supabase, produto, categoria, comparador, cupom, login, callback anônimo, admin protegido e HEAD de saída sem seguir loja. Todas as respostas da aplicação corresponderam ao novo buildId. Repetições mantiveram os mesmos hashes e retornaram HIT; `/ofertas` passou de 2.067 para 42 ms na amostra. São latências HTTP, não CPU.
- Navegador público confirmou a vitrine, missão literal, 24 cards, ausência de overflow desktop e console da amostra limpo. Não houve compra, login novo, postagem, escrita sintética de eventos ou clique afiliado humano.

Vercel continua com a recusa anterior por conta bloqueada; não é a origem que atende esse release. Os servidores próprios de prévia devem ser encerrados ao concluir os respectivos ensaios.

## CPU de produção: ainda sem prova de solução integral

A leitura anterior da versão **364a748a** registrou 757 invocações / 92 CPU exceeded, CPU p50 58,46 ms e p90 268 ms. O filtro de 24 horas abrangia apenas cerca de uma hora de vida dessa versão na consulta; não representa um dia inteiro equivalente.

Na nova versão **335c0c74**, o filtro de versões específicas tinha apenas essa versão marcada. A leitura inicial após os testes mostrou **36 invocações**, indicador de **CPU exceeded 0**, CPU p50 **169 ms**, p90 **531 ms** e memória p50 **40,46 MB**. O painel de erros também exibia “Nenhum dado”. É uma amostra de poucos minutos, com atraso possível de ingestão e participação das verificações sintéticas. Não é prova de zero falhas para todos os visitantes, redução de CPU ou estabilidade no plano gratuito. A CPU observada continua alta.

Não comparar essas medianas como experimento controlado: mudaram duração, tráfego, cache e proporção de requisições frias. Invocações não são pessoas; rotas interrompidas em tarefas posteriores à resposta não permitem inferir o status recebido por cada visitante. Países, agentes, WAF e falsos positivos não foram segmentados nesta continuação.

## Pacote de catálogo separado

A PR #13 recebeu essa `main` no merge **1ec10803bf0ad0f89ee5ea39eb3fa4678186bc32**, preservando suas guardas de preço, foto e moeda. Tipos e **100 testes de crescimento** passaram. CI de contratos **41233540747** e OpenNext/workerd **41233577087** passaram; **35/35**, gzip **1.576,29 KiB**, buildId `a18iUhZCwOPoPVg2qCtoS`, sem publicação.

A nova prévia local `HZKIt25b0abva8-i4S8GQ` mostrou 60 cards até R$ 1.000, sem AliExpress ou URLs genéricas na amostra. Selecionar R$ 100 trouxe 60 cards, máximo R$ 99,99; abrir o filtro móvel e escolher Creatina preservou o teto. Console da amostra limpo, sem overflow a 390 px.

Entretanto, os nove contratos HTTP adicionais ficaram em **8/9**: `/ofertas?ate=300` respondeu 200 com indisponibilidade, sem cards. Isso não foi curado por repetir a consulta. Quatro leituras diretas somente GET posteriores compararam contagem exata e ausência de contagem: 326–764 ms, todas com dados e sem código de erro; não reproduziram nem explicaram a falha. Não há base para declarar a contagem como causa confirmada, remover filtros às cegas ou publicar o pacote amplo como estabilizado.

Próxima ação necessária: capturar o erro agregado da consulta intermitente e corrigir a recuperação do catálogo, mantendo recência, moeda e preço reais. Depois repetir o caso de falha e concluir a homologação desse pacote. A medição de CPU comparável continua necessária; nenhuma cobrança foi assumida para ganhar tempo.

Recibos locais: `reports/free-runtime-2026-10-31/format-public-proof.json`, `format-ci/worker-ui-receipt.json`, `format-public-desktop.jpg`, `format-home-390.jpg`; `reports/health-audit-2026-10-31/health-after-format-contracts.json`, `count-query-comparison.json` e `worker-after-format-ci/worker-ui-receipt.json`. Não contêm valores de secrets nem dados pessoais de visitantes.
