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
- Não há comprovação atual de receita, visitantes humanos ou eliminação sustentada dos estouros de CPU. Não inventar números, avaliações, depoimentos ou selos.

## Brand Commitments

Preservar o nome PromoDetec, o logo existente e o português brasileiro. Em 01/11/2026 o proprietário fixou um Shop escuro para Esquenta Black Friday/Black Friday, com densidade de marketplace, produtos baratos, categorias cotidianas, cupons oficiais e popups dispensáveis de produtos reais. Esta direção substitui a base clara anterior. O caminho é implementação direta, já com publicação autorizada; a inspeção do novo visual e o fechamento Impeccable continuam obrigatórios antes da entrega.

## Evidence on Hand

Produtos/imagens/lojas/datas vêm do catálogo existente. Logo em `public/logo.png`. Fontes locais/pacote Geist disponíveis. Regras e recibos em `docs/PROJECT_STATE.md`; os números operacionais não são prova de popularidade.

## Product Principles

- Ajudar a comparar antes de direcionar à loja.
- Fazer preço, loja e atualização fáceis de encontrar.
- Mostrar somente provas disponíveis e distinguir falha de ausência.
- Manter navegação acessível e leve no celular.

## Open Decisions

A automação de cupons e relatórios foi integrada à `main` pela PR #16, separada do Shop da PR #17. A aparência dark ainda aguarda capturas atuais e revisão final; DESIGN.md conserva o mundo claro e não documenta o candidato. Confirmar sempre o SHA/Builds e a versão que atende o domínio; uma integração Git ou teste local não comprova CPU de produção ou publicação visual.
