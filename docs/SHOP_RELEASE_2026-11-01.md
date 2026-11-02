# Shop publicado na main — 01/11/2026

O proprietário reautorizou explicitamente integrar, publicar e testar o site. A [PR #17](https://github.com/carloshg-dev/PromoRadar/pull/17) foi integrada à **main `5a7b12db25ed8a2a00ef1f4d1e5f19df841f54d8`**, às **17:11:24 BRT**. Código candidato: `73bbdad4dfb9a98b8b5654333eae47893fe19ba8`. A árvore funcional de `src`, scripts, testes, pacotes e workflows foi comparada com a main integrada e coincide.

## Publicação observada

- Workers Builds **`0f5d9f98-7d25-4a52-b806-6f1691804c5d`**, recurso `promodetec`, conta do domínio `0fcbdab34f0d44e0e948a4bb2f051810`: check `success`, concluído às **17:13:35 BRT**. O conector Cloudflare disponível no início apontava a outra conta e não foi usado para modificar o projeto.
- Domínio público respondeu com buildId **`0ajAsfCiO_aJKLpkClBAW`**, Shop escuro, ações #FF7A00 e 14 parceiras. Home: **48 produtos**, maior preço **R$259,99**, fonte `ready`; respostas quentes `HIT`. A primeira sondagem enquanto o deploy estava em curso ainda viu o build anterior/fonte parcial; foi mantida separada do resultado novo.
- O painel autenticado confirmou a conta, domínio e versão anterior `aee1cf9c`/100% antes do release. O controle do navegador foi desativado antes da releitura pós-release. **Versão interna atual, porcentagem de tráfego, bindings atuais e CPU do painel não foram relidos.** O buildId e os contratos HTTP comprovam a resposta do novo código nas requisições observadas, sem inventar leitura do painel.
- Sem contratação, DDL, DNS/WAF, rotação de segredo, campanha paga, adesão de anunciante ou teste de carga público. O domínio já estava hospedado; este release substituiu a aplicação pelo fluxo Git/Workers Builds existente.

## Gate do candidato final

| Verificação | Resultado |
|---|---|
| Tipos aplicação/comparações/runners | Aprovados em `41344997609` |
| Crescimento/coleta/memória | **130/130**, **36/36**, ensaio de memória aprovado |
| Atribuição Lomadee somente leitura | 133 marcas, 105 elegíveis, 105 correspondências do tipo legado resolvidas; sem mint/escrita |
| Next/OpenNext/workerd `41345004352` | **35/35** contratos; rajadas quentes de 512 respostas sem falha; expiração/recuperação local |
| Pacote | **1.581,41 KiB gzip**, abaixo do gate de 3.072 KiB do projeto |
| Runtime do laboratório | Wrangler 4.151.2, compatibilidade solicitada/efetiva `2026-08-23`, build `eRy7FBCrTPBlTklMqyCdX` |

Um preflight anterior `41344210067` recusou o candidato `7f61e38`: a nova interpretação da configuração Lomadee era incompatível com o ID de tipo legado. A correção resolveu o tipo para uma única instância Comparador autenticada e passou a conferir a instância retornada. Ambiguidade, tipo errado e divergência continuam recusados. A falha foi preservada e corrigida **antes do merge**, sem mudar secrets. Evidência negativa: `docs/evidence/lomadee-release-preflight-initial-2026-11-01.json`.

## Contratos públicos do release

**15/15 verificações técnicas** passaram na leitura de **17:16:33 BRT**:

- Home e CSS laranja; detalhe de produto e histórico disponível no HTML.
- Shopee até R$50: 60 cards, máximo R$49,99; pesquisa “fone” até R$100: 60, máximo R$99,90.
- Ofertas até R$20: 60 cards, máximo R$20; Carrefour sem catálogo recente: 24 alternativas de outras lojas identificadas, máximo R$28,99.
- Comparador `ready`, cupons presentes, página de entrada acessível, admin redirecionando ao login.
- Robots, sitemap válido com 754 URLs, TLS no apex e `www`, canonical para o apex.
- HEAD de `/r/{id}` retorna **204**, conforme contrato, sem contabilizar clique nem navegar na rede afiliada. Não foi feito GET humano dessa saída.

O primeiro auxiliar de smoke tinha quatro expectativas incorretas: esperava redirect no HEAD em vez de204; procurava texto “Copiar” em botões cujo rótulo visível é o código; exigia senha no HTML antes da hidratação do login; exigia redirect em `www`, que serve200 com canonical correto. As fontes e respostas foram inspecionadas antes de corrigir o auxiliar. Nenhum comportamento da aplicação foi alterado para obter verde. O recibo inicial com essas falhas do auxiliar foi preservado junto do recibo corrigido.

Esses contratos não executam JavaScript nem comprovam imagem decodificada, foco, clipboard, login/OAuth, navegação mobile real, compras ou CPU faturada. As medições em milissegundos são latência HTTP. O QA interativo **local anterior** em320/390/820/1440/1680 emulados e o verdict Impeccable dos quatro ajustes são evidências distintas, não foram renomeados como testes em produção.

## Cupons e relatórios

- Workflow da main **`41345650381`** concluiu e publicou o snapshot privado: **200 campanhas/47 códigos**, 68 campanhas Awin e seleção de160 Lomadee antes da deduplicação/teto combinado. Ambas as fontes `ok`, sete páginas de marcas/17 de campanhas. Leitura independente do objeto confirmou o mesmo `generatedAt`, 74.936 bytes e as contagens; nenhum bucket foi tornado público.
- A página pública permaneceu com **67 campanhas/22 códigos**, snapshot de **15:10:36 UTC**, até a leitura de **20:22:52 UTC**, embora o Storage já tivesse o snapshot de20:12:51. O job já estava confirmado completo às20:15, portanto a página não renovou dentro da janela de300s observada depois dessa confirmação. **Pendência real de atualização**, sem atribuir causa a CPU, credenciais ou fila sem logs. A home também apresentou `x-nextjs-cache=STALE` em leituras separadas às20:19:58 e20:22:52, conservando48 cards/fonte pronta; recuperação da revalidação não foi observada. Não foi feito purge, novo deploy ou mudança de cache para esconder o comportamento.
- Runner de relatório da main **`41345982056`** concluiu com sucesso **sem envio**: mantém dados agregados do dia completo anterior e gera Markdown, payload Discord, CSV e JSON com unidades. O cron existente passa a usar o formato novo. Um artefato gerado não é prova da aparência no cliente Discord ou do recebimento de uma nova mensagem.

## Pendências de validação

O controle do navegador informou estar desativado durante o acompanhamento. Foi solicitada reativação com caminho exato de configurações; não houve contorno via outro navegador/CDP. Faltam **cliques e capturas do site já publicado**, a confirmação autenticada da versão/100% e os logs da revalidação no painel. A solicitação de teste como usuário permanece parcialmente pendente até esse controle voltar. O teste de renovação de cupons não passou: **não declarar “tudo certo” com base nos15 contratos básicos**, que não cobriam essa atualização.

CPU/1102 e falsos positivos não têm janela nova comparável. Nenhum resultado local ou cache HIT sustenta afirmar que os estouros foram eliminados. As automações de produtos seguirão seus schedules; não foi disparada uma coleta completa de produtos neste release.

Evidência agregada: `docs/evidence/shop-published-2026-11-01.json`. Evidências locais adicionais: `reports/shop-release-2026-11-01/worker-final/worker-ui-receipt.json`, `lomadee-preflight/lomadee-attribution-preflight.json`, `coupons-published/coupon-sync.json`, `coupon-storage-readonly.json`, `report-dry-run/`, `public-smoke-1793564143364.json`, `public-smoke-1793564193616.json` e `cache-followup-1793564572842.json`. Recibos contêm dados agregados, sem secrets, IPs, contatos ou URLs privadas. Relatório/evidência preparados após o release; o código funcional e seus relatórios de preflight foram integrados na PR17.
