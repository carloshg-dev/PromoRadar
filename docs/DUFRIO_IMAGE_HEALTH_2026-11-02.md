# Fotos Dufrio — 02/11/2026

## Evidência

Home pública, build `0ajAsfCiO_aJKLpkClBAW`: 24 imagens distintas amostradas por GET limitado. Vinte retornaram arquivo de imagem e quatro retornaram 404/HTML; todas as falhas vieram de `www.dufrio.com.br/media/catalog/product/`. A amostra verifica HTTP/MIME/assinatura, sem alegar inspeção visual ou decodificação no navegador. Recibo: `reports/shop-release-2026-11-02/images-1793589827598.json`.

Leitura de oito linhas do feed oficial Dufrio/Awin, encerrada por streaming: oito fotos do lojista com 404; oito URLs alternativas do proxy Awin redirecionando para placeholder. Recibo agregado: `reports/shop-release-2026-11-02/dufrio-source-probe.json`. Sem upsert, retirada de produtos ou clique afiliado. O primeiro auxiliar de leitura deixou o stream de origem aberto ao terminar antecipadamente e encerrou com timeout; foi corrigido e a leitura repetida com encerramento limpo. Não foi tratado como falha da API.

## Correção e impacto

A política existente de qualidade rejeita também essa rota legada, nos hosts exatos Dufrio com/sem `www`. O filtro é aplicado antes da contagem/paginação e reutilizado na home, recomendações, conteúdo e ingestão Awin. O mapper público converte a foto rejeitada em ausente; detalhe e metadata usam seus estados já existentes. O banco preserva o registro original, preços, datas, URLs e histórico. Uma eventual foto válida em outra rota da Dufrio pode ser aceita normalmente.

Essa medida evita colocar fotos conhecidamente defeituosas na vitrine. Não repara o CDN do anunciante nem comprova que todas as imagens da loja falham. A recuperação de loja sem produtos elegíveis continua mostrando alternativas de outras lojas com atribuição clara, sem anunciar essas alternativas como produtos Dufrio. A volta dessa rota deve exigir novas amostras reais de imagens válidas; não usar o placeholder Awin como foto do produto.

Escopo: `catalog-policy.ts`, mapper `produto-row.ts` e testes de domínio/paginação/adapter. Sem mudança de layout, autenticação, preços, tracking, banco ou coletas completas. Validação/publicação serão registradas junto do release de revalidação em `ISR_REVALIDATION_2026-11-02.md`.
