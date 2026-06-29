# Deploy do promodetec — passo a passo

Objetivo: colocar o site no ar, com endereço público, e a coleta automática rodando. Tempo estimado: ~15 minutos.

Pré-requisito: o `npm run build` já passou na sua máquina (passou ✅).

---

## Parte 1 — Enviar o código para o GitHub

No PowerShell, dentro da pasta do projeto (cole uma linha por vez):

```powershell
cd C:\Users\CarlosAlineBianca\promodetec_COMPLETO
git init
git add .
git commit -m "promodetec - fundacao completa"
git branch -M main
git remote add origin https://github.com/paulohelon280/promodetec.git
git push -u origin main
```

Se pedir login do GitHub, entre com a conta do seu amigo. Se der erro dizendo que o remote já existe, pule a linha do `git remote add`.

**Confira:** abra `https://github.com/paulohelon280/promodetec` no navegador. Os arquivos devem aparecer lá — **menos** o `.env.local` (ele fica escondido de propósito, por segurança). Se você vir o `.env.local` na lista, PARE e me avise.

---

## Parte 2 — Publicar na Vercel

1. Acesse **https://vercel.com** e entre com a conta do seu amigo (pode usar "Continue with GitHub").
2. Clique em **Add New… → Project**.
3. Na lista de repositórios, encontre **promodetec** e clique em **Import**.
4. A Vercel detecta o Next.js sozinho — não mexa nas configurações de build.
5. Antes de clicar em Deploy, abra **Environment Variables** e adicione estas 4 (copie os nomes exatamente):

   | Nome | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://sksjukjkxkptresysbno.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_etii9hSakZFw1yb44B2zHw_aIOaXEPF` |
   | `SUPABASE_SERVICE_ROLE_KEY` | *(a mesma chave service_role que você colou no `.env.local`)* |
   | `CRON_SECRET` | *(invente uma senha qualquer, ex: `promodetec-2026-xyz`)* |

6. Clique em **Deploy** e aguarde uns 2 minutos.
7. No fim, a Vercel mostra o endereço do site (algo como `promodetec.vercel.app`). Abra para conferir.

---

## Parte 3 — Ligar a coleta automática

A coleta às 7h e 17h já está configurada no projeto (`vercel.json`) e passa a funcionar sozinha após o deploy. **Não precisa fazer nada.**

Para encher o banco **agora** (sem esperar as 7h), faça a primeira coleta manual de duas formas:

- **Pelo site:** abra `seu-site.vercel.app/admin` e clique em "Coletar kabum" e "Coletar mercadolivre".
- **Ou pela sua máquina:** no PowerShell, dentro da pasta: `npm run scrape kabum`

Depois recarregue a página inicial — as ofertas devem aparecer.

---

## Se algo der errado

- **Site abre mas sem ofertas:** normal no início, o banco está vazio. Faça a coleta manual (Parte 3).
- **Erro de coleta no /admin:** quase sempre é a `SUPABASE_SERVICE_ROLE_KEY` faltando ou errada nas variáveis da Vercel. Confira na Parte 2.
- **`git push` pede usuário/senha toda hora:** o GitHub hoje pede um "token" no lugar da senha. Se travar nisso, me avise que eu te explico como gerar.

---

## Resumo

GitHub guarda o código → Vercel transforma em site no ar → Supabase guarda os dados → o cron coleta sozinho 2x por dia. Feito uma vez, roda sozinho.
