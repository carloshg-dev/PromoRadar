# Controle e divulgação da marca PromoDetec

## Contrato da automação

- O workflow `conteudo.yml` prepara diariamente, às 09:00 BRT previstas, até cinco produtos e dez rascunhos: um texto por produto para Telegram e WhatsApp. O GitHub pode atrasar o cron. A execução efetiva deve ser conferida pelo run e seu artifact `promodetec-marketing-drafts-<run_id>`.
- `npx tsx scripts/pipeline-conteudo.ts --dry-run` consulta somente a vitrine pública e escreve arquivos em `reports/marketing-drafts/`. Não cria campanhas, não renderiza, não altera status e não envia mensagens. Não exige service role nem token Telegram para essa etapa.
- A seleção usa uma amostra por chave de até 400 linhas, com prazo compartilhado de oito segundos; falha de consulta não vira catálogo vazio válido. Não é censo do catálogo ou garantia de menor preço no mercado.
- Preço de R$9 a R$100, imagem elegível, moeda comprovada, link reconhecido e observação nos últimos sete dias. O preço de referência é identificado como informação da loja. Não se inventa desconto, estoque ou urgência.
- Os textos apontam para o produto dentro de `promodetec.com.br`, com UTMs por canal nos rascunhos. A saída para a loja continua pelo redirect existente. UTMs não provam comissão aprovada ou atribuição financeira por canal.
- `drafts.json` inclui até três sugestões de hero, sem aplicar mudanças à página. O hero publicado não aprende automaticamente com cliques/vendas por causa deste workflow.

## Publicação e privacidade

O usuário escolheu divulgação pública em Telegram/WhatsApp, usando a marca. O workflow não recebe mais o webhook de divulgação pública do Discord; os relatórios privados de gestão seguem nos workflows próprios.

O envio automático ao Telegram só ocorre quando houver token e `TELEGRAM_FEED_CHAT_ID` configurados e a execução não for uma simulação. Antes de conectar um destino: confirmar o canal autorizado, a marca visível, as permissões do bot e as opções de assinatura/perfil dos administradores. Nenhum canal foi criado ou conectado nesta implementação.

No fluxo real, a curadoria busca alternativas para não repetir produtos nos últimos sete dias e cria até cinco campanhas. Campanhas antigas sem data de coleta ou fora do orçamento são recusadas pelo publisher antes do upload. Essa proteção usa a data capturada na campanha; não representa uma nova confirmação de preço na loja na hora do envio.

Para WhatsApp, os arquivos são preparados para publicação manual no canal da marca. Não há contratação de API, automação de sessão pessoal, envio a contatos ou busca de grupos. Identidade de marca não garante anonimato absoluto.

Referências oficiais: [Telegram Bot API e limites](https://core.telegram.org/bots/faq), [identidade dos canais](https://telegram.org/faq_channels?setln=pt-br), [assinaturas e perfis](https://core.telegram.org/method/channels.toggleSignatures), [privacidade de canais WhatsApp](https://faq.whatsapp.com/265055289421317).

## Rotina de gestão já existente

| Horário previsto em Brasília | Rotina | O que conferir |
|---|---|---|
| 06:00 | Coleta por rede | Linhas válidas/salvas, erros e última observação por loja |
| 08:00 | Relatório diário privado | Dia anterior, eventos, redirecionamentos e finanças disponíveis |
| Segunda 08:15 | Relatório semanal privado | Tendências, rankings e comissões por status |
| 09:00 | Rascunhos de achadinhos | Produtos, preço/data e arquivos por canal |
| 09:30 | Relatório de crescimento/saúde | Lojas sem renovação, cobertura e qualidade |
| 21:40 | Feed Shopee | Integridade dos lotes, volume e conclusão real |
| 05:20 / 11:20 / 17:20 / 23:20 | Cupons oficiais | Fonte disponível, validade e atualização pública |

Horários configurados não garantem chegada pontual nem sucesso. Cliques e eventos não são pessoas únicas; vendas pendentes não são receita recebida. A cobertura financeira integrada atualmente é Awin, sem presumir total das demais redes ou nome dos produtos vendidos.

## Diagnóstico de coleta

A falha Shopee `shopee_upsert_failed` passa a registrar somente código SQL/PostgREST validado e tamanho do lote. Payloads, URLs, chaves e contatos ficam fora do log. Isso melhora o diagnóstico; não declara a falha de persistência corrigida. Após erro parcial, o stale sweep continua proibido.

A consulta anterior da curadoria expirou com `57014`; a consulta limitada foi exercitada em prévia real somente leitura em 02/11/2026. Esse recibo não prova disponibilidade contínua nem CPU do Cloudflare. O processamento diário continua no GitHub Actions, sem coleta de feeds dentro do Worker.
