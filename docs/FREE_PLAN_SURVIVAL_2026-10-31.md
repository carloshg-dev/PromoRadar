# PromoDetec: mitigação de CPU sem nova cobrança

Data: 31/10/2026. Pedido atual: ganhar tempo no plano gratuito preservando a navegação. A contratação foi descartada por restrição de caixa. A pré-aprovação de continuidade/main dada pelo proprietário continua válida.

## Entrega de infraestrutura

Candidato funcional `95fe010a2dd5a96a4843f9acb8d9c3743ad9feaf`, [PR #14](https://github.com/carloshg-dev/PromoRadar/pull/14), baseado em `main/f4e72f2`. A publicação será registrada separadamente após o merge e a comprovação pública.

- Entry point próprio chama o Worker gerado pelo OpenNext. Antes de renderizar, consulta o Cache API para GETs públicos elegíveis da home, ofertas, categorias, produto e comparador.
- Resposta íntegra reaproveitada por **120 segundos**, por POP. Host, URL, filtros, HTML/RSC, árvore do roteador e build têm chaves distintas. O nonce de transporte RSC é retirado apenas quando os headers da variante também entram na chave.
- Sessões, cookies desconhecidos, administração, login, APIs, medição e saídas afiliadas seguem o caminho original. Não há cache de Set-Cookie, erro, redirecionamento, Vary desconhecido ou fallback de dados indisponíveis. Cookies de analytics/Cloudflare sem estado no servidor não obrigam nova renderização.
- Inspeção de prefixo limitada a 64 KiB; restante por stream com backpressure. Limite de 1 MiB por cópia armazenada. Falha de cache preserva a resposta original; não há mapa global crescente na RAM.
- Proxy público de `/_next/image` encerrado. As imagens existentes são diretas e o único caller de `next/image` é o logo, que já era `unoptimized`. Nenhum serviço de transformação foi contratado.

Não há alteração de classes CSS, texto, navegação, desenho do hero/rodapé, regras de preço ou atribuição afiliada nesta entrega. As únicas mudanças nas páginas são marcadores não visuais de integridade e a detecção de falhas que já tinham fallback. As melhorias de catálogo continuam separadas na [PR #13](https://github.com/carloshg-dev/PromoRadar/pull/13).

## Validação do pacote exato

- [CI de contratos 41185478419](https://github.com/carloshg-dev/PromoRadar/actions/runs/41185478419): tipos da aplicação/runners, 85 testes de crescimento, 28 de coleta e ensaio de memória aprovados. Um teste adicional de cookies separados foi aprovado depois; somente testes/documentação mudaram após o candidato funcional.
- [OpenNext/workerd 41185469428](https://github.com/carloshg-dev/PromoRadar/actions/runs/41185469428): **35/35 contratos**, expiração nativa e recuperação do cache, HTML/RSC, rotas anônimas/protegidas e saída técnica sem clique. BuildId `GhYTqcZJ2Wtn1mUJZKs3-`, Wrangler 4.151.2, compatibilidade efetiva `2026-08-23`, **1.575,51 KiB gzip** de 3.072 KiB.
- **512/512 respostas quentes** com status/conteúdo esperados, concorrência 1/8/32/64 e zero falhas nessa amostra. Baseline de 16 renderizações, concorrência 2, também preservou o catálogo. Os testes foram locais; não submetemos Supabase ou o site publicado a essas rajadas.
- O profiler V8 local observou muito menos amostras ativas no caminho HIT. Os valores no recibo são contagens e intervalo solicitado de 100 µs; não são CPU faturada ou garantia de cumprimento de 10 ms em produção. RSS do processo Miniflare/workerd não representa memória de um isolate.
- Inspeção visual interativa e conta real não foram repetidas: a ferramenta de navegador continua desativada. Esta é uma entrega de infraestrutura; layout/copy/componentes visíveis permanecem iguais à main. O pacote de catálogo da PR #13 conserva sua pendência de homologação visual.

Nos ensaios anteriores, um teste de cupons falhou ao revalidar ISR depois do vencimento. Confirmado no adapter instalado: ele escolhe HTTP para `localhost` e HTTPS para outros hosts; usar `127.0.0.1` fazia o laboratório tentar TLS na porta HTTP própria. O runner passou a usar `localhost`; o gate não foi retirado. O WebSocket global do Node 22 também falhou no handshake do profiler local; o runner usa o cliente já distribuído com o Next, sem nova dependência no Worker.

## Banco: alteração aplicada e limite do resultado

O índice de ordenação foi validado em PostgreSQL isolado com 121.927 produtos sintéticos e comparação dos mesmos 60 resultados. Em seguida, [run 41184205225](https://github.com/carloshg-dev/PromoRadar/actions/runs/41184205225) criou **concorrentemente** `idx_produtos_vitrine_ordem`, com limites de lock, duração e memória. Recibo confirmou `valid/ready`, **2.138.112 bytes**, banco **270.388.371 bytes**, aproximadamente 258 MiB. Não houve mudança de produtos, preços, estoque, RLS ou credenciais.

A consulta real mais restritiva levou **4.327,223 ms antes** e **4.361,120 ms depois** no plano padrão. Portanto, não há ganho de latência comprovado por esse índice sozinho. O planner ainda lê/filtra milhares de linhas e ordena. Uma transação de leitura que forçou o caminho ordenado respondeu em 71,916 ms; o teste não mudou configurações da aplicação. Regex e collation ASCII também foram avaliados somente em leitura e não resolveram por completo. Esses resultados indicam uma próxima otimização da consulta/contagem, sem atribuir tempo SQL à CPU do Worker. O resultado rápido do fixture não foi extrapolado para produção.

O tamanho SQL não mede egress, armazenamento de objetos ou demais quotas Supabase. Não foi contratado plano, iniciado restore, copiado banco nem aplicada a proposta de políticas de campanhas.

## Produção e critérios de acompanhamento

Antes da publicação, 12 leituras públicas leves passaram em 31/10: home com 24 produtos, busca/categoria com 60, detalhe, comparador, assets, login, admin/callback e HEAD de saída. Nenhum 1102 observado nessa amostra; isso não contradiz os erros das últimas 24 h nem comprova sua eliminação. Sem clique de compra ou inserção sintética de eventos.

O painel/API Cloudflare não está disponível nesta etapa para medir uma nova janela. O último painel autenticado desta auditoria é o de 06:10 UTC: conta do domínio/Worker `promodetec`, versão `3a725a85`, main/f4e72f2. Uma comparação de CPU/1102 antes/depois precisa de janelas equivalentes, separadas por versão, e de dados atuais; não inferir melhora sustentada a partir do build ou do smoke.

Cache frio, variantes novas e sessões autenticadas ainda passam pelo Next. O Cache API é regional e pode remover entradas antecipadamente. Mesmo HIT continua sendo uma invocação do Worker. Portanto, esta mitigação **não garante zero 1102**, não retira o teto diário Free e não permite converter requisições em pessoas. O efeito esperado é poupar renderizações repetidas; deve ser confirmado depois da publicação.

Contingência: variável `PROMODETEC_PUBLIC_CACHE_DISABLED=1` desativa a camada, ou rollback da versão pelo fluxo existente. O índice novo pode ser removido com `DROP INDEX CONCURRENTLY public.idx_produtos_vitrine_ordem` se uma avaliação futura justificar; nenhuma reversão foi executada. Não criar token, alterar DNS/WAF, cobrança ou permissões para contornar acesso indisponível.

Fontes de contrato: [Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/), [limites Workers](https://developers.cloudflare.com/workers/platform/limits/), [custom worker OpenNext](https://opennext.js.org/cloudflare/howtos/custom-worker), [planos Supabase](https://supabase.com/pricing). Evidência agregada: `docs/evidence/free-plan-2026-10-31.json`.
