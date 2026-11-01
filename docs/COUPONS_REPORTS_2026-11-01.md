# Cupons, operação no Discord e rascunho Ads — 01/11/2026

O proprietário pediu publicação, cupons automáticos das suas redes, relatórios diários/semanais no Discord e uma simulação Google Ads. Não autorizou gasto; nenhuma campanha paga foi criada.

## Cupons reais fora do Worker

`scripts/sync-coupons.ts` consulta as APIs oficiais Awin e Lomadee com paginação e corpos limitados. Awin exige participação ativa, região BR, URL de tracking do publisher e código quando o item é voucher. Condições, início, fim e horário de consulta acompanham a campanha. Promoção sem código não se transforma em cupom por inferência.

O conjunto validado tem até 200 itens/512 KiB e é publicado em `catalog-comparisons/coupons/v1/current.json`, no Storage privado existente. A UI futura consome esse pequeno objeto com cache; nenhuma consulta às centrais ocorre por visitante. Campanhas expiradas/futuras ou sem consulta há mais de 12 horas não são exibidas. Cupons curados antigos sem validade comprovada não são anunciados automaticamente como ativos.

O teste real de leitura retornou 68 campanhas Awin, 67 elegíveis após data/deduplicação, 22 com código. O bootstrap publicou 32.654 bytes às 07:29:46 UTC (04:29 Brasília). A Lomadee retornou HTTP 500; o recibo ficou parcial e a saída do processo foi não zero mesmo com os dados Awin publicados. Isso não prova saúde da Lomadee. Não houve criação/reativação de programa ou chave; a chave Awin existente foi configurada no repositório autorizado para a rotina.

Workflow `coupon-sync.yml`: 05:20, 11:20, 17:20 e 23:20 Brasília. Só se torna agendado quando integrado à branch padrão; o primeiro run manual e a execução real pelo cron devem ser registrados separadamente. `--publish` é explícito no disparo manual; sem ele só há leitura/recibo.

## Relatórios de operação

`daily-business-report.ts` agrega os eventos consentidos existentes, cadastros e saídas para lojas por páginas de 500, sem carregar a série inteira. Ranking e volume têm tetos e sinalizam incompletude. Nomes de produtos vêm de uma leitura de no máximo 20 IDs. Nenhum IP, contato, sessão, referência de pedido ou trajetória individual é enviado ao Discord.

A API Awin de transações fornece vendas e comissões separadas por pending/approved/declined/deleted. Moedas não são somadas entre si; comissão pendente não é saldo pago. Quando o anunciante não fornece produtos da cesta, o relatório declara indisponibilidade dos nomes vendidos. Cliques jamais viram vendas por estimativa.

Teste real somente leitura, janela 25–31/10 em Brasília: 177 ações consentidas, 122 redirecionamentos, uma venda pendente de R$142,49 e comissão pendente de R$3,28 na Awin. Shopee e Amazon lideraram os cliques da amostra, mas não há nova integração de vendas/comissões dessas redes; a cobertura parcial aparece no relatório. Esses números são históricos da janela, não visitantes únicos nem efeito do novo visual.

Workflow `business-report.yml`: diário 08:00 Brasília (dia anterior completo); semanal segunda-feira 08:15 (sete dias completos). Envia somente com `--send`, no webhook de relatórios ou, se ausente, no canal PromoDetec já configurado. Menções Discord são desativadas. Leitura, envio manual e execução por schedule são provas diferentes. Nenhum cron garante execução em segundo exato.

## Google Ads

`build-ads-draft.ts` gera três grupos, anúncios com títulos de até 30 caracteres e descrições de até 90, palavras-chave/negativas, JSON, CSV pausado e prévia HTML interativa. Links usam destinos reais e UTM. A simulação de orçamento é aritmética declarada, sem previsão de CPC/conversão/lucro. Orçamento ativo R$0; nenhum anúncio foi submetido. Revisão das políticas das redes e uma autorização financeira concreta seriam necessárias antes de ativar gasto.

## Validação e limites

Seis testes novos cobrem vínculo/região/tracking de cupons, expiração, deduplicação, limite de corpo, separação financeira e dias completos em Brasília. Foram exercitadas as consultas reais e a geração do draft. O relatório semanal inicial foi gerado sem envio. O projeto Supabase alvo não aparece no conector de Management; usam-se as credenciais de servidor já existentes sem recuperar conta ou ampliar RLS. API Cloudflare conectada é de outra conta e não foi usada para alterações.

Este lote não publica a reformulação visual nem conclui a falha intermitente do catálogo da PR #13. A interface permanece em outro ramo até a homologação visual. Evidências detalhadas ficam locais em `reports/` sem credenciais. A publicação deste lote e os runs manuais devem ser confirmados na PR e no estado operacional.
