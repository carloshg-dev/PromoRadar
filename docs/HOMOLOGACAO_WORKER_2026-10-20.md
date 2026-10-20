# PromoDetec: homologação HTTP do Worker

20/10/2026, rodada final às 07:36 de Brasília. Branch `codex/cloudflare-migration`, HEAD `42fdec5` mais alterações locais, build `1HnzyB3z6YhD4mq8MZYKI`.

Continuação posterior: [autenticação e persistência em Supabase local](AUTH_MEDICAO_2026-10-20.md), com duas correções na aplicação, recompilação e repetição dos 23 contratos HTTP. Os recibos e limitações abaixo correspondem à rodada das 07:36.

## Resultado

**23 verificações HTTP aprovadas no workerd local. Produção ainda não liberada.** A aplicação foi executada com assets, cache R2 simulado e autorreferência do Worker conectados localmente. As consultas de busca, produto, ofertas e comparação leram o Supabase atual com a chave pública. Não foram fornecidos service role ou token Cloudflare por ambiente.

[Recibos por rota](evidence/worker-lab-2026-10-20.json).

| Contrato | Resultado observado |
| --- | --- |
| Home, primeira resposta e resposta seguinte | HTTP 200, `x-nextjs-cache: HIT`, mesmo hash do HTML |
| Quatro requisições simultâneas da home | HTTP 200 e mesmo hash; cache previamente populado |
| JavaScript e CSS | HTTP 200, tipos corretos e conteúdo presente |
| Robots, sitemap, cupons e login | HTTP 200 |
| Admin sem sessão | HTTP 307 para login, preservando `/admin` como destino |
| Tentativa anônima de adicionar produto | HTTP 401; corpo vazio de teste, sem chave administrativa |
| Tracking com medição desativada | Lote válido recebeu HTTP 204 e `no-store` |
| HEAD e prefetch de saída | HTTP 204 |
| Bot em saída afiliada | HTTP 307 para a página interna do produto |
| Identificador inválido em saída | HTTP 307 para a home |
| Busca pública | HTTP 200, lista sem erro e limite de oito resultados |
| Produto obtido pela busca, ofertas e comparador | HTTP 200 |

O ensaio final não registrou `57014`, falha de escrita de analytics ou mensagens de limite de CPU. A ausência dessas mensagens em um ensaio curto não mede CPU nem comprova estabilidade de produção.

## Cache e tempos

A primeira resposta da home levou 415 ms, e a seguinte, 75 ms. Os tempos foram medidos com relógio monotônico no cliente do teste, incluindo o consumo do corpo. Não são CPU, startup de produção, TTFB isolado ou Core Web Vitals. Os tempos do log do Wrangler não foram usados como métrica: houve valores negativos durante ajuste do relógio do WSL em uma rodada anterior.

O HTML da home tinha 769.385 bytes após descompressão. Não representa o tamanho transferido com gzip/Brotli. A primeira resposta já veio do cache populado pelo OpenNext; não foi uma geração a frio nem um teste de expiração. O hash foi comparado nas seis respostas para verificar a consistência observada do cache.

## Ajuste do laboratório

O primeiro runtime, Wrangler 4.59.2 do lockfile, avisou que suportava data de compatibilidade somente até `2026-01-14`, anterior à configuração `2026-08-23`. Essa rodada não bastava para validar a data pretendida.

Wrangler 4.151.2 foi instalado fora do projeto, em uma pasta exclusiva do laboratório. O ensaio final usou a data efetiva `2026-08-23`, sem redução de compatibilidade. O `package-lock.json` e as dependências da aplicação permanecem iguais. A população do cache local usou a CLI OpenNext existente; o servidor HTTP foi iniciado com o Wrangler selecionado.

Foram acrescentados `scripts/validate-worker.ts` e o comando `npm run test:worker`. O procedimento:

1. Exige Linux e um build OpenNext existente.
2. Recusa arquivos de ambiente com nomes fora da lista pública, tanto na raiz quanto no diretório do laboratório. Aceita somente chave publishable/anon.
3. Gera configuração ignorada pelo Git em `.next/worker-lab`, com nomes próprios e `remote: false`; inicia também com `--local`.
4. Desativa a medição, não herda credenciais por ambiente, usa respostas limitadas a 2 MiB e limita o log a 512 KiB.
5. Popula o cache local, executa as verificações, grava o recibo e encerra o grupo de processos que iniciou. Falha de contrato produz saída não zero.

Não executar esse comando no checkout que contém `.env.local` privado. A recusa é intencional: usar cópia Linux saneada com somente as três variáveis públicas e sem arquivos `.dev.vars` privados.

Comando usado nesta máquina:

```powershell
wsl -d Ubuntu --cd /root/.cache/promodetec-lab.lpz5JIMo/app --exec env PATH=/root/.cache/promodetec-lab.lpz5JIMo/runtime/bin:/usr/local/bin:/usr/bin:/bin PROMODETEC_WORKER_WRANGLER=/root/.cache/promodetec-lab.lpz5JIMo/worker-runtime/node_modules/wrangler/bin/wrangler.js npm run test:worker
```

Sem `PROMODETEC_WORKER_WRANGLER`, o comando usa a versão instalada no projeto e registra eventual redução da data de compatibilidade no recibo. Para homologar a data atual, selecionar um runtime que a suporte. Não foi adicionada execução agendada nem disparado workflow remoto.

## Validação e limites

TypeScript e `git diff --check` aprovados. Esta etapa adicionou uma ferramenta de validação; não mudou componentes, regras de preço, queries da aplicação, autenticação ou configuração de produção. Reutilizou o build anterior de Next/OpenNext; não apresenta esse build como recompilação desta etapa.

[Paridade conferida](evidence/worker-source-parity-2026-10-20.json): 205 arquivos do candidato coincidem com o laboratório, os 13 arquivos da prova anterior fora do manifesto de scripts continuam iguais, e dependências/lockfile não mudaram. A [varredura de valores privados conhecidos](evidence/secret-scan-worker-2026-10-20.json) não encontrou ocorrências no escopo inspecionado.

O navegador continua bloqueado por “Local browser use is disabled in Work settings”. HTTP não valida aparência, hidratação, interação ou erros de console. O QA visual do build final continua pendente.

Também não foram comprovados: login com conta real, gravação de novos eventos em banco isolado, permissões e constraints de produção, redirecionamento humano com persistência de clique, atribuição nas redes, bucket R2 real, expiração/falha de revalidação, carga prolongada ou CPU/1102 no Cloudflare. Nenhuma URL afiliada externa foi seguida.

O próximo gate é homologar autenticação e persistência em ambiente isolado, repetir o QA visual e validar cache/CPU com bindings reais em uma versão de teste aprovada. Commit, push e publicação continuam etapas separadas. Não houve deploy, DNS, DDL, coleta ou alteração de dados de produção.

## Referências

- [Cloudflare: execução e bindings locais, incluindo `--local`](https://developers.cloudflare.com/workers/local-development/).
- [OpenNext: população local do cache e preview](https://opennext.js.org/cloudflare/cli).
- [OpenNext: R2 e autorreferência no cache](https://opennext.js.org/cloudflare/caching).
