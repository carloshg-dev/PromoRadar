---
version: 1
slug: "src-components-layout-footer-tsx"
primary_target: "src/components/layout/footer.tsx"
related_targets: ["src/app/layout.tsx", "src/components/analytics/cookie-consent.tsx"]
---

# Rodapé compartilhado

Modo: Operate. Encerrar a exploração e encontrar navegação, atendimento e privacidade com clareza. Refinamento do mundo existente, sem nova identidade global.

## Direction contract

THESIS: Uma base editorial firme para o catálogo: marca e ação, navegação organizada, atendimento e transparência em áreas distintas.

OWN-WORLD: Geist e a paleta existente de papel, tinta verde profunda e lime. O rodapé usa tinta verde como superfície de encerramento; links e utilidades mantêm contraste e foco claro. A página permanece clara.

STORY: Continuar comparando, explorar os destinos, localizar informações institucionais ou contato, rever privacidade e ler as condições.

FIRST VIEWPORT: Em desktop, três áreas estruturais: marca/ação, dois grupos de navegação, atendimento/privacidade. Faixa legal inferior alinhada à grade. Tablet mantém marca e navegação lado a lado e atendimento em linha própria. Celular empilha marca, dois grupos compactos e atendimento, mantendo alvos de 44 px.

FORM: Extensão da seed herdada d01731c2, candidato 6/7 do mundo existente, registrada no brief da home e em direction-candidates.md. Composição tipográfica e grid responsivo; sem cards decorativos, novos rasters, selos, métricas ou movimento ornamental. Nome, lema, chamada e texto legal existentes preservados; somente rótulo da ação e agrupamento de destinos mudam.

FINISH: Revisão independente fresca com a captura rejeitada pelo usuário, matriz 1920/1024/768/390/320, funcionalidade do consentimento, contraste e foco. Documentar a extensão do rodapé, sem reescrever a direção das outras superfícies.

## Evidência e limites

O usuário rejeitou o rodapé publicado e pediu alto padrão visual. A captura enviada no chat (`codex-clipboard-d0562e6d-771d-4ed7-a716-582627838300.png`) é a evidência prioritária do problema, não um comp a reproduzir. Fluxo por código, sem propostas em imagem e sem comp aprovado.

RootLayout consome Footer em todas as páginas. PrivacySettings conserva o evento e a lógica existentes; a alteração é de apresentação. Nenhuma consulta, persistência ou saída afiliada adicional. Os links internos mantêm `prefetch={false}`.
