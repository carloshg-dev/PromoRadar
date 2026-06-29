ARQUIVO DE CONTEXTO: PROMODETEC (FASE 2)
1. Identidade do Projeto
Nome: PromoDetec / PromoRadar.

Core: Plataforma de comparação de preços e garimpo de ofertas para o nicho de afiliados.

Arquitetura: Next.js, Supabase (banco de dados/auth), Tailwind CSS.

Estilo Visual: "Premium Dark" (fundo escuro, neon, bordas iluminadas, elementos sazonais como lanternas penduradas/arraia).

2. Regras de Negócio (Obrigatórias)
Vitrine Dinâmica: Nenhuma seção é estática. Toda vitrine deve ser um componente que faz map de um array de produtos vindo do banco de dados (Supabase).

Processamento de Dados: Proibido carregar datasets gigantes em memória. Usar sempre Streams ou paginação eficiente via Supabase.

Automação: O pipeline de importação (ex: Shopee) é um processo assíncrono controlado via scripts (/scripts/import-shopee-feed.ts).

Parceiros: Integração modular para Lomadee, Shopee e futuros parceiros (usar padrão mock-partners.ts).

3. Padrões de Código
Componentização: Componentes de vitrine devem ser reutilizáveis (ex: VitrineRodizio.tsx).

Tipagem: Uso estrito de TypeScript conforme o padrão produtos.repo.ts e collection.service.ts.

UI/UX: Componentes devem ser responsivos, usar next/image e animações leves via Tailwind (ex: hover:-translate-y-2).

4. Protocolo de Segurança (Cientista de Sistemas)
Ambiente de Testes: Todo código deve ser validado primeiro em C:\Users\CarlosAlineBianca\PromoRadar_TESTE-AMBIENTE antes de ir para produção.

Validação Humana: Nunca aplicar alterações globais sem a minha (Carlos Henrique Garcia) confirmação direta após o teste de npm run dev.

Ferramentas: O Codex deve utilizar os MCPs stitch (arquivos) e PromoRadar-Pipeline (automação) como suas ferramentas primárias de trabalho.