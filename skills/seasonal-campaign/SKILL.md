---
name: promodetec-seasonal-campaign
description: Use em toda troca de campanha, data comercial, banner, hero ou identidade sazonal do PromoDetec. Garante calendário automático em Brasília, assets responsivos, dados afiliados preservados e QA sem deixar tema vencido ativo.
---

# Campanha sazonal do PromoDetec

## Descoberta

1. Leia `src/lib/seasonal.ts` como fonte única do calendário.
2. Mapeie consumidores: layout/body, navbar, hero, vitrine rotativa, cards e metadata.
3. Pesquise referências ao tema anterior antes de editar.
4. Confirme datas em fontes atuais e diferencie feriado oficial de data comercial.

## Calendário

- Calcule datas em `America/Sao_Paulo`, não no timezone implícito do Worker.
- Programe entrada e saída; fora da janela, use pele neutra.
- Preserve `NEXT_PUBLIC_TEMA_FORCE` apenas para preview controlado.
- Teste início, último dia, primeiro dia seguinte e virada de ano.

## Assets

- Crie fundo desktop e fundo mobile dedicado em proporção vertical 9:16.
- Não embuta copy, preço, logo ou CTA na imagem.
- Otimize o arquivo antes de versionar e mantenha texto/controles no HTML.
- Fundo abaixo da primeira dobra usa lazy loading; não dispute LCP sem necessidade.
- Não apague assets históricos sem pedido explícito; remova apenas referências ativas.

## Implementação

- Tema é dado estruturado, não HTML cru.
- Produtos vêm do repositório/Supabase; nunca envie feed bruto ao navegador.
- Preserve `/r/{id}?o=...` e `rel="nofollow sponsored"` nos links afiliados.
- Cards têm dimensões estáveis, imagem legível, preço, loja, PromoScore e estados vazios.
- Não use emoji como ícone de interface quando Lucide oferecer equivalente.

## QA

1. Rode `npm run typecheck` e `npm run build`.
2. Visualize tema atual e próxima campanha via `NEXT_PUBLIC_TEMA_FORCE`.
3. Verifique desktop e mobile: recorte, 9:16, contraste, texto, cards, gráfico e ausência de sobreposição.
4. Confirme que nenhuma copy ou asset do tema encerrado aparece no DOM ativo.
5. Registre os arquivos e a janela programada; não faça deploy sem aprovação.
