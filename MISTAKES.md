# MISTAKES.md: caderno de erros do PromoDetec

Leia antes de qualquer trabalho. Registre erros e quase-erros com causa e prevenção; não use este arquivo para culpar pessoas nem para guardar secrets.

## Modelo de entrada

```text
## AAAA-MM-DD: título
- Fato observado:
- Causa confirmada ou hipótese:
- Correção:
- Regra preventiva:
- Evidência/estado:
```

## 2026-08-23: Workflow verde não significa site acessível

- Fato observado: o run `32682664547` validou a branch `codex/cloudflare-migration`, mas as etapas de publicação foram puladas; o Worker existente informa “Nenhuma rota ativa” e o domínio ainda resolve para a Vercel.
- Causa: deploy do script, roteamento e DNS são operações independentes.
- Correção: validar URL de teste, bindings, rota customizada, TLS e smoke tests antes do cutover.
- Regra preventiva: registrar run, branch, SHA e etapas executadas; verde em branch não prova merge, deploy nem produção.

## 2026-08-24: Recurso Worker confundido com aplicação implantada

- Fato observado: o recurso `promodetec` aparecia no Cloudflare, mas a tela detalhada mostrou zero implantações ativas, versões e builds; o `workers.dev` retornou página vazia.
- Causa: a existência e a data do contêiner foram usadas como atalho para inferir deploy.
- Correção: conferir implantação ativa, histórico de versões, SHA e resposta HTTP da URL pública.
- Regra preventiva: um Worker nominal sem versão identificada deve ser tratado como não implantado.

## 2026-08-23: Quase remoção prematura da Vercel

- Fato observado: `promodetec.com.br` usa DNS do Registro.br; o apex aponta para `216.198.79.1` e `www` para um CNAME da Vercel.
- Causa: a existência do Worker foi confundida com a conclusão da migração.
- Correção: manter a Vercel como rollback até Cloudflare + DNS + TLS + rotas críticas ficarem estáveis.
- Regra preventiva: só remover a origem antiga após cumprir todos os gates de `skills/cloudflare-cutover/SKILL.md`.

## 2026-08-23: Playwright entrou no bundle do Worker

- Fato observado: o build OpenNext tentou resolver `playwright-core/chromium-bidi`; depois do isolamento inicial, o bundle ainda excedeu o limite gratuito.
- Causa: além do Playwright, o grafo de coleta e uma rota dinâmica de imagem OpenGraph alcançavam o Worker.
- Correção: isolar todo o runtime de coleta e servir metadata estática quando possível.
- Regra preventiva: medir numericamente o gzip do Wrangler; dry-run verde sem gate de tamanho não prova aceitação pelo plano.

## 2026-08-23: Secret obrigatório ausente interrompeu o workflow

- Fato observado: o preflight inicial parou por ausência de `NEXT_PUBLIC_SITE_URL` e `CRON_SECRET`; outra execução detectou `ML_REDIRECT_URI` ausente no conjunto opcional do Mercado Livre somente após build.
- Causa: ambientes Vercel e GitHub não compartilham variáveis automaticamente.
- Correção: validar presença por nome e conjuntos opcionais completos antes de `npm ci`.
- Regra preventiva: nunca imprimir valores; bindings obrigatórios devem estar comprovados antes de ativar tráfego na nova versão.

## 2026-08-23: Re-run pode testar o commit antigo

- Fato observado: reexecutar um job anterior repetiu o erro mesmo depois de outro commit conter a correção.
- Causa: “Re-run jobs” conserva o SHA da execução original.
- Correção: iniciar um novo workflow na branch/commit desejado.
- Regra preventiva: sempre registrar run, branch e SHA antes de interpretar o resultado.

## 2026-08-23: Correção de infraestrutura misturada com mudanças visuais

- Fato observado: commits da migração combinaram alterações de bundle/deploy com ajustes de componentes e hidratação.
- Causa: staging amplo em uma árvore que já continha trabalho de outros escopos.
- Correção: separar infraestrutura, frontend e conteúdo em commits revisáveis por caminhos explícitos.
- Regra preventiva: nunca usar `git add -A` em árvore suja e revisar o diff staged antes do commit.

## 2026-06-25: Extensão oculta gerou `.png.png`

- Fato observado: assets editados no Windows terminaram com extensão dupla e referências frágeis.
- Causa: tipos de arquivo estavam ocultos no Explorer.
- Correção: verificar nomes reais com `Get-ChildItem` antes de renomear ou referenciar.
- Regra preventiva: não inferir extensão pela interface do Explorer.

## 2026-06-25: Build passou, mas o runtime visual já apareceu sem estilos

- Fato observado: houve uma execução local renderizada como HTML sem o CSS esperado, apesar de builds anteriores verdes.
- Causa: não confirmada.
- Correção: além de tipos/build, iniciar o servidor e inspecionar a rota real e o console.
- Regra preventiva: build não substitui smoke test; frontend exige QA visual desktop/mobile.

## 2026-10-20: Coleta Shopee verde com retirada de ofertas antigas falhando

- Fato observado: a execução agendada `39203743608`, no SHA `6d398524c171da9403c76bce01f6561ed743afc4`, salvou 7.955 selecionados, recebeu timeout ao retirar ofertas antigas e concluiu com sucesso.
- Causa: a falha do stale sweep era apenas registrada no log; o processo não falhava. Lotes de upsert com erro também podiam permitir a continuação até a retirada.
- Correção local: persistência com checkpoint em `scrape_jobs`, interrupção em qualquer lote com erro, retirada por cursor/lotes de 250 e conclusão parcial/falha com saída não zero. Ainda sem execução real ou publicação.
- Regra preventiva: uma limpeza incompleta nunca autoriza status verde. O primeiro saneamento exige revisão do impacto: o feed é curado por Top N, portanto retirar um item do recorte não prova falta de estoque na loja. O baseline legado deve usar a última coorte, e não todo o inventário acumulado.

## 2026-10-20: Fallback vazio escondeu falhas de leitura na home estática

- Fato observado: uma compilação terminou verde com todas as vitrines vazias. Consultas diretas retornaram produtos; a pré-renderização apresentou falhas `57014` e estouro do prazo.
- Causa confirmada: erros eram convertidos em arrays vazios sem distinguir indisponibilidade de ausência de produtos. O custo específico do plano SQL não foi perfilado.
- Correção local: pools limitados, recentes e compartilhados; comparação do próprio pool; validação da elegibilidade fora dos novos predicados da view. Falha total de leitura impede a geração/cache de uma home vazia. Um build intermediário ainda teve aviso parcial; após limitar a quatro as requisições HTTP por renderização, as 12 fontes responderam no ensaio e o build final passou sem esse aviso. Não é prova de estabilidade sob carga.
- Regra preventiva: verificar produtos reais no runtime, além do build e dos mocks. Distinguir vazio válido, resultado parcial e indisponibilidade; não publicar um catálogo vazio por engolir erros.
- Evidência: `docs/UPGRADE_HOME_2026-10-20.md`. Sem publicação ou DDL.

## 2026-10-20: Runtime local reduziu a compatibilidade pretendida

- Fato observado: o Wrangler 4.59.2 executou o preview, mas avisou que o runtime suportava somente `2026-01-14`, anterior à data configurada `2026-08-23`.
- Causa: versão instalada do workerd anterior à data pedida. HTTP 200 não comprova uso dessa compatibilidade.
- Correção: repetição dos 23 contratos HTTP com Wrangler 4.151.2 instalado fora da aplicação; recibo confirmou `2026-08-23` sem redução.
- Regra preventiva: registrar versão e data efetiva do runtime; não chamar a primeira resposta do cache populado de geração a frio nem usar latência local como CPU de produção.
- Evidência: `docs/HOMOLOGACAO_WORKER_2026-10-20.md`. Lockfile e produção não alterados.

## 2026-10-20: Destino de autenticação controlado pela URL pública

- Fato observado: o formulário passava `next` direto ao roteador e o callback concatenava esse valor à origem. O parser demonstrou que `@external.test/` mudava o hostname no callback anterior, sem executar navegação externa.
- Causa: tratar um parâmetro público como caminho interno sem validação comum aos dois fluxos.
- Correção local: `safeAuthDestination` aceita somente caminho interno e rejeita esquemas, autoridades, barras invertidas, controles e normalização para `//`; callback usa `new URL` com base. Testes preservam caminhos internos com query/fragmento.
- Regra preventiva: validar destinos antes de chamar roteador ou construir callbacks. Não inferir sucesso de OAuth ou publicação a partir desses testes.
- Evidência: `docs/AUTH_MEDICAO_2026-10-20.md`. Sem troca de credenciais ou configuração de provedores.

## 2026-10-20: HTTP 204 ocultou eventos descartados por origem normalizada

- Fato observado: a primeira integração com Supabase local retornou 204 com zero eventos novos. NextRequest continha URL `localhost` e headers `Host`/`Origin` em `127.0.0.1`. Duas regressões reproduziram o descarte legítimo e a aceitação do endereço local alternativo antes da correção.
- Causa: comparar `Origin` somente com a origem da URL normalizada pelo Next.
- Correção local: comparar protocolo e Host da requisição, rejeitar autoridade malformada e manter os filtros de consentimento/privacidade. Após o ajuste, os 14 tipos foram persistidos e lidos pelo relatório.
- Regra preventiva: 204 não comprova persistência. Integrar com banco isolado, conferir deltas e testar a autoridade HTTP real; não confiar em headers de proxy arbitrários.
- Evidência: `docs/AUTH_MEDICAO_2026-10-20.md`. O contrato de referência local não comprova as políticas de produção.

## 2026-10-20: Busca promovia preço antigo como oferta atual

- Fato observado: `/ofertas?busca=fone` promovia um preço coletado havia 98 dias. O detalhe mostrava o aviso, mas a lista não tinha a mesma proteção de recência da home.
- Causa: listagens paginadas e recomendações não filtravam a janela de atualização.
- Correção: estoque, preço positivo, atualização entre agora e sete dias atrás e prazo de consulta; desempate por ID. Textos informam a janela, sem promessa de preço em tempo real. Histórico e comparação completa mantêm seus contratos.
- Regra preventiva: conferir a data do produto no runtime de busca/categoria; vazio válido e erro de consulta precisam de mensagens diferentes. Três testes de regressão cobrem a fronteira do repositório.

## 2026-10-20: Filtros geravam renderizações antes de qualquer clique

- Fato observado: amostra truncada da busca continha pelo menos 46 prefetches e 42 chamadas de `/ofertas`, sem interação.
- Causa: `Link` com prefetch automático nas categorias, lojas e paginação compartilhadas.
- Correção: `prefetch={false}` nesses links. Duas amostras completas do candidato observaram somente uma chamada de `/ofertas`; quatro prefetches de navegação permaneceram.
- Regra preventiva: medir rede ociosa além da navegação funcional. Registrar viewport, duração, truncamento e limites; não converter esse ensaio local em percentual de economia de CPU de produção.

## Manutenção do registro

Quando um erro novo ocorrer: corrija o sistema, adicione a entrada aqui e transforme o procedimento em skill somente se ele for recorrente e verificável.

## 2026-10-25: Tipagem da aplicação não incluía scripts de comparação

- Fato observado: o typecheck da aplicação passou, mas a verificação explícita dos scripts detectou parâmetro mutável incompatível com as verticais readonly.
- Causa: `scripts/` está fora do tsconfig principal; executar via tsx não faz checagem estática.
- Correção: contrato do gerador aceita entradas readonly; `tsconfig.comparisons.json` e gate próprio no CI cobrem geração e retenção, com os tipos globais do Next para os imports compartilhados.
- Regra preventiva: mudanças em runners exigem tipagem do entrypoint real, além de testes e typecheck do frontend.

## 2026-10-25: Build verde com dependências compartilhadas não provou o Worker
- Fato observado: o pacote compilou, mas 17 dos 23 contratos HTTP falharam com require dinâmico de middleware-manifest.json no workerd.
- Causa: a hipótese de caminho real das dependências compartilhadas foi confirmada operacionalmente pela repetição com npm ci no diretório próprio; não houve alteração funcional do manifesto.
- Correção: dependências instaladas no laboratório, recompilação e 23 contratos repetidos com sucesso.
- Regra preventiva: para homologar o pacote OpenNext, instalar dependências no próprio checkout saneado e verificar o runtime; symlink de node_modules não comprova paridade de empacotamento.
- Evidência: docs/evidence/worker-lab-2026-10-25.json.

## 2026-10-25: Ordenação global do sitemap interrompeu publicação
- Fato observado: dois builds falharam com 57014 ao ordenar produtos por atualização; a consulta isolada também falhou.
- Causa: o plano SQL não foi perfilado; a forma de consulta é o gargalo observado, sem atribuir a um índice inexistente não verificado.
- Correção: amostra limitada por cursor/PK e validação de estoque, preço e recência; 1.000 URLs lidas em 1,53 s e build aprovado.
- Regra preventiva: sitemap não pode depender de ordenação global cara nem converter timeout em catálogo vazio silencioso.
