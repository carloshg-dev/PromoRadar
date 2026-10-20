---
name: promodetec-cloudflare-cutover
description: Use obrigatoriamente em deploy, OpenNext, Wrangler, Cloudflare Workers, domínio promodetec.com.br, DNS, migração ou remoção da Vercel. Conduz preflight, publicação, smoke, cutover e rollback sem confundir workflow verde com produção.
---

# Cutover Cloudflare do PromoDetec

## Preparação

1. Leia `CLAUDE.md`, `MISTAKES.md` e `docs/PROJECT_STATE.md`.
2. Confirme repo, branch, SHA e working tree. Não presuma que `main`, local e deploy coincidem.
3. Separe fatos medidos, hipóteses e ações ainda não autorizadas.
4. Verifique apenas os nomes/presença de secrets; nunca mostre valores.

## Preflight de código

Execute no checkout correto:

```powershell
npm ci
npm run typecheck
npm run build
npm run cf:build
```

O gate decisivo do plano Free é o tamanho **gzip** reportado por `wrangler deploy --dry-run`. Faça a medição em Linux/CI quando o OpenNext não suportar plenamente o Windows.

Confirme que o Worker não inclui Playwright, Chromium, adapters pesados ou imagens de metadata como rota server-side. `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` evita download; não remove imports do bundle.

## Homologação local sem publicação

- Em cópia Linux saneada, com build OpenNext existente e somente variáveis públicas, rode `npm run test:worker`.
- O comando recusa arquivos de ambiente privados, popula R2 local, inicia o Worker com `--local`, verifica contratos HTTP e encerra seus próprios processos. Não executar no checkout com `.env.local` privado nem fornecer service role.
- Se o runtime instalado não suporta a data de compatibilidade do projeto, selecione um Wrangler compatível por `PROMODETEC_WORKER_WRANGLER` apontando para seu `bin/wrangler.js` em instalação isolada. Registre versão e data efetiva do recibo.
- Examine `docs/evidence/worker-lab-AAAA-MM-DD.json`. Cache previamente populado não é geração a frio; tempos HTTP locais não medem CPU no Cloudflare.
- Essa etapa não substitui navegador, conta autenticada, escrita em banco isolado, atribuição afiliada, expiração/revalidação do cache ou homologação com bindings reais.

## Publicação

Publicar exige aprovação humana explícita. Após o deploy:

1. Confirme versão/horário no Cloudflare.
2. Confirme bindings obrigatórios por **nome**, sem revelar valores, antes de ativar tráfego.
3. Obtenha URL de teste e HTTP 200.
4. Teste Home, assets, uma leitura Supabase, `/r/{id}`, login/callback e uma rota protegida.
5. Verifique logs sem copiar dados pessoais ou secrets.

## DNS e e-mail

Não altere DNS apenas porque o Worker existe.

1. Exporte/inventarie A, AAAA, CNAME, MX, TXT, CAA, SPF, DKIM e DMARC atuais.
2. Adicione a zona ao Cloudflare Free e confira a importação linha a linha.
3. Preserve todos os registros do e-mail profissional.
4. Prepare apex e `www`, mas peça confirmação no momento de salvar nameservers ou rota customizada.
5. Após propagação/TLS, repita o smoke fora da rede local.

## Critérios para retirar a Vercel

- Worker acessível e versão identificada.
- Apex e `www` respondem no Cloudflare com TLS válido.
- Home, assets, Supabase, auth e redirect afiliado aprovados.
- E-mail profissional preservado.
- Observação sem erro e rollback documentado.

Até todos os critérios passarem, a Vercel permanece como origem de rollback. Pausar não equivale a poder apagar.

## Relatório

Informe SHA, run/deploy, tamanho gzip, URLs testadas, status por rota, estado DNS, itens não verificados e decisão: `GO`, `NO-GO` ou `ROLLBACK`.

Um run verde precisa declarar se apenas validou, fez upload de versão ou realmente publicou. Branch, `main`, Worker e produção são estados separados.
