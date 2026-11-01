# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Pessoas no Brasil que procuram ofertas e comparam preços antes de comprar. A prioridade é encontrar um produto, conferir as condições e decidir em qual loja comprar; o proprietário pediu mais descoberta e movimentação no site.

## Product Purpose

O PromoDetec reúne preços públicos, compara ofertas entre lojas e mostra o histórico disponível. Não vende produtos: a compra acontece na loja de destino.

## Positioning

Preço atual, origem da oferta, data de coleta e histórico disponível aparecem junto da decisão. Comparações usam classes de produtos e preços reais; não prometer equivalência perfeita, preço em tempo real ou desconto garantido.

## Operating Context

Catálogo público em Next.js 14/React/TypeScript, servido no Cloudflare Workers/OpenNext. Supabase persiste o catálogo. Coletas e comparações pré-calculadas rodam no GitHub Actions. O Brasil é o foco da distribuição pública.

## Capabilities and Constraints

- Busca, categorias, lojas, comparador, detalhe/histórico, cupons, notícias e radar local de ofertas salvas.
- Links afiliados passam por `/r/{id}` e mantêm origem/atribuição; links internos não disparam prefetch de catálogo desnecessário.
- Preços das vitrines têm janela de sete dias. Data e disponibilidade precisam continuar visíveis; erros não equivalem a catálogo vazio.
- Medição depende do consentimento existente; não acrescentar rastreamento invasivo nem registrar contatos na busca.
- Preservar login, proteção de rotas, PromoScore, histórico e dados existentes. Manter processamento e quantidade de dados limitados.
- Há uma venda Awin com comissão pendente na janela observada; isso não comprova receita paga. Eventos e redirecionamentos não são pessoas únicas. A eliminação sustentada dos estouros de CPU ainda não foi comprovada. Não inventar números, avaliações, depoimentos ou selos.

## Brand Commitments

Preservar o nome PromoDetec, o logo existente e o português brasileiro. Em 01/11/2026 o proprietário fixou um Shop escuro para Esquenta Black Friday/Black Friday, com densidade de marketplace, produtos baratos, categorias cotidianas, cupons oficiais e popups dispensáveis de produtos reais. Esta direção substitui a base clara anterior. O caminho é implementação direta na prévia; após uma suspensão temporária, o proprietário autorizou explicitamente a integração na main, publicação e testes do domínio. A autorização não substitui os gates técnicos nem comprova implantação.

## Evidence on Hand

Produtos/imagens/lojas/datas vêm do catálogo existente. Logo em `public/logo.png`. Fontes locais/pacote Geist disponíveis. Regras e recibos em `docs/PROJECT_STATE.md`; os números operacionais não são prova de popularidade.

## Product Principles

- Ajudar a comparar antes de direcionar à loja.
- Fazer preço, loja e atualização fáceis de encontrar.
- Mostrar somente provas disponíveis e distinguir falha de ausência.
- Manter navegação acessível e leve no celular.

## Open Decisions

O proprietário reautorizou explicitamente publicar as alterações na main e testar o site como visitante. Integrar/publicar somente o candidato validado; registrar SHA, implantação ativa e evidência do domínio em docs/PROJECT_STATE.md. Manter a prévia local disponível durante o release.

A automação de cupons e relatórios foi integrada à `main` pela PR #16. As PRs #19/#20/#21 publicaram a proteção da home e correções de ingestão/atribuição/sitemap. A suspensão temporária da PR #17 foi revogada por nova autorização explícita. O navegador foi restabelecido: a prévia Chromium foi conferida em larguras emuladas 320/390/820/1440/1680, com rolagem, fotos carregadas, carrossel e modal. Não são dispositivos físicos. A revisão Impeccable pediu quatro ajustes; o verdict posterior foi `ship`, com os quatro `resolved`, limitado àquela lista e sem certificação de backend/produção. A direção é fixa e aprovada; o recibo independente da seed histórica não foi preservado. Os tokens efetivos estão em src/app/globals.css e a direção na surface brief. DESIGN.md e sua sidecar documentam o artefato escuro, preservando os outros calendários existentes. Não tratar teste local, aprovação humana ou revisão visual como prova de publicação/CPU de produção. O release inclui Awin, Lomadee, recuperação de vitrines e apresentação dos relatórios; execução/publicação e seus limites devem ser conferidos em docs/PROJECT_STATE.md.
