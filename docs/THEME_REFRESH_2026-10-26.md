# PromoDetec: modernização da interface, 26/10/2026

## Escopo e impacto

O usuário pediu avançar a manutenção e modernizar a temática, escolhendo explicitamente implementar e mostrar uma prévia funcionando. A entrega visual parte do ramo de produção `codex/cloudflare-migration` em `2878a44`, no ramo isolado `codex/theme-refresh`. Publicação do novo visual depende da revisão dessa prévia.

A identidade global afeta navbar, rodapé, busca, vitrines, ofertas, comparador, detalhe, formulários e textos institucionais. Os consumidores do tema escuro receberam cores semânticas legíveis no fundo claro. Não foram alteradas tabelas, políticas, PromoScore, funções de histórico, coleta, autenticação, consentimento ou redirect `/r/{id}`. O aside de autenticação deixou de consultar contagens decorativas do catálogo; as operações de login permanecem iguais.

## Interface implementada

- Fundo claro, tinta verde, fonte Geist do pacote existente e preços tabulares; sem downloads de fontes Google durante o build.
- Busca principal, um produto real com origem/preço/data e caminhos por categoria na home. Conteúdo recente, cupons, comparador e radar seguem acessíveis.
- Vitrines limitadas a quatro/oito itens por seção, renderizadas no servidor; componentes antigos de carrossel deixaram a composição da home. As leituras limitadas e o cache existentes são reutilizados, sem consultas adicionais para montar a nova composição.
- Cards exibem preço, loja, atualização e histórico disponível, sem inventar equivalência de modelos. Links internos mantêm `prefetch={false}`; afiliados conservam origem e `rel`.
- Navegação desktop desde 1024 px, menu móvel, foco visível e redução de movimento. Ícone existente de 192 px substitui o logo grande no cabeçalho.
- Origem embutida, sem alteração dos pixels, nos PNG locais referenciados de cabeçalho, ícones e compartilhamento. Imagens de produtos continuam remotas e identificadas por `Produto.imagemUrl`; logos de lojas vêm das fontes existentes do catálogo/CDN e favicons. Não houve geração de fotos ou mockups.

O calendário sazonal não mudou. Sua presença na home ficou discreta; ativos históricos foram preservados. Esta mudança não faz afirmações de tráfego, receita ou economia de CPU.

## Validação realizada

- TypeScript da aplicação e scripts de comparação aprovados; 89 testes existentes aprovados antes do lote final de acabamento estritamente visual.
- Build Next de produção aprovado após a correção da interface. JS inicial informado pelo build: home 122 kB, ofertas 112 kB, comparador 111 kB, produto 214 kB, login 171 kB. Não há medição anterior controlada para alegar redução percentual.
- Servidor Next de produção em loopback, porta 3218. Guard local limita o `fetch` do servidor a GET/HEAD; configuração carregada em memória, sem secrets em arquivos de evidência. Analytics já ignora loopback. O servidor é mantido como a prévia solicitada, não como serviço de produção.
- QA da home em 1440×900, 390×844 e viewport real 1280×720; ofertas, comparador, produto e login em desktop/celular. Não foi observado overflow horizontal nessas rotas. Imagens da home aquecidas por rolagem antes da captura completa.
- Busca digitada e enviada pela home chegou a `/ofertas?busca=fone`, com 60 resultados renderizados. Menu móvel abriu/fechou. Salvar oferta marcou o controle, exibiu o produto no radar da home e remover restaurou o estado vazio; persistência apenas no navegador de loopback.
- Console do trecho verificado sem warnings/erros. Produto de um ponto de histórico mostrou estado sem variação, sem curva artificial. Não foram seguidos links de compra nem enviados login/OAuth reais.
- Detector Impeccable executado uma vez sobre os alvos alterados: lista de findings vazia. Dois PNG incluídos indevidamente na lista de arquivos foram recusados pelo scanner, que não é validador de imagens. A revisão visual independente recebe esse limite e a matriz completa de capturas.

## Revisão independente e correções

A primeira revisão recebeu 15 capturas e emitiu `fix` com quatro itens materiais. O lote de correções compacta filtros de ofertas em um controle expansível no celular, mantém seleção/busca/loja nos links, substitui emojis do detalhe por Lucide, escurece alertas e nomes de lojas para leitura e associa rótulos persistentes aos campos de autenticação. Mensagens do formulário passaram a usar `status`/`alert`; o fluxo de autenticação não mudou.

Após build e recaptura nos mesmos viewports, o mesmo revisor marcou **os quatro itens como resolvidos**, com disposição `ship` restrita a essa lista. Não é certificação de todas as rotas ou de produção. O teste móvel encontrou o primeiro resultado a 420 px do topo e confirmou expansão, seleção e preservação da busca. Alertas condicionais não presentes no produto capturado foram verificados no fonte: cor semântica com contraste calculado de 5,19:1. Rótulos de login/cadastro/recuperação foram confirmados no DOM; mensagens assíncronas não foram provocadas com autenticação real.

Capturas e auxiliares ficam em `.impeccable/review/` e `.impeccable/lab/`, ignorados pelo Git. O contrato de direção e a documentação do sistema permanecem versionáveis. Não foram criados testes que apenas repetem classes CSS.

## Manutenção operacional avançada

PRs [#5](https://github.com/carloshg-dev/PromoRadar/pull/5) e [#6](https://github.com/carloshg-dev/PromoRadar/pull/6) integradas separadamente em produção e `main`. A execução [40260038272](https://github.com/carloshg-dev/PromoRadar/actions/runs/40260038272) gerou e publicou snapshots no Storage e simulou retenção com sucesso:

| Recibo | Resultado |
| --- | --- |
| Versão | `714e2b3b-96e7-4d2c-8b10-0de4eb06a9db` |
| Geração | 25/10 às 23:38:16 BRT |
| Catálogo / comparações / escopos | 38.159 / 211 / 45 |
| Lote máximo / lojas por grupo | 250 / 3 |
| Retenção | sete dias; dry-run, quatro versões, três legadas |
| Candidatos / exclusões | zero / zero |

A execução manual confirma a integração, não a continuidade de agendamento. O job [40259294608](https://github.com/carloshg-dev/PromoRadar/actions/runs/40259294608) passou build OpenNext e empacotamento, mas pulou a publicação. A conexão atual do Cloudflare não expõe a conta alvo; por isso não se atribui a esse resultado uma versão nova servindo tráfego.

## Limites e publicação

A aparência nova está em prévia; nenhuma alteração visual foi publicada. Falta gate Cloudflare/workerd específico deste candidato antes de um deploy, além da revisão humana da prévia. Login real, atribuição comercial e tráfego humano não foram medidos nesta etapa. A observação comparável de CPU permanece separada. Recuperação/migração do Supabase e unificação completa da aplicação em `main` continuam fora deste escopo.
