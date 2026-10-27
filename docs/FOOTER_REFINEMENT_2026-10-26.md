# Rodapé compartilhado: acabamento de 26/10/2026

O proprietário rejeitou a composição publicada: links dispersos, pouca hierarquia e espaço sem organização. A correção se limita ao rodapé e ao estilo do seu controle de privacidade. O componente `Footer` passa a ser consumido pelo RootLayout em todas as páginas; a lógica de consentimento, os destinos, os textos existentes e os contratos de dados continuam iguais.

## Composição

Superfície em `ink`, com branco e lime da paleta existente, sem rasters, fontes novas, selos ou claims. Marca e ação de comparação ocupam a primeira área; dois grupos de navegação, a segunda; atendimento e privacidade, a terceira. Uma faixa inferior reúne copyright e condições comerciais. Em tablet, marca e navegação compartilham a linha e atendimento ocupa a seguinte. No celular, a navegação conserva duas colunas e as áreas se empilham.

Os links internos mantêm prefetch desativado. Footer é um componente de servidor sem consultas; a ilha cliente de privacidade já existia. JS inicial da home informado pelo build permanece 122 kB, sem medição controlada de CPU ou economia percentual.

## Verificação

| Gate | Resultado |
| --- | --- |
| Tipos / Next | aprovados, servidor de produção real em loopback |
| OpenNext / empacotamento | Linux, dependências próprias existentes, gzip 1.561,28 KiB de 3.072 KiB |
| Worker HTTP | 23 aprovados, zero falhas, Wrangler 4.151.2 / compatibilidade 2026-08-23 |
| Viewports CSS | 1920, 1024, 768, 390 e 320 px; sem overflow observado |
| Controles | menor alvo 44 px; foco de teclado lime de 2 px |
| Contraste | menor contraste dos textos medidos 7,11:1 |
| Consentimento | abrir e rejeitar exercitados por mouse e teclado |
| Console | zero warnings/erros na amostra |

O laboratório reutilizou sua própria instalação e o mesmo baseline de aplicação já homologado; somente os três arquivos de implementação desta entrega foram sincronizados. Build recebeu configuração no processo e guard GET/HEAD. Runtime HTTP recebeu apenas configuração pública e bindings locais, com analytics desativado. Não houve escrita no banco, OAuth real, compra ou clique humano afiliado como teste. O recibo UTC de 27/10 corresponde à noite de 26/10 em Brasília e foi vinculado ao buildId `MobLztJZhODNIRLK3efNO`.

## Revisão e evidência

Uma nova revisão independente recebeu a captura rejeitada pelo usuário e a matriz final. Não encontrou correção visual material; apontou somente a descrição antiga do rodapé em DESIGN.md. O documenter registrou a extensão e seu sidecar; no verdict, o reviewer marcou esse item resolvido com `ship`. Esse verdict não certifica outras regiões do site.

Capturas locais em `.impeccable/review/footer/`: `user-1920.jpg`, `desktop.jpg`, `tablet.jpg`, `mobile.jpg`, `mobile-bottom.jpg` e `narrow-320.jpg`. O capturador gera JPEG ligeiramente reduzido; as medidas de viewport e controles vêm do DOM, não dos pixels. `mobile.jpg` usa altura 1200 para apresentar o componente inteiro; `mobile-bottom.jpg` corresponde ao viewport de 390×844. As capturas finais usam o Footer global em `/contato`, evitando que o carregamento tardio do catálogo prejudique a leitura. A home foi também observada com o rodapé.

A única varredura Impeccable retornou lista vazia no primeiro lote; depois houve o ajuste responsivo com classes existentes, sem segunda varredura. Não foram criados testes que apenas espelham classes CSS. Recibo agregado em `docs/evidence/footer-validation-2026-10-26.json`.

Integração em `main`, build remoto e versão ativa são estados separados. O estado definitivo de publicação fica na PR de entrega e no recibo local de produção; este documento descreve a validação anterior à publicação. Os quatro screenshots preexistentes foram preservados fora do staging.
