# Shop PromoDetec — candidato de 01/11/2026

O proprietário fixou Black Friday escura, descoberta de produtos baratos, densidade de marketplace e cupons reais. Autorizou publicar a entrega. O candidato está na [PR #17](https://github.com/carloshg-dev/PromoRadar/pull/17), em rascunho: **não foi integrado ou publicado**. Os relatórios e a coleta de cupons são outro lote, já integrado na PR #16.

## Impacto e comportamento

- Tokens de cor de Esquenta Black/Black Friday tornam a aplicação grafite, com ações laranja, cupons amarelos e fotografias brancas. Calendário e campanhas seguintes permanecem automáticos. Navbar, componentes de catálogo, ofertas, cupons e rodapé usam as mesmas superfícies; logo, missão literal e aviso de afiliação são preservados.
- Home lê três pools existentes e um snapshot pequeno de cupons. Mostra até 48 produtos reais, seis colunas no desktop/duas no celular; primeiros achados até R$50 e restante até R$300. A seleção não transforma cliques em popularidade comprovada ou em desconto. A disponibilidade e o preço final continuam sendo da loja.
- Coleções doces/snacks, casa e trabalho filtram títulos do catálogo. A coleta Shopee reserva uma seleção pequena dessas utilidades em uma segunda passagem sobre o spool SQLite, sem carregar o CSV inteiro. Não cria produtos/categorias nem garante que determinado doce esteja no feed. Piso da coleta continua R$9.
- Um único dialog compartilhado oferece consulta rápida por ação explícita, usando dados já renderizados e sem nova consulta remota. Sugestão pequena aparece no máximo uma vez por sessão após rolagem e decisão de consentimento; pode ser dispensada. Não há alertas falsos de compras ou contagem fictícia.
- Leitor público de cupons usa o snapshot privado pré-coletado. Página oferece loja/código/condições; futuras/expiradas ou consulta antiga são excluídas. Nenhuma central é consultada por visitante. Esse leitor é parte do candidato, não está na página de produção ainda.
- Inclui o pacote de catálogo da PR #13: moeda BRL verificada, quarentena AliExpress sem conversão comprovada, filtro de imagens genéricas e teto padrão R$1.000. Quando a contagem paginada retorna 57014, faz uma única tentativa sem COUNT, com 61 linhas para decidir a próxima página. O total é exibido como desconhecido, nunca inventado. Outras falhas continuam sendo falhas.

## Validação efetivamente executada

- Aplicação e runners tipados; 107 testes de crescimento. Teste novo de ingestão executa o script real com CSV fictício: seleção cotidiana preservada além do Top-N, sem duplicação e zero upserts. CI de coleta e ensaio de memória aprovado.
- Next/OpenNext Linux compilou. Nove contratos HTTP locais passaram com dados reais somente para leitura: home, ofertas, limites, categoria, busca, quarentena de moeda e redirect seguro. Amostra da home teve 48 cards; a ordem/pool variam e não representam os mais vendidos.
- CI limpo [41286099613](https://github.com/carloshg-dev/PromoRadar/actions/runs/41286099613), aplicação `5810d547f88843902aebbabe7f8a4c3d3bd2b9d0`: build `0F59WF4qMP3CTLyDJrrg-`, **35/35** contratos workerd, rajadas locais/expiração, Wrangler 4.151.2 e compatibilidade `2026-08-23`. Zero sinal de erro no laboratório não mede CPU faturada nem elimina 1102 em produção.
- Supabase local fictício com GoTrue/PostgREST/Postgres reais: **17/17**, incluindo persistência dos 14 tipos de evento, consentimento, atomicidade, sessões, bloqueio de promoção de privilégio e rankings/nomes do relatório. API somente loopback; proxy HTTP local substituiu o Kong por falha de DNS do daemon isolado. Sem browser e sem escrita remota; políticas locais não provam paridade de RLS de produção.
- Detector Impeccable executado uma vez: 26 avisos advisory de tipografia, paleta e raios diferentes do DESIGN.md claro anterior. Não foram usados para certificar a aparência. Nenhum raster novo foi produzido; fotos vêm do catálogo e o logo é o existente.

## Gate visual ainda aberto

O controle do navegador retorna uso local desativado, apesar das reativações informadas pelo usuário. Não foi contornado por outro navegador, CDP, Playwright de terminal ou render sintético. Cliques, console, carregamento visual de imagens, foco do dialog, consentimento, filtros e overflow ainda precisam ser conferidos nesse novo mundo.

A revisão independente Impeccable retornou **`recapture`**: as capturas antigas desktop/mobile mostram a versão clara; tablet 820, mínimo 320 e usuário 1680 não têm evidência válida do candidato. Capturar o Shop atual desde o topo em 1440/820/390/320/1680 e repetir a revisão completa. Capturas antigas não viraram prova do dark.

Após a revisão/fixes, o documenter deve atualizar DESIGN.md e `.impeccable/design.json` a partir do resultado renderizado. Essa etapa não foi declarada concluída a partir de intenções. O gate é o da [skill de validação](../skills/change-validation/SKILL.md): “UI: build mais servidor real, console e inspeção desktop/mobile.” A autorização para publicar já existe; falta a capacidade de realizar essa conferência.

## Operação e limites

Relatórios diário/semanal foram aceitos pelo Discord e os agendamentos estão ativos. Coleta Awin publicou 67 campanhas/22 códigos; Lomadee retornou HTTP 500. Financeiro cobre Awin BRL, separado por status; nomes dos produtos vendidos não foram fornecidos na janela. Dados agregados e recibos em `docs/evidence/shop-operations-2026-11-01.json` e detalhes em `docs/COUPONS_REPORTS_2026-11-01.md`.

Rascunho Google Ads em `reports/google-ads-draft/preview.html`, `campaign.json` e `ads.csv`: três grupos, destinos reais com UTM, palavras/negativas, anúncios pausados e simulação aritmética de orçamento. Não foi enviado ao Google, não prevê vendas e não gera cobrança. Algumas páginas de destino usam filtros do candidato; conferir novamente após publicação antes de qualquer ativação.

Não houve contratação, nova DDL remota, alteração de DNS/WAF, teste de carga público ou mudança de preços para promover ofertas. CPU e falsos positivos recentes do Cloudflare continuam sem nova leitura autenticada. A entrega visual permanece pendente; as automações já publicadas têm escopo separado.
