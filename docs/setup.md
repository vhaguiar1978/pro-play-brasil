# Como rodar o sistema

## Estado atual

Data desta revisao:

- 3 de abril de 2026

O projeto esta rodando em `Next.js` e usa `Supabase` para autenticacao. Parte do produto ja funciona online, e a proxima fase e migrar de vez os dados de PPC, saques, historicos e admin para tabelas reais do Supabase.

## Passos para executar

1. Abrir a pasta do projeto.
2. Instalar dependencias com `npm install`, se necessario.
3. Copiar `.env.local.example` para `.env.local`.
4. Preencher as chaves do `Supabase`.
5. Rodar `npm run dev`.
6. Abrir `http://localhost:3000`.

## Variaveis principais

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `ADMIN_EMAILS`
- `MERCADO_PAGO_ACCESS_TOKEN`

## Estrutura principal

- `app/`: telas, rotas e APIs
- `components/`: componentes reutilizaveis
- `lib/`: regras, mocks e integracoes
- `supabase/ppb_beta_schema.sql`: base sugerida para o backend real do produto
- `docs/`: guias internos

## Observacao importante

O arquivo `prisma/schema.prisma` ainda e um legado de outro sistema antigo e nao representa o banco do Pro Play Brasil. Para este produto, a referencia certa passa a ser o `Supabase`.
