# Fontes do Render Engine

O `render.service.ts` carrega **todo `.ttf`/`.otf` desta pasta** no resvg, pra a
arte sair idêntica na nuvem (o Linux do GitHub Actions / Oracle **não tem Arial**).

## Onde soltar (cirúrgico)

Baixe o **Inter** (moderna, open-source, licença OFL — pode versionar) e solte
os 2 arquivos AQUI, exatamente com estes nomes:

```
assets/fonts/Inter-Regular.ttf
assets/fonts/Inter-Bold.ttf
```

Fonte oficial (grátis): https://github.com/rsms/inter/releases → `Inter-*.zip`
→ dentro de `extras/ttf/` pegue `Inter-Regular.ttf` e `Inter-Bold.ttf`
(~300 KB cada). Alternativa: Google Fonts (https://fonts.google.com/specimen/Inter).

Depois: `git add assets/fonts/*.ttf` e commit. Só isso — o código já aponta pra cá.

## Como funciona o fallback

A arte usa `font-family="Inter, Arial, Helvetica, sans-serif"`:
- **Com o Inter aqui** (nuvem e local): renderiza Inter. ✅ visual definitivo.
- **Sem o Inter** (local, antes de você baixar): cai no **Arial do sistema** — não
  quebra, só não é o Inter ainda.

Trocar de fonte no futuro = soltar outro `.ttf` aqui e ajustar `FONTE` em
`src/lib/arte-oferta.ts`.
