# PromoRadar — entenda o que é o seu aplicativo

*Escrito em linguagem simples, sem termos técnicos.*

---

## O que é o PromoRadar?

Imagine um assistente que fica o dia inteiro olhando os preços das principais lojas de tecnologia do Brasil (Kabum, Pichau, Mercado Livre, TerabyteShop) e anota tudo num caderninho. Com o tempo, esse assistente sabe **quanto cada produto costuma custar** — e por isso consegue te avisar quando um preço está **realmente** baixo, e não só "parece" baixo.

O PromoRadar é isso, automatizado e num site bonito. Ele monitora promoções de hardware e tecnologia, guarda o histórico de preços de cada produto e dá uma **nota de 0 a 100** para cada oferta, dizendo o quão boa ela é de verdade.

É um site na internet (não um programa que você instala). Você abre pelo navegador do celular ou do computador, de qualquer lugar.

---

## Como ele funciona, em 4 passos

1. **Coleta automática.** Duas vezes por dia (7h da manhã e 17h da tarde), o sistema visita as lojas sozinho e anota os preços. Você não precisa fazer nada — acontece sozinho, mesmo com o computador desligado, porque roda na "nuvem".

2. **Memória de preços.** Cada preço coletado é guardado. Assim o sistema sabe, por exemplo, que aquela placa de vídeo já custou R$ 2.000, depois R$ 2.400, e hoje está R$ 1.800. Ele lembra de tudo.

3. **A nota inteligente (PromoScore).** Aqui está o pulo do gato. Em vez de confiar no "de R$ 2.000 por R$ 1.800" que a loja anuncia (que muitas vezes é mentira), o PromoRadar compara o preço de hoje com o **histórico real** do produto. Se está perto do menor preço de todos os tempos, a nota é alta. Se a loja inventou um desconto, a nota fica baixa. **Ele detecta promoção falsa.**

4. **Você vê tudo organizado.** O site mostra as melhores ofertas em primeiro lugar, com gráficos de como o preço variou, filtros por categoria e um painel de controle.

---

## O trabalho que foi feito

Foi construída a **fundação completa** da plataforma:

- O **banco de dados** (a "memória" do sistema), preparado para guardar milhões de preços sem ficar lento.
- O **sistema de coleta** que visita as lojas (Kabum e Mercado Livre já 100% prontos; Pichau e Terabyte com a estrutura pronta para finalizar).
- O **algoritmo PromoScore**, que é a inteligência exclusiva do projeto — o que diferencia o PromoRadar de um comparador comum.
- O **site** em si: página inicial, lista de ofertas, página de cada produto com gráfico de histórico, e um painel administrativo para acompanhar tudo.
- A **coleta automática** agendada e toda a base para crescer.

Em resumo: o "esqueleto" e o "cérebro" estão prontos e funcionando. As próximas fases adicionam mais lojas, notícias de tecnologia e avisos automáticos.

---

## Como se compara com Buscapé, Zoom e outros

Os comparadores tradicionais (Buscapé, Zoom) basicamente **mostram o preço de agora** em várias lojas e pronto. Eles respondem "onde está mais barato hoje?".

O PromoRadar responde uma pergunta melhor: **"esse preço é realmente uma boa oportunidade?"**

| | Buscapé / Zoom | PromoRadar |
|---|---|---|
| Mostra preço atual | Sim | Sim |
| Guarda histórico de preços | Limitado | Sim, completo |
| Detecta desconto falso | Não | **Sim (PromoScore)** |
| Nota de qualidade da oferta | Não | **Sim, de 0 a 100** |
| Foco | Tudo (genérico) | **Hardware e tecnologia** |
| Banco de dados próprio | — | **Sim, proprietário** |

A vantagem é a **inteligência e o foco**. Em vez de ser "mais um" comparador genérico, o PromoRadar é especialista em tecnologia e tem memória — sabe diferenciar uma promoção de verdade de uma maquiada.

---

## Quando vai precisar pagar (e quanto)

Hoje **está tudo de graça.** As ferramentas usadas têm planos gratuitos que aguentam bem o início. Você só vai pagar quando o projeto crescer. Aqui está o mapa, do mais provável ao menos:

| Ferramenta | Para que serve | Hoje | Quando vira pago |
|---|---|---|---|
| **Supabase** | A memória/banco de dados | Grátis | ~US$ 25/mês quando o histórico de preços ficar grande (muitos meses de coleta, muitos produtos) |
| **Vercel** | Mantém o site no ar | Grátis | ~US$ 20/mês com bastante visitas, ou se virar negócio comercial de verdade |
| **Domínio próprio** | Ter um endereço bonito (ex: promoradar.com.br) em vez de promoradar.vercel.app | Opcional | ~R$ 50/ano |
| **GitHub** | Guarda o código com segurança | Grátis | Provavelmente nunca precisa pagar |

**Tradução:** dá pra rodar o PromoRadar funcionando, no ar, **gastando R$ 0** por um bom tempo. Os custos só aparecem quando há muita gente usando e muitos dados acumulados — ou seja, quando o projeto já estiver dando certo. É um "problema bom de se ter".

---

## Ferramentas para continuar crescendo

Conforme o projeto evolui, estas são as direções naturais (todas começam de graça):

- **Mais lojas:** finalizar Pichau e Terabyte, e adicionar outras (Amazon, Magazine Luiza...). A estrutura já está pronta para encaixar novas lojas.
- **Notícias de tecnologia:** um módulo que coleta notícias de hardware/lançamentos automaticamente, para o site virar referência, não só de preço.
- **Avisos automáticos (alertas):** "me avise quando essa placa custar menos de R$ 1.500" — por e-mail, Telegram ou WhatsApp.
- **Contas de usuário:** cada pessoa salva seus favoritos e alertas.
- **Aplicativo de celular:** no futuro, transformar o site em app.

Cada uma dessas é uma fase de desenvolvimento que pode ser feita aos poucos.

---

## Em uma frase

O PromoRadar não é "mais um site de comparar preço" — é um **assistente inteligente de oportunidades de tecnologia**, com memória e capacidade de farejar promoção de verdade, construído para crescer e, um dia, virar referência no Brasil.
