# PromoDetec: autenticação e medição com banco local

20/10/2026. Branch `codex/cloudflare-migration`, HEAD `42fdec5` mais alterações locais. Continuação da [homologação HTTP do Worker](HOMOLOGACAO_WORKER_2026-10-20.md).

**16 contratos de integração aprovados com Supabase Auth, PostgREST e PostgreSQL reais, executados localmente.** Os 14 tipos de evento chegaram ao banco e foram contabilizados pelo relatório. A sessão por senha respeitou a separação entre usuário e administrador no contrato de referência. Nenhuma conta, evento ou clique de teste foi criado em produção.

## Duas correções na aplicação

### Destino após autenticação

O formulário usava `next` diretamente no roteador; o callback concatenava a origem com esse valor. A expressão anterior com `next=@external.test/` produz uma URL de outro domínio. A reprodução foi feita pelo parser de URL, sem navegar para esse endereço.

`src/core/auth-redirect.ts` agora aceita somente caminhos internos, limita o tamanho e rejeita esquemas, autoridades externas, barras invertidas, controles e normalizações para `//`. Formulário e callback compartilham essa função. Caminho, query e fragmento internos continuam funcionando. Não foram alterados aparência, papéis ou provedores de login.

### Eventos válidos descartados no ambiente local

A primeira integração retornou HTTP 204 sem inserir eventos. O Next normalizou a URL para `localhost`, enquanto os headers `Host` e `Origin` continuaram em `127.0.0.1`. Comparar somente `Origin` com `req.nextUrl.origin` descartava o lote legítimo e aceitava indevidamente o endereço local alternativo.

`sameRequestOrigin` compara a origem recebida com protocolo e autoridade HTTP efetivos. Rejeita um Host malformado e não usa `X-Forwarded-Host`. As duas regressões falharam antes da correção e passaram depois. Os filtros de consentimento, DNT, GPC, robôs e prefetch continuam ativos. Uma falha de escrita retorna 503; o teste de chave estrangeira confirmou ausência de gravação parcial no lote.

Impacto: formulário/callback de autenticação e `/api/track`. Helpers puros, sem consultas adicionais ou dependências novas. O contrato de destino fica mais restrito; valores inválidos voltam para `/`.

## Evidência de integração

[Recibo final: 16/16](evidence/auth-measurement-lab-2026-10-20.json). O [recibo anterior](evidence/auth-measurement-before-origin-2026-10-20.json) preserva 11 aprovações e cinco falhas: quatro dependiam da gravação descartada pela origem; a quinta era uma asserção do laboratório que interpretava `Location` relativo sem uma URL base. Não eram cinco falhas distintas do produto.

| Verificação | Resultado local |
| --- | --- |
| Todos os 14 tipos de evento | Persistidos e recuperados pelo relatório, um de cada tipo |
| Termo com contato e campos livres de referer/cidade | Não persistidos nos eventos |
| DNT, GPC, origem externa, bot, prefetch e consentimento recusado | Nenhuma linha adicional |
| Lote com produto inexistente | HTTP 503 e nenhuma linha parcial |
| Inserção direta de eventos por anon/autenticado | Negada pelo contrato local |
| Cadastro com metadados de administrador | Perfil local permaneceu `user` |
| Alterar o próprio papel ou ler outro perfil | Negado no contrato local |
| Admin sem sessão, com sessão comum e com sessão administrativa | Login, home e HTTP 200, respectivamente |
| API administrativa com usuário comum e com administrador | HTTP 401 e validação de corpo HTTP 400 |
| Cookie com assinatura inventada | Rejeitado pelo Auth real |
| Saída para loja | HTTP 302 e um clique local; redirecionamento externo não seguido |
| Relatório | Deltas de 14 eventos, um clique e dois cadastros fictícios |
| Chave administrativa local nos assets do navegador | Nenhuma ocorrência, leitura em streams de 64 KiB |

As sessões foram emitidas pelo GoTrue e serializadas pelo SDK SSR. O servidor Next recebeu os cookies por HTTP. Não se trata de sessão inventada por mock, mas também não é um teste de login pelo navegador.

## Limite do contrato de banco

O [OpenAPI atual](evidence/measurement-public-contract-2026-10-20.json) foi consultado somente para nomes, tipos e obrigatoriedade das colunas. Uma tentativa de leitura de metadados pela Management API recebeu 403 e foi encerrada. Não foi exportado o schema completo.

`tests/integration/fixtures/measurement-auth.sql` é um contrato mínimo de referência, com dados fictícios, RLS, grants e triggers locais. **Não é dump do banco nem migration para produção.** As políticas escolhidas para o laboratório não comprovam as políticas, CHECKs, grants ou triggers do projeto remoto. O arquivo exige marcador explícito de laboratório antes de criar qualquer tabela.

O ensaio usa Next dev para a integração com credenciais exclusivamente locais. Separadamente, o build de produção e o Worker foram verificados com leitura pública e medição desativada. Ainda não foi comprovada a escrita autenticada no runtime Cloudflare com bindings reais.

## Execução e isolamento

Acrescentado `npm run test:auth-measurement`, com implementação em `scripts/validate-auth-measurement.ts`. Exige Linux, cópia separada da aplicação sem arquivos `.env`/`.dev.vars`, API em `127.0.0.1:55321`, credenciais locais explícitas e a tabela marcadora do contrato. O processo não herda chaves ou webhooks da aplicação principal. As chamadas `fetch` da ferramenta e do servidor ficam limitadas ao loopback e não seguem redirects.

Para repetir:

1. Iniciar um projeto Supabase local próprio, vazio, com Auth, PostgREST, Postgres e API publicada somente em loopback. Conferir os bindings reais antes de usar as credenciais.
2. Aplicar o fixture em uma transação com `SET LOCAL promodetec.lab = 'measurement-auth'`. Não usar o banco de produção nem um banco local que contenha dados necessários.
3. Guardar `API_URL`, `ANON_KEY` e `SERVICE_ROLE_KEY` do projeto local em arquivo privado fora do checkout. Preparar outra cópia da aplicação, com as mesmas fontes, configurações e dependências, sem arquivos de ambiente.
4. Executar, a partir da cópia de validação, apontando os dois caminhos absolutos:

```bash
PROMODETEC_AUTH_LAB_APP=/caminho/absoluto/app-local \
PROMODETEC_AUTH_LAB_ENV=/caminho/privado/local.env \
npm run test:auth-measurement
```

5. Conferir o recibo e encerrar o projeto Supabase próprio. A ferramenta encerra o servidor Next que iniciou. Repetições acrescentam somente contas/eventos fictícios ao laboratório; os testes comparam deltas e não truncam tabelas.

Nesta máquina, o Docker Desktop apresentou falha de inicialização. O ensaio usou um daemon Docker independente e temporário no WSL, com binários oficiais, socket e diretórios próprios, sem reset do Docker Desktop. O [inventário do laboratório](evidence/auth-lab-runtime-2026-10-20.json) registra versões e bindings. O [encerramento](evidence/auth-lab-cleanup-2026-10-20.json) confirma containers parados, daemon próprio encerrado e portas fechadas; volumes preservados.

## Validação do candidato

| Gate | Resultado |
| --- | --- |
| TypeScript | Aprovado |
| Testes de crescimento e coleta no Linux | 64 aprovados |
| Integração com banco local | 16 aprovados |
| Next/OpenNext após as duas correções | Aprovado, build `lStAG4HrK68e0lzWShgzw` |
| Dry-run Wrangler | 7.551,88 KiB; gzip 1.573,82 KiB; sem publicação |
| Workerd local após recompilar | [23 verificações aprovadas](evidence/auth-worker-smoke-2026-10-20.json), compatibilidade efetiva `2026-08-23` |
| Paridade das fontes e manifesto | [Recibo do candidato](evidence/auth-source-parity-2026-10-20.json) |
| Valores privados conhecidos em fontes/evidências/assets | [Varredura por streaming](evidence/secret-scan-auth-2026-10-20.json) |

O build não registrou `57014`. Continuam os avisos existentes sobre a fila OpenNext `direct` e uso de `process.version` do SDK Supabase no bundle Edge. Não foram alteradas dependências ou lockfile. Os quatro novos testes são duas regressões de origem e dois testes de destino de autenticação.

As seis leituras da home no Worker foram HIT do cache previamente populado. Latências locais, ausência de aviso de CPU e gzip do bundle não comprovam CPU, estabilidade sob carga, expiração ou recuperação do cache em produção.

## Pendências antes de publicar

O navegador continua desativado nas configurações do Work; falta repetir o QA desktop/mobile do candidato final. OAuth, recuperação de senha, paridade das políticas remotas, atribuição nas redes afiliadas, expiração do cache e CPU com bindings Cloudflare reais permanecem sem essa prova.

A migração de conta do banco permanece adiada pelo usuário. Commit, push, publicação e qualquer DDL remota dependem de revisão e aprovação humana explícita. Nenhum desses passos foi executado.

## Referências do procedimento

- [Supabase: desenvolvimento local](https://supabase.com/docs/guides/local-development).
- [Supabase: testes locais](https://supabase.com/docs/guides/local-development/cli/testing-and-linting).
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).
- [Docker: binários oficiais para testes](https://docs.docker.com/engine/install/binaries/).
