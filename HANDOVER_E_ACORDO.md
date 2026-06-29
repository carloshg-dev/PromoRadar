# promodetec — Transferência de contas e acordo de manutenção

> Documento de apoio. Não é aconselhamento jurídico ou financeiro — ajuste com bom senso e, se o valor envolvido crescer, consulte um contador/advogado.

## Princípio geral

A regra para você não ter dor de cabeça é simples: **a infraestrutura deve estar no nome do dono do projeto (seu amigo), com o cartão dele.** Você administra; o custo e o risco financeiro são dele. Hoje está tudo nas suas contas — isso precisa mudar antes do uso diário começar.

Separe sempre duas coisas:
1. **Desenvolvimento** — o que já foi feito + novas funcionalidades. Cobrança única ou por fase.
2. **Manutenção/operação** — manter no ar, consertar scraper quebrado, monitorar. **Mensalidade fixa.** É o que te protege de virar suporte gratuito.

---

## Passo a passo da transferência

### 1. GitHub
Opção A (recomendada): o repositório nasce na conta dele.
1. Seu amigo cria conta no GitHub e cria o repositório `promodetec`.
2. Ele te adiciona como colaborador (Settings → Collaborators).
3. Você faz o push para o repositório dele.

Opção B: se já estiver na sua conta, use Settings → General → **Transfer ownership** e transfira para o usuário dele.

### 2. Supabase
1. Seu amigo cria conta no Supabase e uma **Organization** própria (com o cartão dele, se for para o plano pago).
2. No projeto atual: Project Settings → General → **Transfer project** → escolher a organização dele.
3. Ele te convida de volta como membro (Organization → Members) para você administrar.
4. **Importante:** depois da transferência, as chaves de API (`anon` e `service_role`) continuam as mesmas, então o `.env`/Vercel não muda. Só confirme.

### 3. Vercel
1. Seu amigo cria conta na Vercel (pode logar com o GitHub dele).
2. Importe o repositório **a partir da conta dele**, ou use Project Settings → **Transfer** para mover o projeto para o time dele.
3. Reconfigure as variáveis de ambiente na conta dele:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET`
4. Ele te adiciona como membro do time para você continuar fazendo deploy.

### 4. Domínio (opcional)
Se quiserem um domínio próprio (ex: `promodetec.com.br`), registre **no nome dele** (Registro.br para `.br`) e aponte para a Vercel. Custo ~R$40–60/ano, no cartão dele.

### 5. Senhas e acessos
Use um gerenciador de senhas compartilhado (ex: Bitwarden) com as credenciais no nome dele. Evita o cenário "só você tem acesso ao que é dele".

---

## Custos de infraestrutura (verifique os valores atuais — mudam)

| Serviço | Plano inicial | Quando vira pago |
|---|---|---|
| Supabase | Gratuito | ~US$25/mês (Pro) quando o histórico crescer / passar dos limites |
| Vercel | Gratuito (Hobby) | ~US$20/mês (Pro) com mais tráfego/uso. **Atenção:** o plano Hobby é para uso não-comercial; uso comercial pede o Pro |
| Domínio | — | ~R$40–60/ano |

Tudo isso deve cair no cartão dele, não no seu.

---

## Modelo simples de acordo (ajuste os valores e termos)

> **Acordo de prestação de serviços — promodetec**
>
> **Partes:** [Seu nome] ("Desenvolvedor") e [Nome do amigo] ("Cliente").
>
> **1. Propriedade.** O Cliente é o dono do software, do código, do banco de dados e das contas de infraestrutura (Supabase, Vercel, GitHub, domínio), todas registradas em nome dele.
>
> **2. Desenvolvimento.** O Desenvolvedor entregou a fundação da plataforma e poderá desenvolver novas funcionalidades mediante orçamento aprovado por escrito, no valor de [R$ ___ por fase / por hora].
>
> **3. Manutenção.** O Desenvolvedor manterá a plataforma em operação (monitoramento, correção de scrapers, atualizações de segurança) por uma mensalidade de [R$ ___], cobrindo até [X horas] por mês. Horas excedentes a [R$ ___/hora].
>
> **4. Custos de infraestrutura.** Pagos diretamente pelo Cliente (cartão dele). Não inclusos na mensalidade.
>
> **5. Limites.** O Desenvolvedor não garante disponibilidade de dados de lojas terceiras (sites podem mudar ou bloquear coleta). Correções desses casos entram na manutenção.
>
> **6. Encerramento.** Qualquer parte pode encerrar com [30] dias de aviso. No encerramento, o Desenvolvedor entrega todos os acessos e documentação ao Cliente.
>
> **Data e assinaturas.**

---

## Resumo da sua proteção

- Infra no nome dele = custo e risco dele.
- Mensalidade fixa de manutenção = você não vira suporte de graça.
- Acordo por escrito, mesmo simples = evita mal-entendido.
- Acessos documentados e compartilhados = ninguém fica refém.
