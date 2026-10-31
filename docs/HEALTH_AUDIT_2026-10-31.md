# Auditoria de saúde, afiliação e catálogo — 31/10/2026

## Resultado e estado

Há evidência atual para recomendar **Workers Paid imediatamente**, a partir de **US$ 5/mês**: o painel autenticado registrou aproximadamente 5 mil estouros de CPU em 24 horas. Essa contratação aumenta o limite por execução; imagens, preços de origem, consultas SQL e automações exigem correções próprias. Não foi feita contratação nem alteração de cobrança.

A auditoria preparou correções no ramo `codex/health-affiliate-audit`, partindo de `main`/`f4e72f20306aa19bc79591878c0660e6774f7058`, entregues na [PR #13 em rascunho](https://github.com/carloshg-dev/PromoRadar/pull/13). **Candidato para revisão, sem integração ou publicação nesta etapa.** O navegador está indisponível para a ferramenta, e houve indisponibilidade intermitente de consulta no laboratório. Não declarar o site estabilizado ou o QA de navegação concluído.

Evidência agregada versionada: [health-audit-2026-10-31.json](evidence/health-audit-2026-10-31.json). Recibos detalhados locais em `reports/health-audit-2026-10-31/`, fora do Git. Sem IPs, e-mails, valores de secrets, URLs assinadas de feeds ou hooks privados neste relatório.

## Cloudflare: CPU, impacto e custo

O painel autenticado confirmou a conta do domínio, Worker `promodetec`, fonte **main/f4e72f2**, versão **3a725a85**, com **100% do tráfego**, às 06:10 UTC. É a implantação posterior ao release visual, com alteração documental; a identidade funcional escolhida A continua sendo a base. Uma versão confirmada nesse horário não é garantia de ausência de deploy posterior.

| Métrica, últimas 24 horas, todas as versões | Leitura do painel |
| --- | ---: |
| Invocações | aproximadamente 19.480 |
| Erros totais | aproximadamente 5.160 |
| CPU exceeded | aproximadamente 5.000 |
| CPU p50 / p90 / p99 | 43,96 / 286 / 632 ms |
| Memória p50 / p99 | 34,99 / 50,72 MB |
| Memória excedida | 0 no gráfico consultado |
| Subrequests | aproximadamente 23.190 |
| Supabase 2xx / 4xx / 5xx | aproximadamente 21 mil / 1 mil / 121 |

A versão ativa tinha uma amostra distinta: aproximadamente 889 invocações, 96 erros e 9,9% no indicador de erro; mediana CPU 66,35 ms. Os gráficos e indicadores têm arredondamento/janelas diferentes. Não transformar esses valores em uma taxa exata comum. A janela de 24 horas mistura versões e não permite atribuir melhora ou piora ao novo layout.

O limite gratuito de CPU é **10 ms por solicitação**. As leituras de CPU superam esse orçamento. Não confundir CPU com latência HTTP, nem invocações com visitantes. Os locais Atlanta/Dulles no painel são pontos da rede Cloudflare, não países das pessoas. Não foi obtida uma segmentação atual confiável por país, agente, regra WAF ou rota 1102 antes do bloqueio do navegador; não foi demonstrada a proporção de bots e pessoas ou de falsos positivos.

Quando a execução pública é interrompida, o visitante pode receber erro 1102, falha de navegação, busca ou API. Também há execuções de cache, pré-carregamento e serviços; **5 mil erros não significam 5 mil pessoas afetadas**. Falta o detalhamento por rota/trigger para medir o alcance.

Segundo a [tabela oficial de preços](https://developers.cloudflare.com/workers/platform/pricing/) e os [limites Workers](https://developers.cloudflare.com/workers/platform/limits/), Workers Paid parte de US$ 5/mês, com 10 milhões de solicitações e 30 milhões de ms de CPU incluídos. Excedentes: US$ 0,30/milhão de solicitações e US$ 0,02/milhão de ms de CPU. É o plano **Workers Paid**; o plano Pro do domínio não substitui essa contratação.

Exemplos aritméticos a 19.480 invocações/dia durante 30 dias, com médias de CPU hipotéticas:

| CPU média hipotética | CPU no mês | Base + excedente de CPU |
| --- | ---: | ---: |
| 50 ms | 29,22 milhões de ms | US$ 5,00 |
| 100 ms | 58,44 milhões de ms | US$ 5,57 |
| 300 ms | 175,32 milhões de ms | US$ 7,91 |

São cenários, não previsão, teto ou conversão cambial. A mediana não fornece a média faturável. Tributos, câmbio, armazenamento e outros serviços ficam fora desses exemplos. Configurar alertas/limites adequados ao contratar e medir novamente depois. O Paid deve resolver a causa específica do orçamento gratuito de CPU; não há garantia de eliminar todo erro.

## Catálogo e lojas afiliadas

Varredura completa do recorte `produtos.em_estoque=true`: **42.567 registros**, por cursor de ID, páginas de 250 e agregações limitadas. Foram encontrados **20.326 com observação nos últimos sete dias**. Não é cópia integral do banco, transação atômica nem confirmação de estoque/preço no checkout de cada loja.

A API oficial da Awin confirmou **14 programas ativos** para o publisher existente. A lista de feeds foi consultada separadamente. Convite, aprovação, feed disponível, produto ingerido e comissão paga são provas diferentes.

| Programa Awin ativo | Feeds disponíveis | Produtos em estoque / recentes em 7 dias | Diagnóstico |
| --- | ---: | ---: | --- |
| AliExpress | 20 | 14.846 / 3.940 | Moeda e imagens exigem quarentena; ver abaixo |
| Acer | 0 | ausente | Afiliação não está trazendo catálogo |
| Carrefour | 0 | 635 / 0 | Última observação 04/10; adapter dedicado não está renovando a amostra |
| Diesel | 1 | 0 / 0 | Loja inativa; workflow de importação somente manual |
| Doce Beleza | 0 | ausente | Sem feed acessível na lista; não há ingestão comprovada |
| Dufrio | 2 | 876 / 876 | Coleta recente; 3 imagens amostradas retornaram 404 |
| Eudora | 2 | 897 / 897 | Coleta recente |
| KaBuM | 1 | 6.063 / 3.080 | Feed e adapter próprio; coleta recente |
| L'Occitane | 1 | 726 / 362 | Coleta recente |
| Olympikus | 1 | 3.693 / 1.190 | Coleta recente |
| Panasonic | 1 | 0 / 0 | Loja inativa; feed disponível não a reativa |
| Polishop | 1 | 755 / 596 | Coleta recente |
| Spicy | 1 | 745 / 360 | Coleta recente |
| Trocafy | 1 | ausente | Programa aprovado ainda não constava no registro do coletor |

Outras fontes: Amazon 2.863/972 recentes; Shopee 7.805/7.805; Sieno 457/248. Aprovação e recebimento de comissão dessas redes não foram revalidados em seus painéis. Mercado Livre tinha 409 registros sem atualização recente, com última observação em 25/06. Extra e Ponto tinham 899 e 898, sem atualização em sete dias, última observação 17/08; não apareceram entre os programas Awin ativos. Preços antigos já devem ficar fora das vitrines pela regra de recência.

O candidato alinha o registro Awin aos 14 programas, inclui Trocafy e corrige os domínios atuais Acer/Diesel. Não se afiliou a novos programas, não reativou lojas remotas e não disparou coleta. Acer/Doce Beleza precisam de uma fonte permitida; Panasonic/Diesel precisam de revisão de reativação. O importador manual legado Diesel ainda usa leitura integral do feed e escolha do menor preço/conversão fixa: **não reativá-lo antes de corrigir esses contratos**. Seu cron já estava desativado; este candidato não o liga.

Os links Awin existentes foram recontados reconhecendo os dois formatos: `pclick` usa `a/m`; `cread` usa `awinaffid/awinmid`. Não foram encontrados links Awin com publisher divergente ou ausente no recorte verificado. Um contador inicial que reconhecia somente `cread` foi descartado; não usar sua classificação antiga. Isso verifica estrutura/conta, não venda ou comissão aceita. Os 7.805 links Shopee continham o identificador esperado. Links comuns Mercado Livre não tinham mapa manual de afiliação; o código agora deixa de chamá-los de monetizados.

## Preços, imagens e exposição

O adapter Awin anterior podia escolher o **menor entre preço atual, referência e preço antigo**, além de converter USD/EUR por taxas fixas. Isso pode anunciar um preço que não é o preço atual brasileiro. A amostra de 300 linhas do primeiro feed AliExpress continha **282 CNY e 18 USD**, sem BRL; não é uma amostra dos 20 feeds completos. Os quatro feeds domésticos amostrados omitiam `currency`; a API confirmou BRL para seus programas. A documentação Awin prevê usar a moeda do programa quando o campo é omitido.

Correção candidata: usar apenas `search_price` como preço atual; referência somente quando válida e maior; aceitar BRL explícito ou moeda BRL do programa confirmado; não estimar câmbio. **AliExpress fica fora de vitrines, busca rápida, comparações, posts e saída afiliada enquanto a proveniência BRL não for resolvida.** Links antigos abrem “Preço em verificação”, sem valor/Offer em BRL. Não foram apagados nem reescritos os preços ou históricos. A liberação exige reingestão com comprovação de moeda e revisão; não basta retirar a quarentena do código.

Foram encontrados **10.530 registros AliExpress com foto genérica** no recorte em estoque. O servidor retornar 200/image não significa foto de produto: oito observações de `noimage.gif` retornaram os mesmos 959 bytes. Em 38 observações de imagem, incluindo repetições, houve 34 respostas com tipo imagem (incluindo as oito genéricas), três 404 Dufrio e um host fora da lista permitida do ensaio. Não extrapolar essa amostra para uma taxa de falha global.

O candidato rejeita URLs genéricas conhecidas na coleta e nas listagens. Não inventa fotos. Ainda falta validar disponibilidade de todas as imagens reais, principalmente Dufrio; uma URL não genérica pode retornar 404. Isso deve ser uma verificação assíncrona no runner, limitada por lote/cache, sem uma requisição externa por imagem em cada visita.

Política de exposição candidata: **primeira prateleira da home até R$ 300**, demais vitrines e listagem padrão até R$ 1.000. Filtros de R$ 100/300/500/1.000/2.000/5.000 e “Todos os preços” permitem escolha explícita. O teto filtra produtos; não reduz seus preços, não apaga itens caros e não falsifica estoque. Preço alto sozinho não prova fraude. A amostra de buscas inclui placas de vídeo/notebooks acima de R$ 2 mil; não há base para afirmar que ninguém procura essa faixa.

## Segurança e automação

1. **Campanhas públicas demais:** GET anônimo confirmou acesso a três campanhas, inclusive não publicadas e com caminhos locais. Não foram exportados seus conteúdos. A política em `db/campanhas.sql` usa `using(true)`. Os consumidores atuais usam o cliente de servidor/admin. Proposta restritiva preparada em `db/proposals/2026-10-31-campanhas-private.sql`, **não aplicada nem homologada em banco isolado**. Revisar/testar e aplicar em etapa própria; depois provar leitura negada para anon/authenticated e pipeline/admin preservados.
2. **Dependências:** `npm audit --omit=dev` indicou seis pacotes afetados: Next (crítico), nanoid, postcss, source-map-js, undici e zod (altos). Alertas não provam exploração; alguns exigem funcionalidades/configurações específicas. Next 14.2.35/App Router exige atualização de segurança compatível com OpenNext. Não foi feito `audit fix --force` nem upgrade major às cegas. A configuração permissiva de imagens remotas também precisa ser revisada.
3. **Tabelas privadas:** inspeção SQL existente, transação somente leitura, Actions [41174549700](https://github.com/carloshg-dev/PromoRadar/actions/runs/41174549700), confirmou RLS em usuários, eventos, cliques e jobs; colunas de privilégio sem INSERT/UPDATE para clientes e trigger de proteção presente. GET anônimo de usuários/eventos/cliques negado; jobs sem linhas visíveis. Não é certificação integral do banco.
4. **Secrets públicos:** zero correspondências dos 13 valores privados conhecidos em 16 respostas iniciais HTML/JS, aproximadamente 1,23 MB. É varredura limitada aos assets consultados, não prova de ausência em todo histórico/site.
5. **Coletas reais:** execuções por `schedule` de 29–30/10 concluíram; jobs do banco confirmaram lotes, inclusive 5.912 Awin, 622 Amazon e 1.841 no grupo Lomadee em 30/10. Shopee 30/10 salvou 7.805 após ler 100 mil; 29/10 falhou e 27/10 foi parcial. Execução verde isolada não prova continuidade ou saúde de cada loja.
6. **Marketing falhou:** pipeline de conteúdo 29–30/10 falhou em curadoria por `statement timeout`, última execução [41101888640](https://github.com/carloshg-dev/PromoRadar/actions/runs/41101888640). Não há prova nova de entrega Telegram/Discord. O candidato adiciona as guardas de moeda, foto, recência e teto nessa seleção; **não resolve nem declara resolvido o timeout SQL**. Nenhum post foi enviado durante a auditoria.
7. **Comparações:** índice GET 200, schema/prazo válidos, geração 30/10 às 17:00:51 UTC, idade de 13,62 h na leitura, 60 grupos atuais. Schedule [41094938404](https://github.com/carloshg-dev/PromoRadar/actions/runs/41094938404) aprovado; `workflow_run` 41175881115 de 31/10 ficou skipped. A nova filtragem retira ofertas com moeda pendente também de snapshots antigos.
8. **Backup:** schedule [40343260286](https://github.com/carloshg-dev/PromoRadar/actions/runs/40343260286), 26/10, aprovado, assim como 19/10. Restauração não foi testada. Não chamar o banco de recuperável sem ensaio de restore.
9. **Estoque por volume:** foi removida do candidato a rotina que desativava loja e marcava produtos sem estoque quando havia 1–199 itens. Um catálogo pequeno não prova falta de estoque. Não foram reativadas lojas ou revertidos dados históricos remotamente.

## Demanda e experiência medidas

Em 30 dias foram lidas **408 ações consentidas**, com **25 buscas**, e **1.847 solicitações de redirecionamento**. Não são visitantes únicos, vendas ou garantia de usuários humanos; podem incluir ações de QA/dono. Principais termos: `5060` (7), `cama` (3), `celular`, `controle xbox`, `fone` (2 cada). A base é pequena para personalização automática ou inferência de renda. O hero barato atende uma decisão editorial explícita; manter busca/faixas para tech e testar resultados por cliques consentidos antes de mudar o ranking por “popularidade”.

Produção respondeu nas 14 leituras sintéticas de sete rotas (home, ofertas, busca, categoria, comparador, login e admin). Nenhum 1102 apareceu nessa amostra; isso **não contradiz** os milhares do painel. Sem teste de carga, login real, compra, clique afiliado humano ou gravação artificial de eventos. Tempo HTTP não é CPU.

Na lista paginada, o candidato passa a buscar **60 linhas para mostrar 60**, em lugar do pool de mil reordenado por comissão. Ordenação, filtro de orçamento/imagem e contagem ficam no banco; a URL/atribuição afiliada permanece. Muda a prioridade para a ordenação por nota, atualização e ID; a economia numérica de CPU em produção ainda não foi medida.

## Validação do candidato e próximos passos

- Typecheck, build Next e **86 testes de crescimento + 28 de coleta** aprovados. Build `HFhwUT_wJnxzNAHp6uOFM`. Houve um aviso parcial `[home] source_unavailable 57014`; não ocultar a degradação sob o status verde do build.
- No candidato funcional **8c70e7b66289f51ab9c21d8af983644251bd9498**, CI Linux [41178271434](https://github.com/carloshg-dev/PromoRadar/actions/runs/41178271434) aprovado, incluindo tipos, testes e ensaio de memória. Homologação OpenNext/workerd [41178276271](https://github.com/carloshg-dev/PromoRadar/actions/runs/41178276271) aprovada: **1.572,20 KiB gzip**, **23/23 contratos**, buildId `nB-BnJPYoRFjlqSgvqxCw`, Wrangler 4.151.2 e compatibilidade efetiva `2026-08-23`. Etapas de publicação e bindings remotos ficaram **skipped**. Recibo relido do artifact, não inferido do nome do workflow. A aprovação dessa amostra não elimina a falha local intermitente nem substitui navegador/CPU de produção.
- Contratos locais com dados reais verificaram home com 24 cards, primeira prateleira até R$ 300, teto geral, faixas até R$ 300/500/100, seleção explícita de todos os preços, busca rápida e quarentena do produto/redirect. A primeira leitura de `/ofertas` falhou na carga de dados; repetição isolada retornou 60 cards. A recuperação não demonstra correção da causa nem desempenho a frio. Recibos preservam a primeira falha.
- **QA interativo pendente:** a ferramenta continua retornando `Local browser use is disabled in Work settings`, inclusive após o proprietário informar reativação. Não houve teste de cliques, overflow ou console desktop/mobile nesta auditoria. HTTP não substitui esses testes.
- Sem deploy, DNS, WAF, DDL, alteração de produtos, cobrança, novas credenciais ou coleta real nesta etapa. A execução remota nova de SQL foi somente a inspeção de metadados existente. Limites/uso faturável do Supabase continuam inconclusivos sem acesso ao projeto na Management API/painel.

Ordem prática: (1) contratar Workers Paid no recurso correto; (2) homologar o candidato no Worker e navegador, corrigir indisponibilidade de consulta e publicar; (3) fechar exposição de campanhas e atualizar Next/dependências com validação isolada; (4) corrigir fontes ausentes/imagens Dufrio e curadoria SQL; (5) medir janelas equivalentes após publicação, com rota/trigger/país/agente e eventos WAF. Não repetir automaticamente esta checagem nem prometer eliminação de erros antes dessas provas.

Fontes primárias complementares: [programas Awin](https://help.awin.com/apidocs/get-program-information), [feeds Awin](https://help.awin.com/developers/docs/hosting-feeds), [lista de feeds](https://help.awin.com/developers/docs/product-feed-list-download), [Next/RSC DoS](https://github.com/advisories/GHSA-h25m-26qc-wcjf) e [otimizador de imagens](https://github.com/advisories/GHSA-9g9p-9gw9-jx7f). Nenhuma exploração ou carga hostil foi executada.
