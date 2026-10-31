# Campanhas do fim de 2026 — propostas e calendário local

Estado em 31/10: o proprietário escolheu explicitamente **A — Black em evidência** e manteve a pré-aprovação das fases posteriores. A implementação está em `codex/black-evidencia`; publicação e recibo do domínio são gates separados. Não afirmar ativação pública a partir desta escolha.

## Propostas

- **A — Black em evidência:** campanha em tinta, lime e grade de produtos.
- **B — Achados para o seu bolso:** amarelo sazonal, vitrine clara e controle por orçamento.
- **C — Radar Select:** papel verde, contexto de comparação lateral e grade mais sóbria.

As três prévias preservam literalmente a frase aprovada abaixo de “Encontre seu próximo bom negócio.” e o aviso legal do rodapé. A amostra contém oito produtos reais do DOM público consultado em 30/10; coleta original dos itens em 27/10. Valores não são promessa para as campanhas futuras. Fotos foram copiadas sem edição, com origem registrada em sidecars locais; não há geração de fotos, descontos, avaliações ou vendas.

Direção de composição Impeccable: superfície comercial dentro da marca existente, seed `4412e623`, posições 3/6/4, escolhida A (posição 3). Fluxo registrado `code`; as próximas campanhas adaptam a mesma composição com paletas em CSS, sem novas rodadas de propostas. Contrato definitivo da superfície em `.impeccable/surfaces/src-app-page-tsx.md`.

Comparação local: `http://127.0.0.1:3220/`. Seleção Impeccable: `http://127.0.0.1:57657/`, chave local `a6aa7e55`. Artefatos regeneráveis em `reports/seasonal-preview-2026-10-30/`; o servidor local serve somente HTML/CSS/JS/fonts/imagens explicitamente permitidos, sem ambiente, scripts de preparação ou dados privados.

## Calendário preparado

Fonte única: `src/lib/seasonal.ts`. Datas inclusivas, calculadas em `America/Sao_Paulo`:

| Fase | Início | Último dia |
|---|---|---|
| Esquenta Black Friday | 30/10/2026, disponível após publicação | 26/11/2026 |
| Black Friday e fim de semana | 27/11/2026 | 29/11/2026 |
| Cyber Monday | 30/11/2026 | 30/11/2026 |
| Esquenta Natal | 01/12/2026 | 13/12/2026 |
| Natal | 14/12/2026 | 25/12/2026 |
| Neutro | 26/12/2026 | fora de campanha |

Datas de Black Friday e Cyber Monday conferidas no [calendário BlackFriday.com.br](https://blackfriday.com.br/blog/calendario-da-black-friday-2026-datas-cyber-monday-e-como-se-preparar.html). As janelas de esquenta e início do Natal são decisões de campanha propostas para este site, não datas oficiais. O calendário é explícito para 2026 e não deixa Natal ativo até 31/12 nem repete datas vencidas em 2027. Forçar tema continua restrito à configuração de prévia existente.

## Impacto e integração pendente

O seletor é consumido pela home e por dois componentes legados (`seasonal-home-hero` e `featured-deal-rotator`). A alteração atual acrescenta estados e janelas; preserva o contrato visual existente. A pele global, a seleção dinâmica dos produtos e os demais ajustes de curadoria ainda não foram incorporados ao Next. Não altera consultas, PromoScore, histórico, atribuição afiliada, consentimento, banco, WAF ou cobrança.

Depois da escolha, adaptar a direção ao layout compartilhado e às páginas de catálogo, categoria, comparação e produto; reutilizar pools existentes para diversidade de lojas e deduplicação, sem aumentar consultas por componente. Garantir atualização do tema nas fronteiras apesar de ISR/cache e de abas abertas; conferir force-preview ausente em produção. Os dados do calendário sozinhos não entregam essa pele global.

A troca deve pertencer à aplicação publicada, sem depender do computador do proprietário nem de um novo deploy em cada data. Não foi criada uma automação de chat para simular esse mecanismo. Revisão de acabamento, documentação do visual definitivo, build completo, CI e verificação do domínio pertencem à implementação escolhida.

## Verificação desta etapa

Atualização de implementação em 31/10: build Next com configuração existente/guarda GET/HEAD aprovado; tipagem e **74 testes** aprovados. Removidas as duas leituras dedicadas ao antigo destaque; curadoria e deduplicação reaproveitam os pools existentes. A troca pré-pintura e o provider sincronizam cores e copy mesmo com HTML em cache; abas visíveis verificam a data a cada minuto e ao retornar ao primeiro plano. O calendário não depende de agendamento no computador.

O WSL local retornou `CreateVm/ERROR_TIMEOUT`; não houve reinício da VM ou dos serviços compartilhados. O workflow existente `Deploy Cloudflare Worker`, com `deploy=false`, ganhou homologação em workerd isolado e exportação de recibo vinculado ao buildId. Gatilhos de publicação e credenciais existentes não foram alterados; o subprocesso de teste recebe apenas variáveis públicas. A execução real desse gate ainda é registrada no release, não presumida aqui.

Registro histórico da rodada de propostas, anterior à escolha:

- `npm run typecheck`: aprovado.
- Testes focados do calendário: **2/2**, incluindo todas as viradas à meia-noite de Brasília, fim das campanhas, ano seguinte, ausência de sobreposição e override de prévia.
- Prévias em 1440, 768, 390 e 320 px: **12 combinações**, sem overflow horizontal ou imagens quebradas observado. Screenshots desktop/mobile e recibos em `reports/seasonal-preview-2026-10-30/qa.json`.
- Busca, vazio e recuperação, filtro de categoria, salvar/remover e filtros por orçamento exercitados no navegador. São interações do protótipo, não testes da persistência/medição em produção.
- `npm run build`: compilação e tipos concluíram; pré-renderização falhou por configuração pública do Supabase ausente neste worktree. Não é um build de release aprovado. Nenhuma chave foi criada, exibida ou alterada para contornar a falha.
- Sem commit, push, merge, deploy ou mudança remota nesta entrega. Os quatro screenshots não versionados de outra etapa foram preservados.
