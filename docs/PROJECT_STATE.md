# Estado operacional do PromoDetec

## Candidato de publicação verificado em 20/10/2026

- O usuário autorizou a continuação e as próximas etapas. Release preparada em `codex/growth-release`, baseada em `42fdec5`; a integração Cloudflare existente publica **`codex/cloudflare-migration`**, não `main`. Commit de infraestrutura de auditoria: `d5802ca`, já no GitHub. O conjunto funcional está em staging e ainda não foi publicado nesta atualização.
- Estado externo revalidado no painel autenticado: Worker `promodetec`, domínio público já no Cloudflare, versão ativa prefixo `b1c6a140`, 100% do tráfego. O painel das últimas 24h mostrou 5,3% de erros e cerca de 1 mil estouros de CPU. São requisições/erros, não visitantes ou vendas.
- Candidato final: build `m-8-2gP_HoUmwmvU1WNSh`, 70 testes Linux, tipos, Next/OpenNext, dry-run gzip **1.574,01 KiB**, 23 contratos HTTP no workerd e QA desktop/mobile aprovados. Paridade de 269 arquivos entre índice Git e laboratório, normalizando apenas CRLF/LF. As mudanças pré-existentes de navbar, `.gitignore` e `cronograma-site` permanecem fora do release.
- Busca, categorias e recomendações excluem preços com mais de sete dias. O histórico e os links antigos de produtos continuam acessíveis. Prefetch removido de filtros, lojas e paginação: duas amostras completas da busca observaram 28 requisições locais, sendo quatro prefetches de navegação e **uma única requisição de `/ofertas`**. O baseline anterior truncado continha pelo menos 46 prefetches; não é comparação controlada nem medição de CPU de produção.
- A auditoria remota de metadados do Supabase passou em transação somente leitura (run `39477445211`). Confirmados RLS, grants e nomes de triggers; `eventos.tipo` é texto sem CHECK restritivo e colunas de privilégio do usuário não têm INSERT/UPDATE para `authenticated`. Não foram exportadas linhas nem executada DDL. OAuth e escrita no Worker de produção continuam sem prova nova.
- Os tokens de API Cloudflare local/GitHub foram rejeitados; deploy ficou pulado no run de auditoria `39477445206`. A sessão autenticada do painel funciona e confirmou o fluxo Git/Builds existente. Não criar tokens, alterar DNS ou remover origens para contornar esse problema.
- Relatórios/coleta novos ainda não estão ativos por agendamento em `main`. Migração do banco para outra conta continua adiada. Plano e recibos atuais: `docs/RELEASE_2026-10-20.md`.

## Registro da homologação anterior em 20/10/2026

O registro abaixo descreve a etapa anterior. O bloqueio de navegador foi superado e o estado externo foi revalidado no candidato acima.

- Upgrades em `codex/cloudflare-migration`, ainda no working tree: medição por consentimento, radar, SEO, relatórios, segurança da coleta e curadoria recente da home.
- A rodada da home passou por tipos, 60 testes Linux, build Next/OpenNext e dry-run Wrangler. Após limitar a quatro as requisições HTTP por renderização da home, as 12 fontes responderam no ensaio de leitura e o build não registrou `57014`. Isso não comprova estabilidade sob carga; a continuação abaixo registra o candidato mais recente.
- Continuação às 07:36 de Brasília: 23 verificações HTTP aprovadas no workerd, com R2/assets/autorreferência locais e leitura pública do Supabase. Wrangler 4.151.2 isolado suportou a data `2026-08-23`; as dependências da aplicação não foram atualizadas. Procedimento automatizado em `npm run test:worker`, somente para checkout Linux saneado.
- Continuação: autenticação e medição testadas com Supabase Auth/PostgREST/Postgres locais reais. Os 16 contratos passaram, incluindo persistência dos 14 eventos e leitura pelo relatório. Corrigidos destino inseguro de autenticação e descarte de eventos por normalização de loopback do Next. O fixture contém políticas locais de referência; não comprova paridade de RLS, grants ou triggers remotos.
- Candidato após essas correções: 64 testes Linux, tipos, build Next/OpenNext `lStAG4HrK68e0lzWShgzw`, dry-run gzip 1.573,82 KiB e nova rodada de 23 contratos HTTP no Worker aprovados. Novo comando `npm run test:auth-measurement`; laboratório Supabase e daemon Docker próprios encerrados, volumes preservados. Detalhes em `docs/AUTH_MEDICAO_2026-10-20.md`.
- O QA desktop/mobile e a medição de prefetch foram feitos antes do último ajuste do backend. A repetição do QA visual do candidato final está bloqueada porque o uso do navegador está desativado nas configurações do Work; falta repetir esse smoke antes de publicar.
- Não foram feitos commit, push, deploy, DNS, DDL remota, coleta real ou alteração de dados de produção nestas etapas. Houve DDL somente no banco local fictício. A leitura do Supabase atual foi comprovada, mas o acesso administrativo ao painel continua sem recuperação.
- A migração do banco para outra conta foi adiada pelo usuário. Continuar usando a configuração existente até planejamento e validação específicos da migração.
- Evidências: `docs/AVANCO_CRESCIMENTO_2026-10-20.md`, `docs/UPGRADE_HOME_2026-10-20.md`, `docs/HOMOLOGACAO_WORKER_2026-10-20.md` e `docs/AUTH_MEDICAO_2026-10-20.md`. A persistência de eventos foi provada no banco local fictício; HTTP local não prova QA visual, medição de usuários em produção, atribuição afiliada, CPU de produção ou expiração do cache.
- Não inferir DNS, implantação ou saúde atual de produção do registro de agosto abaixo. O estado externo não foi revalidado nesta atualização local.

## Registro histórico de 24/08/2026

O conteúdo a seguir conserva a verificação de agosto e pode estar desatualizado.

Última verificação: 24/08/2026, horário de Brasília.

## Resumo

**Migração Vercel → Cloudflare em andamento. Sem cutover DNS. Não apagar a Vercel.**

## Fatos medidos

- Checkout local: branch `codex/cloudflare-migration`, commit `22d16cb`; remoto da branch no mesmo commit durante a verificação.
- `origin/main` permanece em `6d39852`; a correção `22d16cb` ainda não está em `main`.
- O run `32682664547` validou `22d16cb`, mas não publicou porque o deploy real exige `workflow_dispatch` com `deploy=true`.
- Cloudflare: o Worker `promodetec` existe, mas está sem implantação ativa, versões ou builds.
- A URL `promodetec.alinessgarcia.workers.dev` foi testada e retorna a página vazia do Cloudflare, não a aplicação.
- A zona `promodetec.com.br` foi criada no plano Free; os 10 registros importados são equivalentes aos 10 registros do Registro.br.
- O Cloudflare atribuiu dois nameservers, mas eles ainda não foram aplicados no Registro.br.
- Há um registro DS publicado para o domínio. DNSSEC precisa ser tratado antes da troca de nameservers.
- DNS autoritativo: servidores do Registro.br (`d.sec.dns.br` e `f.sec.dns.br`).
- Apex `promodetec.com.br`: registro A `216.198.79.1`.
- `www.promodetec.com.br`: CNAME para infraestrutura da Vercel.
- O domínio público continua exibindo o estado pausado da Vercel.
- Coletas diárias permanecem em GitHub Actions e Supabase; não dependem do Worker executar Playwright.
- O GitHub CLI local está com token inválido e o navegador mantém o GitHub bloqueado por preferência salva; o deploy não foi disparado por contorno.

## Working tree

- Existem alterações sazonais em andamento e exclusões antigas fora desse escopo.
- Trate tudo como **não publicado** até commit, push e deploy serem confirmados separadamente.
- Nunca use `git add -A` sem revisar a árvore inteira.

## Gates antes do DNS

1. Publicar a correção aprovada e confirmar versão/SHA exatos e bindings por nome.
2. Habilitar/confirmar uma URL de teste e obter HTTP 200 da Home.
3. Fazer smoke de assets, Supabase público, `/r/{id}`, autenticação e rotas protegidas.
4. Concluído: inventário da zona original, incluindo A, CNAME, MX, SPF, DKIM e verificações.
5. Concluído: zona Cloudflare Free criada com correspondência 10/10.
6. Publicar e testar o Worker antes de ativar a zona.
7. Tratar DNSSEC e pedir aprovação humana explícita no momento da alteração de nameservers.
8. Ligar apex e `www` ao Worker, aguardar TLS e repetir smoke externo.
9. Manter rollback da Vercel durante a observação; remover somente após estabilidade comprovada.

## Próxima decisão

Não modificar DNS ainda. O próximo passo é liberar o acesso do navegador ao GitHub ou disparar manualmente o workflow `Deploy Cloudflare Worker` na branch `codex/cloudflare-migration`, marcando a opção de publicação. Depois: confirmar SHA/URL, executar smoke, tratar DNSSEC e só então aprovar a troca de nameservers.
