# 🦖 Detec Difusor

Motor de **distribuição** do PromoDetec. Lê as melhores ofertas da `vw_ofertas`
(somente leitura) e publica **um card por oferta** no **Telegram** e no **Discord**,
com **link rastreado `/r/{id}`** (clique logado + afiliado embrulhado).

> **Não toca no site.** Projeto isolado, processo próprio, anon key read-only.
> Não cria tabela, não roda migração, não altera nenhum arquivo do app Next.js.

## Por que existe (e como difere do feed inline)

O site já tem um aviso de queda de preço dentro da coleta (`notify/promo-feed.ts`).
O Difusor é a evolução **desacoplada** disso:

| | `promo-feed.ts` (no site) | **Detec Difusor** |
|---|---|---|
| Quando dispara | só na queda, durante a coleta | **agendado** (a cada 3h, configurável) |
| Formato | bloco de texto, várias ofertas | **1 card com foto por oferta** |
| Link | URL crua da loja | **`/r/{id}` rastreado + afiliado** |
| Repetição | — | **dedup** entre execuções |
| Atribuição | — | **origem por canal** (`?o=tg` / `?o=dc`) → tabela `cliques` |
| Acoplamento | dentro do app | **serviço externo** |

## Configuração

1. `cp .env.example .env` e preencha:
   - **Supabase** — a mesma `SUPABASE_URL` e a anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) do site.
   - **Telegram** — `TELEGRAM_BOT_TOKEN` (o `@PROMODETEC_BOT`) e `TELEGRAM_FEED_CHAT_ID`
     (o canal **público** de ofertas). Crie o canal, adicione o bot como **administrador**
     com permissão de *publicar*, e use `@seucanal` (público) ou o id `-100…`.
   - **Discord** — `DISCORD_DEALS_WEBHOOK_URL` de um canal público de ofertas.
2. Os dois canais são opcionais individualmente — configure um, o outro, ou ambos.

> Reaproveita exatamente os nomes de variáveis que o site já usa. Se você já
> configurou o feed público lá, o Difusor fala nos mesmos canais.

## Rodar local (Node 20+)

```bash
npm install
npm run once     # uma rodada e sai — ótimo p/ testar a saída
npm run dev      # fica vivo, agenda pelo CRON, recarrega ao editar
```

## Rodar em Docker

```bash
docker compose up -d --build
docker compose logs -f difusor
```

O estado de dedup vive em `./data/posted.json` (volume montado) e sobrevive a restart.

## Ajuste fino (`.env`)

| Var | Default | O que faz |
|---|---|---|
| `CRON` | `0 */3 * * *` | frequência da varredura |
| `RUN_ONCE` | `false` | `true` = roda 1x e sai (cron externo / GitHub Actions) |
| `BATCH` | `6` | ofertas publicadas por rodada |
| `POOL` | `80` | tamanho do balde lido antes de filtrar |
| `MIN_DESCONTO` | `10` | % mínimo de desconto p/ entrar |
| `MIN_SCORE` | `0` | `promo_score` mínimo (suba conforme calibrar) |
| `POST_DELAY_MS` | `1200` | intervalo entre posts (rate-limit Telegram) |
| `STATE_TTL_DAYS` | `30` | após N dias uma oferta pode reaparecer |

## Atribuição (o loop que fecha em dinheiro)

Cada link sai como `…/r/{id}?o=tg` (ou `o=dc`). A rota `/r/` do site já grava o
clique na tabela `cliques` com a coluna `origem`. Resultado: você consulta
`cliques` e vê **qual canal converte mais** — e dobra no que funciona.

## Próximos passos (fora deste MVP)

- **Card de imagem brandado** (preço sobreposto na foto + selo Detec) via `satori`/`sharp`.
- **WhatsApp Canal** pela **Cloud API oficial** (nunca automação não-oficial).
- **Um canal por vertical** (Gadgets/Fit/Casa&Eletro) — mapa `categoria → chat_id`.
