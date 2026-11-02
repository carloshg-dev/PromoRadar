# Revalidação do catálogo e dos cupons — 02/11/2026

## Problema medido

A aplicação publicada é o merge `5a7b12db25ed8a2a00ef1f4d1e5f19df841f54d8`, build público `0ajAsfCiO_aJKLpkClBAW`. Em02/11 às03:12:52UTC, `/cupons` ainda exibia67 campanhas/22 códigos do snapshot de01/11 às15:10:36.804UTC. O Storage privado, lido separadamente às03:13:29UTC, tinha200 campanhas/47 códigos, gerado às23:36:42.094UTC. O run **agendado** `41362906130`, main, concluiu com publicação e ambas as fontes `ok`. A coleta está executando; a página não acompanhou.

Home:200,48 produtos,14 parceiras, fonte pronta e NextSTALE. Outros15 contratos HTTP passaram às03:14:10UTC; não são prova de cliques, fotos decodificadas ou atualização de dados. Recibos negativos de01/11 e02/11 preservados em `reports/shop-release-2026-11-01/`; recibo do schedule em `reports/shop-release-2026-11-02/coupons-scheduled/`.

## Impacto e correção candidata

`queue: "direct"` faz a chamada HEAD por fetch ao domínio público. A [documentação OpenNext](https://opennext.js.org/cloudflare/caching) restringe esse modo ao preview e recomenda a fila Durable Object. A versão instalada1.14.10 contém o adapter e já exporta `DOQueueHandler` no Worker. O adapter simples em memória também referencia uma variável diferente da substituída pelo compilador dessa versão; não foi adotado como atalho.

A mudança afeta `open-next.config.ts`, `wrangler.jsonc`, o harness `scripts/validate-worker.ts` e o filtro do CI. Usa o adapter oficial, adiciona o binding `NEXT_CACHE_DO_QUEUE` e a migração aditiva da classe SQLite `DOQueueHandler`, que armazena coordenação do cache. Usa a autorreferência existente `WORKER_SELF_REFERENCE`. Uma revalidação por instância e duas tentativas extras reduzem concorrência/repetição; os limites do Worker e a janela dos dados permanecem aplicáveis.

SQLite Durable Objects estão [disponíveis no plano Free](https://developers.cloudflare.com/durable-objects/platform/pricing/). O recurso consome a franquia gratuita própria; excesso no Free causa falha, sem contratação automática de Paid. Esta alteração não aumenta o orçamento de CPU do Worker. O desempenho/1102 real continua exigindo painel ou API autenticados.

Callers: todas as rotas SSG/ISR e fetches revalidados pelo OpenNext. Preços, PromoScore, histórico, produtos, métricas e URLs de afiliação não mudam. Não há API pública de revalidação, segredo novo ou mudança no Supabase. A migração é do cache Cloudflare; não transfere o banco de produtos. Rollback usa o release anterior e mantém a classe de cache sem uso, evitando exclusão de recursos.

## Validação exigida

- Tipos, contratos de crescimento/coleta e build OpenNext do SHA candidato.
- Workerd com R2 e Durable Object **locais**, sem bindings remotos e sem service role no runtime. Verificar120s do Cache API e300s do ISR separadamente. O build contém o snapshot; após revalidação, o runtime sem chave deve gerar o estado vazio honesto. ExigirSTALE→HIT e conteúdo diferente.
- Publicar somente após os gates. Confirmar SHA/main, Workers Builds e build público. Disparar uma coleta nova para obter uma segunda geração de snapshot e verificar a atualização pública após o prazo, sem purge/redeploy intermediários.
- O controle do navegador continua bloqueado pela configuração do aplicativo, mesmo após a resposta de reativação; cliques desktop/mobile e leitura autenticada de versão/100%/logs permanecem pendentes. Não substituir por automação de navegador fora da ferramenta autorizada.

Estado inicial deste relatório: correção local, ainda sem homologação ou publicação. Resultados e limites serão registrados abaixo após execução.

## Primeira homologação, antes do ajuste das fotos

Candidato `82a2f2279da3e5ac088a05ea14a74009149028df`, PR #22. Crescimento `41382514791` aprovado. Build OpenNext e workerd `41382514238` aprovados: **37/37** contratos, incluindo ISR de 300s com STALE→HIT e conteúdo renovado. Recibo local em `reports/shop-release-2026-11-02/worker-isr-first/worker-ui-receipt.json`. Não é prova de CPU do Cloudflare nem de renovação pública.

A checagem HTTP de imagens identificou a rota legada Dufrio com 404, confirmada em oito amostras do feed. Correção adicional de qualidade documentada em [DUFRIO_IMAGE_HEALTH_2026-11-02.md](DUFRIO_IMAGE_HEALTH_2026-11-02.md), em commit separado. O SHA final combinado exige nova homologação antes de integrar/publicar; o recibo anterior é preservado.
