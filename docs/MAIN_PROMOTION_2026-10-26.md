# PromoDetec: promoção validada para main

O proprietário aprovou explicitamente enviar o resultado para `main` após a prévia. A [PR #7](https://github.com/carloshg-dev/PromoRadar/pull/7) foi redirecionada para esse destino. O registro definitivo da integração e seu SHA estão nessa PR.

## Impacto e preservação

A `main` em `8dd476d24bc7fe25dd30103d02103c34521acbb9` continha a aplicação anterior à evolução no ramo de produção. A promoção abrange 259 arquivos: base já validada de Cloudflare/cache, segurança, leitura limitada, coleta com falha segura, medição consentida e a interface atual. Não é uma alteração apenas de CSS.

O histórico de `main` foi incorporado ao ramo `codex/theme-refresh` no candidato `1da953eef3b9f9c0b76010e9260b16619780b211`. A árvore permaneceu **exatamente igual** à do visual revisado `95217fa9b2b2f77598a7af63495e6bf9c5e40192`: `794b4c9a7ab177252275f65bfa467a907f08d5e6`. O único arquivo exclusivo de `main`, o workflow de comparações, já estava idêntico. Não houve conflito nem alteração adicional da aplicação; os commits posteriores desta entrega apenas registram documentação e recibos.

Scripts de coleta chamados pelos agendamentos da `main` serão atualizados pela integração. Os testes cobrem falhas parciais, retenção segura e memória; as colunas usadas pelos novos checkpoints foram conferidas por leitura remota sem linhas. Não foi executada ingestão real ou retirada de produtos como teste.

O workflow de comparações mantém `ref: codex/cloudflare-migration`, e o workflow/Builds do Cloudflare mantém o ramo operacional anterior. Essa preservação evita trocar silenciosamente o código executado em uma publicação. Não foram alterados DNS, secrets, políticas de banco ou gatilhos de coleta. Quatro screenshots locais preexistentes permanecem fora do commit.

## Gates e evidências

| Gate | Resultado |
| --- | --- |
| CI do candidato | [40273680113](https://github.com/carloshg-dev/PromoRadar/actions/runs/40273680113), aprovado: tipos, crescimento, coleta e memória |
| Build | Next/OpenNext em cópia Linux com `npm ci` próprio, Node 22.23.3 |
| Pacote | 1.558,04 KiB gzip de 3.072 KiB; `deploy --dry-run` |
| Runtime | Wrangler 4.151.2; compatibilidade solicitada e efetiva `2026-08-23` |
| Primeira rodada HTTP | 22 aprovados, um timeout de leitura em ofertas |
| Repetição HTTP | 23 aprovados, zero falhas; assets, catálogo, produto, auth anônima, saídas técnicas e cache |
| Colunas de coleta | GET `limit=0`, `scrape_jobs` e `produtos` 200; zero linhas e zero escritas |
| Valores privados conhecidos | zero ocorrências nos 259 arquivos candidatos e nos 1.355 arquivos do pacote |

Recibos: [pacote](evidence/main-package-2026-10-26.json), [primeira rodada](evidence/main-worker-first-2026-10-26.json), [repetição](evidence/main-worker-lab-2026-10-26.json), [colunas](evidence/main-collection-schema-2026-10-26.json) e [varredura](evidence/main-secret-scan-2026-10-26.json).

O build usou a configuração existente apenas no processo, com guard GET/HEAD. O teste HTTP recebeu somente a chave pública, cache R2 e autorreferência locais e analytics desativado. O template `.env.example` foi preservado fora da aplicação executada, respeitando a recusa do gate a variáveis privadas. Os processos do validador foram encerrados pelo próprio script.

## Limites

O timeout inicial de 20 segundos não teve causa perfilada. Na repetição, ofertas respondeu 200 em 123 ms com cache disponível; isso não comprova geração a frio nem elimina um gargalo de rede/consulta. Os sinais locais de timeout SQL, falha de analytics e limite de CPU ficaram em zero; não são métricas de produção.

O QA visual anterior em 1440/390/1280 px e a revisão independente dos quatro ajustes continuam aplicáveis porque o código da interface não mudou. O gate HTTP não valida login/OAuth real, gravação de eventos remotos, atribuição comercial, expiração do cache ou retomada após falha do serviço de origem. As consultas de colunas não comprovam uma escrita de coleta ou todos os constraints do banco.

Integração Git não publica o novo visual no domínio. Não houve deploy nesta etapa, e não foi confirmada uma nova versão remota do Worker. Vercel continua com status externo de bloqueio da conta; não é o destino operacional deste release. A comparação de janelas reais de CPU permanece necessária.
