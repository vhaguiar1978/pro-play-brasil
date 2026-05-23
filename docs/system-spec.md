# Especificacao Funcional do Sistema

## 1. Visao geral

Sistema web para controlar todo o processo da Via Pet Acessorios, desde o cadastro de materia-prima e composicao dos produtos ate vendas, producao, comissoes, financeiro, cobrancas e relacionamento com clientes.

O sistema deve ser simples para uso diario, com painel visual, processos automatizados e acesso separado por tipo de usuario.

## 2. Perfis de acesso

### 2.1 Administrador

Permissoes:

- acesso total ao sistema
- cadastrar, editar e remover usuarios
- visualizar todos os pedidos, clientes, produtos e relatorios
- aprovar pagamentos, comissoes e producao
- configurar cobrancas automaticas
- acessar configuracoes de integracoes

### 2.2 Vendedor

Permissoes:

- acessar apenas seus clientes
- criar pedidos
- consultar catalogo de produtos
- visualizar produtos novos da semana
- acompanhar suas vendas, parcelas e comissoes
- pesquisar novos pet shops para prospeccao
- enviar pedidos e novidades via WhatsApp

### 2.3 Parceiro de producao

Permissoes:

- visualizar ordens de producao vinculadas a ele
- consultar produtos com foto e detalhes de fabricacao
- atualizar status de entrega, quando permitido
- acessar chat interno
- consultar pagamentos de producao

## 3. Dashboard principal

Indicadores principais:

- faturamento do mes
- lucro do mes
- pedidos em andamento
- producao em andamento
- clientes novos
- produtos mais vendidos
- contas a receber
- contas a pagar

Filtros sugeridos:

- hoje
- semana
- mes
- periodo personalizado
- por vendedor

## 4. Modulos do sistema

### 4.1 Login e seguranca

Funcoes:

- login por email ou usuario e senha
- redefinicao de senha
- controle de sessao
- auditoria basica de acesso
- permissao por perfil

Regras:

- cada usuario visualiza somente os menus autorizados
- vendedores veem apenas clientes, pedidos e comissoes vinculados a eles
- parceiros de producao nao acessam dados financeiros gerais

### 4.2 Cadastro de materia-prima

Campos:

- nome da materia-prima
- descricao
- fornecedor
- data de compra
- valor da compra
- quantidade comprada
- unidade de medida

Calculo automatico:

- custo unitario = valor da compra / quantidade comprada

Regras:

- nao permitir quantidade zero
- manter historico de compras por materia-prima
- permitir materias-primas ativas e inativas

### 4.3 Categorias de produtos

Categorias iniciais:

- Gravatas
- Bandanas
- Gargantilhas
- Adesivos
- Lacos
- Caminhas

Regras:

- permitir criar novas categorias
- permitir ativar e desativar categorias

### 4.4 Cadastro de produtos

Campos:

- nome do produto
- categoria
- foto do produto
- medidas
- descricao
- status

Composicao:

- listar materias-primas cadastradas
- selecionar quais materias-primas fazem parte do produto
- informar quantidade usada de cada item

Calculos automaticos:

- custo de producao = soma do custo unitario de cada materia-prima consumida
- preco sugerido de venda = custo de producao x fator de markup configuravel
- margem de lucro = ((preco sugerido - custo de producao) / preco sugerido) x 100

Regras:

- permitir atualizar a composicao sem perder historico
- exibir foto principal no catalogo e em pedidos
- permitir multiplas fotos no futuro

### 4.5 Catalogo de produtos

Exibir:

- foto do produto
- descricao
- preco sugerido

Automacoes desejadas:

- tratamento de imagem para fundo branco
- melhoria de iluminacao
- geracao de imagem promocional com caes usando o produto

Observacao tecnica:

- essas funcoes dependem de integracao com servicos de IA ou edicao de imagem
- recomendacao: deixar o cadastro de produto pronto para armazenar imagem original, imagem tratada e imagem promocional

### 4.6 Cadastro de clientes

Campos:

- nome do pet shop
- nome do responsavel
- telefone
- whatsapp
- endereco completo
- cidade
- vendedor responsavel

Funcoes:

- botao de abrir conversa no WhatsApp
- historico de pedidos
- historico financeiro
- status do cliente

Regras:

- cliente fica vinculado a um vendedor
- administrador pode reatribuir clientes

### 4.7 Sistema de pedidos

Campos do pedido:

- cliente
- vendedor
- data do pedido
- status
- observacoes

Itens do pedido:

- produto
- quantidade
- preco unitario
- subtotal

Totais:

- subtotal geral
- desconto
- frete
- valor total

Funcoes:

- busca por nome
- busca por categoria
- identificacao do produto por foto

Observacao tecnica:

- identificacao por foto depende de integracao futura com visao computacional

Status sugeridos:

- rascunho
- enviado
- aprovado
- em producao
- pronto
- entregue
- cancelado

### 4.8 Pagamento parcelado

Campos:

- valor total
- quantidade de parcelas
- intervalo entre parcelas
- data da primeira parcela

Geracao automatica:

- criar todas as parcelas com numero, valor e vencimento

Status da parcela:

- pendente
- paga
- atrasada

Regras:

- considerar atrasada quando vencimento for menor que a data atual e status ainda for pendente
- permitir baixa manual ou automatica quando houver integracao de pagamento

### 4.9 Envio automatico do pedido pelo WhatsApp

Botao:

- Enviar pedido ao cliente

Conteudo automatico:

- nome do cliente
- lista de produtos
- quantidades
- valor total
- parcelas
- datas de pagamento

Observacao tecnica:

- o envio automatico exige integracao com API oficial do WhatsApp ou plataforma parceira
- na primeira versao, pode ser gerado um texto pronto com link para envio rapido

### 4.10 Cadastro de vendedores

Campos:

- nome
- telefone
- whatsapp
- codigo de referencia
- porcentagem de comissao
- login

Regras:

- cada vendedor possui acesso proprio
- clientes ficam vinculados ao vendedor
- comissao padrao pode ser configurada por vendedor

### 4.11 Sistema de comissao

Percentuais comuns:

- 6%
- 8%
- 10%
- 12%

Regra principal:

- comissao somente liberada quando a parcela do cliente for paga

Calculo:

- comissao por pedido ou parcela, conforme politica definida
- valor de comissao = valor recebido x percentual do vendedor

Status sugeridos:

- aguardando pagamento do cliente
- disponivel para liberar
- paga

### 4.12 Parceiros de producao

Campos:

- nome
- telefone
- whatsapp
- valor pago por peca
- forma de pagamento

Formas de pagamento:

- 15 dias
- 30 dias
- por lote

### 4.13 Controle de producao

Campos:

- parceiro
- produto
- foto do produto
- quantidade enviada
- valor por peca
- data de envio
- data de entrega
- data de pagamento
- status

Calculo automatico:

- valor total da producao = quantidade enviada x valor por peca

Status sugeridos:

- enviada
- em producao
- entregue
- paga

### 4.14 Chat interno

Participantes:

- administrador
- vendedores
- parceiros de producao

Recursos:

- mensagens de texto
- fotos
- videos
- arquivos
- conversas individuais e por grupo

Observacao tecnica:

- ideal implementar inicialmente como chat simples interno com anexos
- notificacoes em tempo real podem entrar na segunda fase

### 4.15 Controle financeiro

Modulos:

- contas a receber
- contas a pagar
- fluxo de caixa

Relatorios:

- lucro por produto
- lucro por cliente
- lucro por vendedor

Regras:

- contas a receber devem ser alimentadas por pedidos e parcelas
- contas a pagar devem considerar compras, producao, comissoes e despesas gerais
- lucro deve considerar receita recebida menos custos e despesas

### 4.16 Cobranca automatica

Configuracoes:

- diaria
- semanal
- mensal

Destinatarios:

- cliente
- vendedor
- ambos

Observacao tecnica:

- integrar com WhatsApp para envio automatico
- manter historico de cobrancas enviadas

### 4.17 Prospeccao de clientes

Campos de busca:

- palavra-chave
- cidade
- raio de busca

Dados exibidos:

- nome da empresa
- endereco
- telefone
- botao WhatsApp

Acoes:

- salvar como prospect
- converter em cliente

Observacao tecnica:

- depende de integracao com Google Maps Places API

### 4.18 Mapa de clientes

Exibir no mapa:

- clientes cadastrados
- empresas ainda nao cadastradas

Filtros:

- por cidade
- por vendedor
- por status

### 4.19 CRM de vendas

Area:

- Novos produtos da semana

Regras:

- listar automaticamente produtos cadastrados recentemente
- permitir envio rapido pelo WhatsApp para clientes
- registrar historico de envio por vendedor

### 4.20 Relatorios

Relatorios obrigatorios:

- vendas por vendedor
- vendas por produto
- clientes que mais compram
- produtos mais vendidos
- lucro mensal
- ranking de vendedores

Filtros recomendados:

- por periodo
- por vendedor
- por cidade
- por categoria

## 5. Estrutura sugerida de menus

### Administrador

- Dashboard
- Usuarios
- Vendedores
- Parceiros de producao
- Materias-primas
- Categorias
- Produtos
- Catalogo
- Clientes
- Pedidos
- Producao
- Financeiro
- Cobrancas
- CRM
- Prospeccao
- Mapa
- Relatorios
- Chat
- Configuracoes

### Vendedor

- Dashboard
- Catalogo
- Clientes
- Pedidos
- Minhas comissoes
- Novos produtos da semana
- Prospeccao
- Mapa
- Chat

### Parceiro de producao

- Dashboard simplificado
- Minhas producoes
- Meus pagamentos
- Chat

## 6. Entidades principais do banco de dados

### Usuarios

- id
- nome
- email
- senha_hash
- perfil
- ativo
- created_at
- updated_at

### Vendedores

- id
- usuario_id
- telefone
- whatsapp
- codigo_referencia
- percentual_comissao

### Parceiros_producao

- id
- usuario_id
- telefone
- whatsapp
- valor_padrao_por_peca
- forma_pagamento

### Clientes

- id
- nome_pet_shop
- nome_responsavel
- telefone
- whatsapp
- endereco_completo
- cidade
- vendedor_id
- status

### Fornecedores

- id
- nome
- telefone
- whatsapp
- observacoes

### Materias_primas

- id
- nome
- descricao
- fornecedor_id
- unidade_medida
- ativo

### Compras_materia_prima

- id
- materia_prima_id
- data_compra
- valor_compra
- quantidade_comprada
- custo_unitario

### Categorias

- id
- nome
- ativa

### Produtos

- id
- nome
- categoria_id
- foto_principal
- medidas
- descricao
- custo_producao
- preco_sugerido
- margem_lucro
- ativo
- created_at

### Produto_materias_primas

- id
- produto_id
- materia_prima_id
- quantidade_usada
- custo_calculado

### Pedidos

- id
- cliente_id
- vendedor_id
- data_pedido
- status
- subtotal
- desconto
- frete
- valor_total
- observacoes

### Pedido_itens

- id
- pedido_id
- produto_id
- quantidade
- preco_unitario
- subtotal

### Parcelas

- id
- pedido_id
- numero_parcela
- valor
- data_vencimento
- data_pagamento
- status

### Comissoes

- id
- pedido_id
- parcela_id
- vendedor_id
- percentual
- valor_comissao
- status
- data_liberacao
- data_pagamento

### Producoes

- id
- parceiro_id
- produto_id
- quantidade_enviada
- valor_por_peca
- valor_total
- data_envio
- data_entrega
- data_pagamento
- status

### Contas_receber

- id
- cliente_id
- pedido_id
- parcela_id
- descricao
- valor
- vencimento
- pagamento_em
- status

### Contas_pagar

- id
- tipo
- referencia_id
- descricao
- valor
- vencimento
- pagamento_em
- status

### Mensagens_chat

- id
- remetente_usuario_id
- destinatario_usuario_id
- grupo_id
- tipo_conteudo
- conteudo
- arquivo_url
- created_at

## 7. Regras de negocio mais importantes

- custo unitario da materia-prima deve ser recalculado a cada nova compra
- custo do produto deve considerar a composicao cadastrada
- preco sugerido deve ser configuravel pelo administrador
- pedidos parcelados devem gerar parcelas automaticamente
- contas a receber devem nascer do pedido
- comissao somente pode ficar disponivel apos pagamento confirmado
- producao deve gerar contas a pagar para parceiro quando aplicavel
- cobrancas automaticas devem respeitar a configuracao de frequencia
- vendedores so podem visualizar seus proprios dados, exceto quando houver permissao adicional

## 8. Integracoes recomendadas

- WhatsApp Business API ou plataforma terceirizada
- Google Maps Places API para prospeccao
- servico de mapas para geolocalizacao de clientes
- servico de tratamento e geracao de imagens com IA

## 9. Sugestao de tecnologia

Para uma primeira versao moderna, rapida e facil de manter:

- frontend: React com Next.js
- backend: Next.js API ou NestJS
- banco de dados: PostgreSQL
- autenticacao: Auth.js ou JWT com controle de perfil
- armazenamento de imagens: Cloudinary ou Supabase Storage
- tempo real para chat: Pusher, Ably ou Supabase Realtime
- deploy: Vercel para app e Neon/Supabase para banco

## 10. Prioridade de entrega

### Fase 1 - Operacao basica

- login e perfis
- dashboard inicial
- materias-primas
- categorias
- produtos
- clientes
- vendedores
- pedidos
- parcelamento
- contas a receber

### Fase 2 - Operacao completa

- comissoes
- parceiros de producao
- controle de producao
- contas a pagar
- fluxo de caixa
- relatorios principais

### Fase 3 - Automacoes e expansao

- WhatsApp automatizado
- cobranca automatica
- chat interno
- prospeccao Google Maps
- mapa de clientes
- tratamento de imagens
- geracao de imagens promocionais

## 11. Indicadores recomendados no dashboard

- faturamento recebido no mes
- lucro realizado no mes
- pedidos abertos
- pedidos atrasados
- producoes em aberto
- total a receber vencido
- total a pagar no periodo
- novos clientes no mes
- top 5 produtos
- top 5 vendedores

## 12. Experiencia de uso esperada

Principios:

- telas simples
- botoes claros
- foco em uso no celular e computador
- atalhos para WhatsApp
- fotos como apoio na venda e na producao
- poucos cliques para criar pedido

## 13. Ponto de atencao

As funcionalidades abaixo exigem integracoes externas e devem ser planejadas desde o inicio:

- envio automatico de mensagens pelo WhatsApp
- cobranca automatica
- busca de empresas no Google Maps
- reconhecimento de produto por foto
- tratamento e geracao automatica de imagens
