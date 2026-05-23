# Alertas de novo usuario no WhatsApp

## Objetivo

Sempre que um novo usuario concluir o cadastro, o sistema pode avisar o administrador por WhatsApp.

## Como esta implementado

- Rota interna: `POST /api/notifications/new-user`
- Provedor: `Twilio WhatsApp`
- Disparo atual: apos `signUp` bem-sucedido no cadastro

## Variaveis necessarias

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `ADMIN_WHATSAPP_TO`
- `TWILIO_WHATSAPP_CONTENT_SID` opcional

## Observacao importante

Se `TWILIO_WHATSAPP_CONTENT_SID` nao estiver configurado, o sistema usa `Body` simples. Isso ajuda no sandbox e em testes, mas para mensagens iniciadas pela empresa em producao o WhatsApp normalmente exige template aprovado.

## Dados enviados no alerta

- Nome
- Email
- Gamertag
- Plataforma
- WhatsApp
- Data do cadastro
