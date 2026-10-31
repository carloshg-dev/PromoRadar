# Estado operacional do PromoDetec

## 31/10/2026: mitigação gratuita de CPU homologada

- Pedido atual do proprietário: ganhar tempo sem contratar plano e preservar a experiência. Correção de infraestrutura separada na [PR #14](https://github.com/carloshg-dev/PromoRadar/pull/14), candidato funcional `95fe010a2dd5a96a4843f9acb8d9c3743ad9feaf` sobre `main/f4e72f2`. Pré-aprovação de integração/publicação já existente; sem contratação, DNS, WAF, nova credencial ou nova dependência paga.
- Cache API de respostas públicas íntegras por 120 s, por POP/host/URL/variante/build, antes de renderizar o Next. Sessões, login/admin, APIs, medição e saída afiliada seguem o caminho original. Falhas/fallback/Set-Cookie não são armazenados. Stream limitado e proxy de imagem não utilizado encerrado. Copy, aparência e regras de catálogo da main preservadas; o pacote de catálogo da PR #13 continua separado.
- CI `41185478419` aprovado. OpenNext/workerd `41185469428`: **35/35 contratos**, **512/512 respostas quentes**, concorrência máxima 64, expiração e recuperação nativas aprovadas; gzip **1.575,51 KiB**, buildId `GhYTqcZJ2Wtn1mUJZKs3-`, Wrangler 4.151.2/compatibilidade `2026-08-23`. O profiler local mostrou economia de trabalho JS, sem medir CPU faturada de produção. Nenhum teste de carga remoto.
- Índice `idx_produtos_vitrine_ordem` aplicado concorrentemente pelo run `41184205225`, valid/ready, 2,04 MiB; banco aproximadamente 258 MiB. Não alterou preços/estoque/RLS. **Sem ganho comprovado no plano SQL padrão**: consulta restritiva 4,33 s antes/4,36 s depois. Caminho ordenado de 71,9 ms foi somente experimento em transação de leitura; não mudou o planner da aplicação.
- Antes desta publicação, 12 leituras públicas leves passaram. Painel/API indisponíveis para nova janela de CPU/1102; navegador desativado impede QA interativo novo. Aparência não foi modificada por este patch de infraestrutura. Cache frio/sessões ainda renderizam; HIT continua contando invocações. Não prometer zero 1102 nem converter requisições em pessoas.
- Integração e comprovação pública serão registradas após a conclusão. Detalhes, limites e contingência em `docs/FREE_PLAN_SURVIVAL_2026-10-31.md`; recibo agregado em `docs/evidence/free-plan-2026-10-31.json`.

## 31/10/2026: Black em evidência publicado e calendário automático

- O proprietário escolheu **A — Black em evidência** e pré-aprovou continuidade/publicação. [PR #11](https://github.com/carloshg-dev/PromoRadar/pull/11) integrada na `main`, SHA `0ed13376498c034cef119b181fcfee976d4a9e68`. A árvore funcional coincide com o candidato `d7c84eff01d556b0c3c67490367a10cdb426d3e9`.
- Painel autenticado da conta `0fcbdab34f0d44e0e948a4bb2f051810` confirmou Worker `promodetec`, build automático `7a679339-fdce-4ab2-b85c-b80edbb3345c`, fonte `main`/`0ed1337`, versão **`108b097a`**, **Ready / 100% do tráfego**. Domínio público confirmou `esquenta-black`, missão literal, fotos/preços em grade e 24 ações de salvar. É a verificação deste release, não garantia de versão imutável depois de futuras integrações.
- Calendário 2026 em `America/Sao_Paulo`: Esquenta Black até 26/11; Black Friday 27–29/11; Cyber Monday 30/11; Esquenta Natal 01–13/12; Natal 14–25/12; neutro a partir de 26/12. Bootstrap antes da pintura e provider sincronizam HTML em cache e abas visíveis, sem chamada remota, computador ligado ou deploy em cada virada. Override de tema ausente nas variáveis de build/runtime consultadas.
- Tipos, build Next e 74 testes aprovados. CI de crescimento `41171259007` e homologação OpenNext/workerd `41171255955` aprovados no candidato final: **1.573,17 KiB gzip**, **23/23 contratos**, Wrangler 4.151.2, compatibilidade efetiva `2026-08-23`, buildId `xcRLzoBgpQuzbHxtWhZ4X`. Revisão independente Impeccable encerrou os três ajustes apontados, com `disposition: ship`; documentação visual sincronizada.
- **17/17 testes HTTP públicos** aprovados. QA público da home em 1440/390/320 px sem overflow; 24 produtos únicos, busca com 60 produtos, salvar/remover do próprio teste e comparador com 60 grupos reais no celular. Medição rejeitada e console da amostra sem warnings/erros. Uma imagem externa da Dufrio falhou fora da primeira tela; não afirmar integridade de todas as fotos. Não houve login/OAuth, escrita sintética de eventos nem clique afiliado humano.
- O preflight API GitHub `41171257797` retornou 401; a sessão existente do navegador permitiu confirmar conta, build, tráfego e nove nomes de bindings sem revelar valores ou alterar credenciais. A publicação ocorreu pelos Builds existentes. Nenhuma alteração de DNS, WAF, banco, cobrança ou credenciais.
- Índice de comparações relido somente com GET: gerado em 30/10 às 17:00:51 UTC, idade de 12,25 h na consulta, schema/prazo válidos, escopo tech coerente com o índice e 60 grupos atuais. A indisponibilidade vista no laboratório não se repetiu no comparador público. Viradas futuras foram testadas em unidade/VM; não houve navegador com relógio futuro. Este release não comprova redução de CPU/1102.
- Evidências e limites: `docs/BLACK_EVIDENCIA_2026-10-31.md`. Capturas e recibos agregados locais em `reports/` e `.impeccable/review/black-evidencia/`.

## 26/10/2026: acabamento do rodapé revisado

- Rodapé compartilhado extraído para `src/components/layout/footer.tsx`: base tinta verde, marca/ação, navegação por grupos, atendimento/privacidade e faixa legal. A página mantém a identidade clara. Todos os links, o evento de consentimento e o conteúdo legal existentes foram preservados; nenhuma consulta ou persistência adicional.
- Typecheck e build Next aprovados. Homologação OpenNext em laboratório Linux próprio: **1.561,28 KiB gzip** de 3.072 KiB e **23/23 contratos HTTP**. Esses números são do pacote/runtime local, não CPU de produção. O recibo UTC é de 27/10, correspondente à noite de 26/10 em Brasília; o buildId foi confrontado com o build executado.
- QA em 1920/1024/768/390/320 px: sem overflow horizontal observado, alvos de pelo menos 44 px, menor contraste de texto verificado 7,11:1 e foco lime de 2 px. Preferências abriram pelo mouse e teclado; Rejeitar fechou o banner. Console da amostra sem warnings/erros. Capturas JPEG do componente e limitações em `docs/FOOTER_REFINEMENT_2026-10-26.md`.
- Revisão independente fresca incluiu a captura rejeitada pelo proprietário. Não encontrou correção visual material no lote final; a divergência de DESIGN.md foi corrigida pelo documenter e marcada resolvida no verdict. O ship do verdict cobre esse item documental, não uma certificação de todo o site.
- Destino da integração: `main`, já configurada como fonte dos Builds do Cloudflare. A confirmação da nova versão pública é etapa separada, registrada na PR de entrega e no recibo local de produção. A publicação visual anterior comprovada está no registro histórico abaixo. Não houve alteração de DNS, WAF, banco, cobrança ou credenciais neste acabamento.

## 26/10/2026: novo visual publicado no domínio

- O usuário encontrou o site antigo após a integração na `main`. Confirmado no painel autenticado: a publicação ainda usava `codex/cloudflare-migration`, versão `51d08bbd`, commit `2878a44`, com 100% do tráfego. A `main` estava em `49ef8bb79a6bb97fc53c7fc4398097db742e1c11`, com a interface já aprovada e homologada.
- Corrigidas e relidas as duas referências do Cloudflare: branch de produção e branch do acionamento manual existente agora são `main`. Os comandos de build/deploy, secrets, bindings, DNS, WAF e cobrança foram preservados. Novas integrações na `main` passam a ser a fonte das publicações automáticas do Cloudflare.
- Publicação pelo acionamento existente concluída: build `eae8a468-d4c8-437c-9e26-2bc4e1b28b54`, versão **`12f5eb42-9be8-4c2b-a549-a8800b158c9c`**, **Ready / 100% do tráfego**, fonte `main`. Acionamentos manuais não mostraram SHA no painel; `49ef8bb` foi a ponta remota conferida antes e depois, e a interface pública corresponde ao candidato aprovado.
- **20 contratos HTTP públicos aprovados**, incluindo apex/www, novo texto e CSS claro, JS, catálogo, busca/leitura de produto, comparador, login/callback anônimo, proteção de admin, saídas técnicas sem clique, dois agentes bloqueados e `workers.dev` 404. QA público em desktop e 390 px: sem overflow observado; menu abriu/fechou, busca enviada retornou 60 produtos, console verificado sem warnings/erros. Medição foi rejeitada no navegador de teste; não foram feitos login/OAuth, compra ou clique afiliado real.
- O token local foi recusado com 401, assim como o preflight GitHub [40416399728](https://github.com/carloshg-dev/PromoRadar/actions/runs/40416399728). A sessão existente do painel foi retomada com Google e a publicação do Cloudflare funcionou. Nenhuma credencial foi criada, rotacionada ou ampliada. O fluxo de publicação direta pelo GitHub continua sem acesso válido à API.
- Esta entrega comprova publicação e smoke; não mede redução de CPU, volume humano ou falsos positivos do WAF. A checagem única anterior continua histórica e inconclusiva. Os recibos agregados e capturas locais ficam em `reports/`, com descrição em `docs/THEME_PUBLICATION_2026-10-26.md`. Nenhuma alteração adicional da aplicação foi necessária.

## 26/10/2026: promoção para main autorizada e validada

- Destino desta entrega: `main`, pela [PR #7](https://github.com/carloshg-dev/PromoRadar/pull/7), autorizado explicitamente pelo proprietário após a prévia. A integração inclui a base de produção e a identidade visual; a `main` anterior (`8dd476d`) ainda não continha essa evolução da aplicação.
- Sincronizar o histórico de `main` produziu o candidato `1da953e` sem mudar a árvore do visual `95217fa`: ambas `794b4c9a7ab177252275f65bfa467a907f08d5e6`. O workflow exclusivo da `main` já tinha conteúdo idêntico; nenhum conflito ou mudança de aplicação foi necessário. Foram preservados os quatro screenshots locais não versionados de outra etapa.
- CI [40273680113](https://github.com/carloshg-dev/PromoRadar/actions/runs/40273680113) aprovado: tipos da aplicação/runners, testes de crescimento/coleta e ensaio de memória. Build OpenNext Linux com instalação própria aprovado; pacote **1.558,04 KiB gzip**, abaixo de 3.072 KiB. Nenhum deploy foi executado.
- Worker local com Wrangler 4.151.2 e compatibilidade efetiva `2026-08-23`: primeira rodada 22/23, com timeout de 20 s em ofertas; repetição 23/23, ofertas 200 em 123 ms com cache disponível. A causa inicial não foi perfilada; não interpretar a repetição aquecida como prova de desempenho a frio ou CPU de produção.
- Conferência das colunas de `scrape_jobs` e `produtos` via GET `limit=0`, ambas 200 e sem linhas. Nenhuma coleta real ou DDL foi disparada para validar a promoção. Varredura dos 259 arquivos do candidato e de 1.355 arquivos do pacote sem valores privados configurados encontrados.
- Agendamentos existentes passam a encontrar os scripts atualizados quando a integração em `main` é concluída. O workflow de comparações conserva o checkout explícito de `codex/cloudflare-migration`; o Cloudflare também conserva seu ramo de publicação. Merge em `main` e publicação do novo visual no domínio continuam sendo operações separadas.
- Recibos e limites em `docs/MAIN_PROMOTION_2026-10-26.md`. O status definitivo do merge e seu SHA são os da PR vinculada; os documentos anteriores abaixo são históricos.

## 26/10/2026: manutenção integrada e identidade em prévia

- PR #5 integrada no ramo de produção `codex/cloudflare-migration`, commit `2878a44c65e7fef3b782587eed89bbdffaed219b`; PR #6 integrada em `main`, commit `8dd476d24bc7fe25dd30103d02103c34521acbb9`. A primeira contém manifestos/retenção; a segunda somente o workflow de simulação. A aplicação completa ainda não foi unificada em `main`.
- Execução manual Actions [40260038272](https://github.com/carloshg-dev/PromoRadar/actions/runs/40260038272) aprovada após as integrações: 38.159 linhas, 211 comparações e 45 escopos, versão publicada no Storage `714e2b3b-96e7-4d2c-8b10-0de4eb06a9db`. Retenção executada em **dry-run**, quatro versões observadas, três legadas, zero objetos candidatos e zero exclusões. Isso valida o workflow integrado; não comprova dias consecutivos de agendamento.
- Actions de empacotamento [40259294608](https://github.com/carloshg-dev/PromoRadar/actions/runs/40259294608) aprovado; a etapa de publicação ficou **skipped**. Não é prova de nova versão atendendo tráfego no Cloudflare. A última versão pública comprovada continua sendo a registrada abaixo; não foi revalidada nesta etapa.
- Modernização visual implementada em `codex/theme-refresh`, baseada em `2878a44`, com prévia local antes da publicação, conforme escolha explícita do usuário. Tema claro, navegação, busca e catálogo recompostos; consultas compartilhadas, cache, redirects afiliados e consentimento preservados. A prévia usa dados reais somente para leitura; nenhum deploy do novo visual, WAF, DNS ou DDL nesta etapa.
- Build Next de produção aprovado, home com 122 kB de JS inicial reportado pelo Next. QA de home, ofertas, comparador, produto e login em desktop/celular, busca enviada e radar salvo/removido no navegador local. Detalhes e limites em `docs/THEME_REFRESH_2026-10-26.md`.
- A queda sustentada de CPU/1102 depende da comparação de janelas reais. Não converter o novo layout ou o build aprovado em prova de eliminação dos erros.

## Continuação de manutenção em 25/10/2026: candidato local

- Confirmada a primeira atualização automática por `workflow_run`: Actions `40201873261`, sucesso às 11:24:59 BRT, checkout `675b9d318f7a23cf1d24d598d188750be0f8a710`, 38.159 ofertas, 211 comparações e 45 escopos. Índice publicado `2882b9cb-2047-40dc-8e71-171a3a6dbd80`, relido no Storage. Uma execução automática não comprova continuidade diária de `schedule`.
- Retenção preparada em `codex/comparison-retention`: manifesto por geração completa, simulação padrão, sete dias + ativo + três gerações completas recentes, páginas/lotes de 100 e spool NDJSON. `--apply` exige versão esperada e revalida índice/elegibilidade. Legados sem manifesto são preservados. Não foi executada exclusão remota.
- Simulação real com guard de rede somente leitura: três gerações legadas preservadas, zero candidatos e zero exclusões; sete GETs e duas listagens. HEAD público confirmou catálogo 200, bots Awario/MJ12 403 e alias 404. Conexões MCP atuais não listam os recursos alvo; leitura do Storage usa a configuração de servidor existente, sem alterar acessos ou recuperar o painel.
- A melhoria nova depende de revisão e integração separadas: código no ramo de produção e somente workflow em `main`. O fluxo automático proposto executa apenas dry-run. Não houve merge, deploy, mudança WAF/DNS ou coleta nova nesta continuação. Produção permanece no release registrado abaixo; CPU comparável ainda aguarda acompanhamento.
- Detalhes e limites em `docs/COMPARISON_RETENTION_2026-10-25.md`.
- Entrega para revisão: [PR #5](https://github.com/carloshg-dev/PromoRadar/pull/5), código/manifestos, e [PR #6](https://github.com/carloshg-dev/PromoRadar/pull/6), somente workflow em `main`, dependente de #5. Ambas em rascunho. CI `40256036514` passou no código `d2fc5e3b0d81825e6154020dfbf26bf3cb858382`: tipos da aplicação e runners, 89 testes Linux e ensaio de memória de coleta. Vercel mantém bloqueio anterior da conta; não confundir esse status com o Cloudflare em produção. Documentação posterior não muda o código funcional validado.

## Proteção e CPU: publicação confirmada em 25/10/2026

- PRs #2 e #4 integradas em `codex/cloudflare-migration`; SHA publicado **`675b9d318f7a23cf1d24d598d188750be0f8a710`**, Worker **`f6e91608`**, Ready, **100% do tráfego**, build **`cf5fcd66-04f9-474c-9761-0f6dd61466a7`**. A primeira publicação desta rodada foi `f3f055e`/`fc8a5f07`; a final inclui o fechamento de aliases.
- Duas regras WAF e um rate limit estão ativos: bloqueio de Awario/MJ12; catálogo GET/HEAD restrito ao Brasil com exceção de `cf.client.bot`; 60 leituras de catálogo por IP em dez segundos, bloqueio por dez segundos. Integrações, autenticação, `/api/track` e `/r/` não entram na expressão geográfica. Bots de teste receberam 403 e leitura normal 200.
- `workers.dev` e URLs de prévia desabilitados e fixados no Wrangler. Painel atualizado confirmou os dois switches desligados; URL alternativa respondeu 404 e ambos os domínios oficiais responderam 200/TLS. Não houve mudança de DNS ou contratação de plano.
- Comparações pré-calculadas no runner, bucket PRIVADO `catalog-comparisons`, publicação por índice após geração integral. Primeiro dry-run/local: 38.128 ofertas e 212 comparações. Primeiro run Actions **`40196927610`**, manual, bem-sucedido: **38.087 ofertas, 211 comparações e 45 escopos**, índice **`efc67271-4fd3-4021-9388-7ab5e5ea64f6`**. Os recibos foram obtidos em horários distintos e não representam uma transação única; não são medição de venda ou visita. Acesso anônimo ao objeto privado foi recusado.
- PR #3 integrada em **`main`**, SHA **`2b4887793f74e82017989806245a10f82e3ef2ec`**, com SOMENTE o novo workflow. Gatilhos após coleta bem-sucedida e às 08:15/23:15 BRT; checkout explícito do ramo de produção. Workflow ativo, execução manual provada, **continuidade por schedule ainda não provada**. Aplicação e demais scripts de `main` continuam separados do release.
- Tipos, **78 testes Linux**, CI `40196163599`, validação de pacote `40196162807`, Next/OpenNext, gzip local **1.582,57 KiB**, **23 contratos HTTP locais** e **19 contratos públicos** aprovados. Catálogo público e categoria retornaram 60 links de produto cada; comparador renderizou 60 grupos. QA desktop/mobile sem overflow ou erros na amostra; nenhum clique humano afiliado foi seguido.
- Sitemap ajustado para leitura limitada por cursor após `57014` na ordenação global. Regras de matching/PromoScore e atribuição afiliada preservadas; mais prefetch removido, logo servido estaticamente e cache de páginas finais de ofertas/categorias por cinco minutos.
- Credenciais S3/R2 locais foram recusadas (401), sem rotação. Storage do Supabase existente foi confirmado com a chave já disponível; sem nova DDL, políticas públicas ou migração de conta. O checkout original e suas alterações de terceiros continuam preservados.
- Limites: CPU antes/depois **ainda sem janela comparável**; fila de revalidação `direct` permanece, assim como a necessidade de retenção de versões para uso prolongado do cache. Não declarar eliminação dos estouros nem confundir latência HTTP com CPU. Evidências em `docs/CPU_PROTECTION_2026-10-25.md` e `docs/evidence/cpu-release-2026-10-25.json`.

## Publicação confirmada em 20/10/2026

- Publicação autorizada pelo usuário e concluída pelo fluxo Git/Builds existente. [PR #1](https://github.com/carloshg-dev/PromoRadar/pull/1) integrado em **`codex/cloudflare-migration`**, SHA **`4bf5e517644fd2ddea1693387f2f7541f1fb6f93`**, às 20:30 de Brasília. Cloudflare concluiu o build às 20:32; painel confirmou versão **`ade85b7e`**, Ready, **100% do tráfego**. `main` não foi atualizado.
- CI de crescimento `39515226475`, validação do pacote `39515413275` e Build Cloudflare `be30fb6a-b0ce-4d57-b4e6-247c4ce8bfa6` passaram. A árvore funcional do merge coincide com o candidato `d078b28`. Hook manual não foi acionado, DNS não foi alterado e não houve DDL remota ou migração do banco.
- **17 contratos HTTP públicos aprovados**: home, assets, apex/www com TLS, busca/leitura Supabase, produto, ofertas recentes, comparador, cupons, sitemap/robots, login/callback sem código, proteção de admin e saídas de robô/prefetch/HEAD sem seguir loja. QA em produção desktop/mobile confirmou busca, 60 datas dentro de sete dias, menu e salvar/remover a própria oferta de teste no radar; console sem avisos/erros. Após rejeitar medição, a janela observada não teve requisição de analytics. Não foram feitos login real, OAuth, escrita sintética de eventos nem clique humano de afiliado.
- Baseline anterior: versão `b1c6a140`, 24h com 5,3% de erros e cerca de mil estouros de CPU. Nova versão, amostra inicial esparsa de três minutos: painel mostrou 0% de erro e CPU mediana 125,04 ms. Não são janelas comparáveis e não comprovam economia de CPU ou estabilidade. O comparador público respondeu em 13,27 s no smoke e merece a próxima otimização; são latências HTTP, não tempo de CPU.
- Candidato final: build `m-8-2gP_HoUmwmvU1WNSh`, 70 testes Linux, tipos, Next/OpenNext, dry-run gzip **1.574,01 KiB**, 23 contratos HTTP no workerd e QA desktop/mobile aprovados. Paridade de 269 arquivos entre índice Git e laboratório, normalizando apenas CRLF/LF. As mudanças pré-existentes de navbar, `.gitignore` e `cronograma-site` permanecem fora do release.
- Busca, categorias e recomendações excluem preços com mais de sete dias. O histórico e os links antigos de produtos continuam acessíveis. Prefetch removido de filtros, lojas e paginação: duas amostras completas da busca observaram 28 requisições locais, sendo quatro prefetches de navegação e **uma única requisição de `/ofertas`**. O baseline anterior truncado continha pelo menos 46 prefetches; não é comparação controlada nem medição de CPU de produção.
- A auditoria remota de metadados do Supabase passou em transação somente leitura (run `39477445211`). Confirmados RLS, grants e nomes de triggers; `eventos.tipo` é texto sem CHECK restritivo e colunas de privilégio do usuário não têm INSERT/UPDATE para `authenticated`. Não foram exportadas linhas nem executada DDL. OAuth e escrita no Worker de produção continuam sem prova nova.
- Os tokens de API Cloudflare local/GitHub foram rejeitados no preflight; deploy ficou pulado no run de auditoria `39477445206`. A sessão do painel foi retomada com o perfil já usado pelo projeto, sem criar token ou ampliar permissões. Runtime pós-publicação confirmou presença das nove variáveis/segredos esperados e dos bindings R2/autorreferência, sem revelar valores. Vercel continua retornando bloqueio da conta e não é o destino que atende este release.
- Relatórios/coleta novos ainda não estão ativos por agendamento em `main`. Migração do banco para outra conta continua adiada. Plano e recibos atuais: `docs/RELEASE_2026-10-20.md`.

## Registro da homologação anterior em 20/10/2026

O registro abaixo descreve a etapa anterior. O bloqueio de navegador foi superado e o estado externo/publicação foi revalidado acima.

- Upgrades em `codex/cloudflare-migration`, ainda no working tree: medição por consentimento, radar, SEO, relatórios, segurança da coleta e curadoria recente da home.
- A rodada da home passou por tipos, 60 testes Linux, build Next/OpenNext e dry-run Wrangler. Após limitar a quatro as requisições HTTP por renderização da home, as 12 fontes responderam no ensaio de leitura e o build não registrou `57014`. Isso não comprova estabilidade sob carga; a continuação abaixo registra o candidato mais recente.
- Continuação às 07:36 de Brasília: 23 verificações HTTP aprovadas no workerd, com R2/assets/autorreferência locais e leitura pública do Supabase. Wrangler 4.151.2 isolado suportou a data `2026-08-23`; as dependências da aplicação não foram atualizadas. Procedimento automatizado em `npm run test:worker`, somente para checkout Linux saneado.
- Continuação: autenticação e medição testadas com Supabase Auth/PostgREST/Postgres locais reais. Os 16 contratos passaram, incluindo persistência dos 14 eventos e leitura pelo relatório. Corrigidos destino inseguro de autenticação e descarte de eventos por normalização de loopback do Next. O fixture contém políticas locais de referência; não comprova paridade de RLS, grants ou triggers remotos.
- Candidato após essas correções: 64 testes Linux, tipos, build Next/OpenNext `lStAG4HrK68e0lzWShgzw`, dry-run gzip 1.573,82 KiB e nova rodada de 23 contratos HTTP no Worker aprovados. Novo comando `npm run test:auth-measurement`; laboratório Supabase e daemon Docker próprios encerrados, volumes preservados. Detalhes em `docs/AUTH_MEDICAO_2026-10-20.md`.
- O QA desktop/mobile e a medição de prefetch foram feitos antes do último ajuste do backend. A repetição do QA visual do candidato final está bloqueada porque o uso do navegador está desativado nas configurações do Work; falta repetir esse smoke antes de publicar.
- Não foram feitos commit, push, deploy, DNS, DDL remota, coleta real ou alteração de dados de produção nestas etapas. Houve DDL somente no banco local fictício. A leitura do Supabase atual foi comprovada, mas o acesso administrativo ao painel continua sem recuperação.
- A migração do banco para outra conta foi adiada pelo usuário. Continuar usando a configuração existente até planejamento e validação específicos da migração.
- Evidências: `docs/AVANCO_CRESCIMENTO_2026-10-20.md`, `docs/UPGRADE_HOME_2026-10-20.md`, `docs/HOMOLOGACAO_WORKER_2026-10-20.md` e `docs/AUTH_MEDICAO_2026-10-20.md`. A persistência de eventos foi provada no banco local fictício; HTTP local não prova QA visual, medição de usuários em produção, atribuição afiliada, CPU de produção ou expiração do cache.
- Não inferir DNS, implantação ou saúde atual de produção do registro de agosto abaixo. O estado externo não foi revalidado nesta atualização local.

## Registro histórico de 24/08/2026

O conteúdo a seguir conserva a verificação de agosto e pode estar desatualizado.

Última verificação: 24/08/2026, horário de Brasília.

## Resumo

**Migração Vercel → Cloudflare em andamento. Sem cutover DNS. Não apagar a Vercel.**

## Fatos medidos

- Checkout local: branch `codex/cloudflare-migration`, commit `22d16cb`; remoto da branch no mesmo commit durante a verificação.
- `origin/main` permanece em `6d39852`; a correção `22d16cb` ainda não está em `main`.
- O run `32682664547` validou `22d16cb`, mas não publicou porque o deploy real exige `workflow_dispatch` com `deploy=true`.
- Cloudflare: o Worker `promodetec` existe, mas está sem implantação ativa, versões ou builds.
- A URL `promodetec.alinessgarcia.workers.dev` foi testada e retorna a página vazia do Cloudflare, não a aplicação.
- A zona `promodetec.com.br` foi criada no plano Free; os 10 registros importados são equivalentes aos 10 registros do Registro.br.
- O Cloudflare atribuiu dois nameservers, mas eles ainda não foram aplicados no Registro.br.
- Há um registro DS publicado para o domínio. DNSSEC precisa ser tratado antes da troca de nameservers.
- DNS autoritativo: servidores do Registro.br (`d.sec.dns.br` e `f.sec.dns.br`).
- Apex `promodetec.com.br`: registro A `216.198.79.1`.
- `www.promodetec.com.br`: CNAME para infraestrutura da Vercel.
- O domínio público continua exibindo o estado pausado da Vercel.
- Coletas diárias permanecem em GitHub Actions e Supabase; não dependem do Worker executar Playwright.
- O GitHub CLI local está com token inválido e o navegador mantém o GitHub bloqueado por preferência salva; o deploy não foi disparado por contorno.

## Working tree

- Existem alterações sazonais em andamento e exclusões antigas fora desse escopo.
- Trate tudo como **não publicado** até commit, push e deploy serem confirmados separadamente.
- Nunca use `git add -A` sem revisar a árvore inteira.

## Gates antes do DNS

1. Publicar a correção aprovada e confirmar versão/SHA exatos e bindings por nome.
2. Habilitar/confirmar uma URL de teste e obter HTTP 200 da Home.
3. Fazer smoke de assets, Supabase público, `/r/{id}`, autenticação e rotas protegidas.
4. Concluído: inventário da zona original, incluindo A, CNAME, MX, SPF, DKIM e verificações.
5. Concluído: zona Cloudflare Free criada com correspondência 10/10.
6. Publicar e testar o Worker antes de ativar a zona.
7. Tratar DNSSEC e pedir aprovação humana explícita no momento da alteração de nameservers.
8. Ligar apex e `www` ao Worker, aguardar TLS e repetir smoke externo.
9. Manter rollback da Vercel durante a observação; remover somente após estabilidade comprovada.

## Próxima decisão

Não modificar DNS ainda. O próximo passo é liberar o acesso do navegador ao GitHub ou disparar manualmente o workflow `Deploy Cloudflare Worker` na branch `codex/cloudflare-migration`, marcando a opção de publicação. Depois: confirmar SHA/URL, executar smoke, tratar DNSSEC e só então aprovar a troca de nameservers.
