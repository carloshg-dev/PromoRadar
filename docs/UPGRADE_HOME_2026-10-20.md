# PromoDetec: curadoria recente e menos navegação antecipada

20/10/2026. Continuação local dos upgrades, usando o Supabase atual. Sem migração, escrita no banco, publicação ou alteração de secrets.

Etapa seguinte concluída no mesmo dia: [23 verificações HTTP no Worker local](HOMOLOGACAO_WORKER_2026-10-20.md). O smoke visual final continua pendente.

## Resultado

- Vitrines da home selecionam produtos com preço positivo e finito, estoque cadastrado, imagem HTTP(S) válida e coleta nos últimos sete dias. Datas futuras, placeholders e as lojas já reservadas ao comparador continuam fora da seleção.
- O feed de parceiros, o rodízio e o destaque compartilham um único pool por render. O cache fica dentro dessa renderização, sem estado global entre visitantes. Cada pool consulta até 24 produtos por loja. Todas as fontes da home, incluindo notícias e históricos, compartilham uma fila com no máximo quatro requisições HTTP em andamento por renderização; o limite não é global entre visitantes.
- A home compara as opções do próprio pool recente, reutilizando o algoritmo de agrupamento existente. A página de comparação completa conserva a leitura anterior; o destaque não faz mais outra varredura de até dois mil produtos.
- Um `AbortSignal` de oito segundos é compartilhado pelas consultas da home, inclusive históricos encadeados. O prazo interrompe a espera HTTP; não é garantia de cancelamento de todo processamento interno do PostgreSQL.
- Os links dos cards, destaque e menus deixam de antecipar páginas automaticamente. O clique continua abrindo o produto normalmente e as saídas afiliadas continuam em `/r/{id}`.
- As três miniaturas do rodízio usam imagem nativa com carregamento lazy e decodificação assíncrona. Evitam redimensionamento dessas imagens pelo Worker, mas dependem do tamanho do arquivo servido pela loja. Não é prova de melhora de LCP.
- A data da seleção aparece na home. O destaque informa “Preço coletado”, data relativa e referência da loja. Diferenças entre classes não prometem economia de um modelo idêntico.
- O preço e o gráfico demonstrativos foram removidos do fallback. Falta de seleção recente recebe um estado vazio com acesso ao catálogo completo.

## Falha encontrada na validação e correção

O primeiro pacote compilou com as vitrines vazias. Uma execução direta do componente no mesmo laboratório retornou produtos reais, enquanto a pré-renderização registrou falhas `57014` e estouro do prazo. Os fallbacks vazios mascaravam a indisponibilidade durante a geração estática.

A correção distingue vazio válido, resultado parcial e falha total. Se todas as vitrines estão vazias e houve falha de leitura, a geração lança erro; o gate foi exercitado e interrompeu o build nesse cenário. Isso permite que uma revalidação mal sucedida preserve o cache anterior conforme o contrato do Next; a operação concreta no Worker ainda requer homologação.

Filtros extras de preço/data na view foram retirados. A versão final ordena pools limitados por data e valida a elegibilidade antes de escolher/exibir os produtos. Essa abordagem evita depender de predicados adicionais na view, mas pode deixar itens elegíveis fora do pequeno pool. Não representa uma consulta exaustiva do catálogo. O plano SQL não foi medido com `EXPLAIN`.

Uma versão intermediária passou com um aviso parcial `source_unavailable 57014`. O ensaio seguinte, somente de leitura, registrou falhas em oito das 12 fontes. Foi acrescentado um limite compartilhado de quatro requisições HTTP, com cancelamento também da fila pendente. No ensaio após esse ajuste, as 12 fontes responderam sem erro em até 5,2 segundos; Carrefour e Mercado Livre retornaram vazio válido. O build final também terminou sem `source_unavailable` ou estouro do prazo.

Evidências: [fontes antes do limite](evidence/home-sources-before-limit-2026-10-20.json) e [fontes após o limite](evidence/home-sources-after-limit-2026-10-20.json). São amostras sequenciais, sujeitas a cache, rede e carga externa; não isolam causalidade nem comprovam saúde contínua do banco. A fila libera a vaga quando `fetch` recebe a resposta, sem aguardar o consumo completo do corpo.

O ISR da home permanece em 7.200 segundos. A janela de sete dias vale para a seleção gerada, cuja data é mostrada ao visitante. Cache e falhas de revalidação podem prolongar a idade da página; o preço final deve ser confirmado na loja.

A elegibilidade usa `atualizado_em` exposto por `vw_ofertas`, conforme o contrato atual do produto. Ela não equivale a uma conferência do checkout nem substitui o diagnóstico por `visto_em` do relatório de saúde. Não foi alterada a view ou a persistência para unificar esses dois campos.

## Evidência local

Dois ensaios de 30 segundos no Next de produção local, com viewport 1.280 × 900, sem clique em loja e analytics desligado:

| Requisições recebidas pelo servidor local | Antes | Depois |
| --- | ---: | ---: |
| Páginas de produto antecipadas por RSC | 8 | 0 |
| Outros pedidos RSC | 11 | 13 |
| Otimizador de imagem | 1 | 1 |
| Total observado | 23 | 16 |

[Antes](evidence/home-prefetch-before-2026-10-20.json), [depois](evidence/home-prefetch-after-2026-10-20.json). A medição posterior usa o build intermediário `Yh1j5k8hDk7bXKCBrbB4f`, anterior ao limite compartilhado de consultas. É uma amostra por versão, com pools rotativos e caches do navegador/servidor. Não é benchmark controlado nem medição de CPU do Worker, audiência ou conversão. Os 13 pedidos RSC restantes mostram que a antecipação de outras rotas ainda existe.

No QA visual anterior ao último ajuste do backend, 94 elementos de data na home estavam válidos, sem futuro ou idade superior a sete dias no momento observado. Foram conferidos 95 links internos de produto, navegação após clique, retorno à home, busca completa, miniaturas e ausência de overflow em 1.280 e 390 px. A consulta ao console dessa aba não apresentou erros/avisos. As contagens DOM incluem duplicações dos carrosséis, não produtos únicos.

A repetição visual do build final foi bloqueada pela configuração do Work: “Local browser use is disabled in Work settings”. Não foi tentado outro navegador ou mecanismo para contornar essa restrição. As capturas e a medição de prefetch são da rodada anterior; o limite compartilhado foi validado por testes, leitura real e build. Repetir o smoke visual desse build antes da publicação.

## Validação

- TypeScript aprovado.
- 38 testes de crescimento aprovados no Windows; 60 testes de crescimento/coleta aprovados no Linux. Escritas e redirecionamentos dos testes são simulados.
- Build Next + OpenNext aprovado em Ubuntu/WSL, Node 22.23.3, com `OPENNEXT_CLOUDFLARE=1`. JS inicial estimado da home: 240 kB, versus 246 kB na entrega anterior; isso é saída do build, não Web Vitals.
- Wrangler dry-run aprovado: 7.549,70 KiB sem compressão e 1.574,47 KiB gzip. Nenhum upload ou deploy realizado.
- Inspeção Impeccable sem alertas nos alvos modificados; `git diff --check` aprovado.
- Valores privados conhecidos conferidos em fonte e assets; [escopo e resultado](evidence/secret-scan-home-2026-10-20.json).

Registro final: [validação e paridade dos 14 arquivos do candidato com o laboratório](evidence/home-validation-2026-10-20.json), build `1HnzyB3z6YhD4mq8MZYKI`. O bundle não inclui os módulos pesados de coleta inspecionados; `package-lock.json` permanece igual.

Capturas: [desktop](evidence/screenshots/home-fresh-desktop-2026-10-20.jpg), [celular](evidence/screenshots/home-fresh-mobile-2026-10-20.jpg), [destaque no celular](evidence/screenshots/home-fresh-highlight-mobile-2026-10-20.jpg).

## Fronteiras e próximo ciclo

O catálogo completo, as URLs afiliadas, o cálculo de PromoScore, os registros históricos, as permissões e os dados do Supabase não foram alterados. A classificação de modelos usada no comparador foi reutilizada; ainda não garante variantes idênticas.

A migração para outra conta segue adiada conforme sua orientação. Estes upgrades usam a configuração existente e não acrescentam dependência de uma segunda conta. As novas credenciais serão configuradas no ambiente quando a migração for retomada.

Antes de publicar: repetir o smoke visual final, observar as leituras sob carga concorrente, validar o Worker com bindings reais e medir CPU/startup/cache, homologar eventos/Auth/atribuição afiliada e revisar a primeira retirada Shopee. A fila `direct` continua emitindo aviso do OpenNext. Nenhum desses resultados locais equivale a publicação ou estabilidade de produção.

Próximo trabalho de produto: qualificar referências de desconto suspeitas e comparar modelo/variante com precisão, mantendo coletas recentes e explicação do histórico.

## Referências

- [Next 14: prefetch](https://nextjs.org/docs/14/app/api-reference/components/link#prefetch).
- [Next 14: erro na revalidação e cache anterior](https://nextjs.org/docs/14/app/building-your-application/data-fetching/fetching-caching-and-revalidating#error-handling-and-revalidation).
- [Supabase: AbortSignal](https://supabase.com/docs/reference/javascript/using-modifiers-abortsignal).
