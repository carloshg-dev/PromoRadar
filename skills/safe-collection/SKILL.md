---
name: promodetec-safe-collection
description: Use em coleta, scraper, feed, CSV, Shopee, Awin, upsert, stale sweep, cron ou processamento de grande volume. Garante streaming com memória limitada, falha segura e preservação dos produtos válidos.
---

# Coleta segura do PromoDetec

## Antes de alterar

1. Leia `CLAUDE.md`, `MISTAKES.md` e `docs/ARCHITECTURE.md`.
2. Mapeie workflow, script, adapters, serviço, repositório, tabelas e métricas afetadas.
3. Registre schema esperado, unidade dos preços, identificador estável e regras de categoria.
4. Use fixture pequena e dry-run antes de acessar o feed completo.

## Memória e streaming

- Leia rede e disco por stream; nunca use `arrayBuffer()`, `readFile()` ou `split()` sobre o feed inteiro.
- Parseie registros incrementalmente e aplique backpressure.
- Mantenha somente Top-N limitado por categoria durante a leitura; não acumule todos os candidatos em `Map` ou array.
- Faça upsert em lotes limitados, com concorrência explícita e métricas de memória.
- Limpe temporários e streams em sucesso, erro, timeout e cancelamento.

## Validação de item

- Rejeite item sem id, título, URL afiliada válida, imagem, preço positivo ou categoria compatível.
- Normalize moeda e unidade antes do PromoScore; não invente preço anterior.
- Preserve SKUs manuais e origem/tracking existentes.
- Sanitize logs: sem secrets, URLs assinadas, dados pessoais ou payloads completos.

## Falha segura

Erros de download, parse, classificação ou qualquer lote de upsert tornam a execução incompleta.

1. Marque a execução como falha e retenha contagens por etapa.
2. Não execute stale sweep após erro parcial.
3. Não execute stale sweep quando o volume cair fora do intervalo esperado.
4. Só desative ausentes depois de uma ingestão integral, validada e identificada pelo mesmo `run_id`.
5. Termine com código diferente de zero quando a integridade não puder ser provada.

## Automação

- GitHub Actions recebe secrets por nome e usa timeout/concurrency para evitar corridas.
- Cron deve registrar branch, SHA, `run_id`, fonte, quantidade lida, válida, persistida e rejeitada.
- O sucesso do scheduler não prova persistência; consulte banco/logs antes de declarar coleta concluída.

## Validação

1. Teste fixture válida, registro inválido, lote com falha e queda anormal de volume.
2. Prove que uma falha parcial não desativa produtos existentes.
3. Meça pico de memória com volume representativo.
4. Confirme idempotência do upsert e ausência de duplicatas.
5. Execute feed real somente com aprovação humana e rollback definido.
