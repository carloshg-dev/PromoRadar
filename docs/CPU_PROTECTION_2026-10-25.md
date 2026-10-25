# PromoDetec: proteção e redução de processamento

25/10/2026. Execução autorizada pelo usuário após a proposta de contenção de bots, georrestrição, pré-cálculo, cache, rate limiting e medição. O checkout original e suas alterações visuais/exclusões foram preservados; implementação em worktree separado.

## Impacto e funcionamento

- O domínio tem bloqueio específico de Awario/MJ12, georrestrição de catálogo ao Brasil com exceção de bots verificados, e limite de 60 leituras de catálogo por IP em dez segundos. O excesso gera bloqueio de dez segundos. Não foram alterados DNS, cobrança, credenciais, regras de autenticação ou o fluxo de cliques afiliados.
- A expressão geográfica inclui `/`, `/ofertas`, `/comparar`, `/cupons`, `/noticias`, `/api/search`, `/produto/*` e `/categoria/*`, somente GET/HEAD. País é determinado pelo IP: brasileiros usando VPN estrangeira também podem ser bloqueados. O limite por IP pode afetar redes compartilhadas e precisa de acompanhamento de falsos positivos. Não se trata de restrição de todas as URLs nem de identificação da nacionalidade.
- A leitura normal HEAD de `/ofertas` respondeu 200; User-Agents de teste Awario e MJ12 responderam 403. `robots.txt` continuou 200, portanto seu resultado não foi usado como prova da eficácia no catálogo. O painel confirmou as três regras ativas. Não foi feito teste de carga em produção.
- A comparação completa saiu do Worker. O runner lê a view por cursor em lotes de 250, agrupa em arquivos NDJSON temporários e mantém somente a menor oferta por loja na RAM. Preserva as regras de matching, outlier e economia. O agrupamento limitado da home também usa o mesmo domínio puro.
- As listas contêm até 60 grupos e um produto lê índice + objeto de sua classe. Cada objeto tem no máximo 512 KiB; schema, identidade, versão e idade são validados. Preços antigos/futuros não são promovidos como atuais. O índice só muda após toda a geração; falhas não acionam varredura do catálogo como fallback.
- O bucket `catalog-comparisons` é privado. Somente código de servidor usa a chave administrativa existente para ler os objetos; navegador não recebe a chave. Não há novas tabelas, DDL ou políticas públicas de Storage.
- Páginas finais de ofertas/categorias têm cache de cinco minutos, além das consultas públicas. A prioridade dos links monetizados e os 60 produtos por página foram preservados. A janela de consulta foi estabilizada para evitar chaves diferentes a cada milissegundo. `/api/track`, login, dados pessoais e `/r/` não foram colocados em cache compartilhado.
- Prefetch foi removido do comparador, rodapé, menu de conta e link de comparação do produto. O logo local deixa de acionar `/_next/image`; não foi alterado o visual.
- O sitemap fazia ordenação global sobre o catálogo e falhou com `57014` em dois builds. A leitura passou a usar amostra limitada por cursor/PK, filtrada por estoque, preço e recência, até 1.000 URLs, sem DDL. Esse recorte não pretende indexar o catálogo inteiro.

## Provas já obtidas

- Tipagem e testes focados aprovados; regressões de matching, geração parcial, falha de escrita, limite de lote, validade, leitura, cursores e sitemap.
- Geração real primeiro em dry-run e depois publicada: 38.128 ofertas recentes, 212 comparações, 45 escopos, no máximo três lojas por classe observada. Recibo em `evidence/comparison-snapshots-2026-10-25.json`. O limite de lote é 250; não é medição de pico de RSS.
- Leitura real de 29 comparações de placas de vídeo e de uma classe individual confirmada. Tempo de leitura dos dois casos: 1,89 s, incluindo rede; não é CPU do Worker.
- Build Next/OpenNext aprovado após correção do sitemap, sem falhas de fontes da home nessa rodada. Runtime e CI serão registrados na continuação abaixo.

## Operação e limites

O workflow `comparison-snapshots.yml` roda após coletas concluídas com sucesso e em duas janelas diárias de contingência. Ele precisa ser publicado em `main` para ativar esses gatilhos. Usa checkout explícito de `codex/cloudflare-migration`, concorrência serializada e saída não zero em falha. Agendamento configurado não equivale a execução agendada provada.

A versão lida permanece válida por até 48 horas, com cache de cinco minutos. Expiração/falha aparece no comparador como indisponibilidade, e não ausência comprovada de produtos. A acumulação de versões no Storage precisa de política de retenção antes de uso prolongado; esta etapa preserva versões anteriores para rollback.

Workers Free mantém seu limite por requisição. Bloquear tráfego e reduzir consultas não prova que SSR passou a caber em 10 ms. `queue: direct` permanece como limitação de revalidação concorrente e o pacote emite esse aviso. Comparar CPU/erros em janelas equivalentes após publicação; Workers Paid continua uma decisão separada, sem contratação automática.

## Rollback

- Regras WAF/rate limiting podem ser desativadas individualmente no painel.
- Aplicação pode retornar à versão anterior, mantendo snapshots privados sem uso. O índice anterior pode ser restaurado a partir do recibo/versionamento enquanto os objetos existirem.
- Não desfazer cadastro de produtos, métricas, histórico ou links de afiliados. Nenhuma dessas tabelas foi alterada por esta etapa.

## Continuação: validação e publicação

- PR #2 integrada em `codex/cloudflare-migration`, SHA `f3f055e32215f88a0bfb0f866e506a1a655d69ee`, 25/10/2026 às 10:15 de Brasília. CI de contratos `40196163599` e validação OpenNext/dry-run `40196162807` passaram. A publicação automática no Cloudflare foi iniciada; confirmação de versão ainda será registrada.
- `npm ci` no laboratório isolado, 78 testes Linux e 23 contratos HTTP no workerd aprovados; gzip 1.582,57 KiB. O primeiro ensaio com `node_modules` compartilhado falhou no require dinâmico do manifesto; após instalação própria, o pacote foi recompilado e o ensaio integral passou. Não foi alterado o manifesto manualmente para esconder o problema.
- QA local com Next de produção e leitura de snapshots reais: 60 grupos na vertical Tech, 29 na categoria de placas de vídeo e comparação presente no detalhe do produto. Desktop 1440×900 e celular 390×844 sem overflow, menu móvel funcional e console sem erros/avisos na amostra. Analytics foi desabilitado no servidor do laboratório; nenhum clique humano de afiliado foi seguido.
- PR #3 integrada em `main`, SHA `2b4887793f74e82017989806245a10f82e3ef2ec`, adicionando SOMENTE o workflow. Primeiro run manual `40196927610` iniciado. O código da aplicação continua no ramo de produção separado; não declarar continuidade agendada a partir de execução manual.
- Descoberta uma entrada alternativa pública via `workers.dev` e URLs de prévia. Candidato adicional fixa `workers_dev=false` e `preview_urls=false`; a desativação efetiva será conferida após o deploy. Domínios oficiais e autorreferência por service binding permanecem configurados.
