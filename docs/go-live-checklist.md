# Go-Live Checklist

## Status

Hoje o projeto esta em nivel de `MVP forte / beta inicial`.

## Ja pronto

- Cadastro e login com `Supabase`
- Campeonatos, apostas, PPC, postagens e area social
- Painel admin com usuarios, PPC, saques e reclamacoes
- Dashboard da arena
- Historico de PPC e historico competitivo do jogador
- Checkout do `Mercado Pago` preparado por API

## Falta fechar para producao real

- Rodar o SQL de `supabase/ppb_beta_schema.sql`
- Persistir PPC, saques, reclamacoes e historicos nas tabelas reais
- Configurar `ADMIN_EMAILS` com o email exato da conta administradora
- Configurar `MERCADO_PAGO_ACCESS_TOKEN`
- Ligar webhook do pagamento a credito automatico de PPC
- Definir politicas finais de RLS e revisao operacional

## Ordem recomendada

1. Subir schema no Supabase.
2. Configurar emails admin.
3. Configurar Mercado Pago.
4. Migrar telas hoje locais para leitura/escrita no banco.
5. Fazer rodada final de testes com duas contas reais.
