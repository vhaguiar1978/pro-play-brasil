# PADRAO_FRONTEND_PROPLAY.md

## Objetivo do Documento

Este documento define o padrao completo de frontend do Pro Play Brasil para interfaces publicas, areas logadas, modulos administrativos, paginas de campeonato, paginas de jogos, perfis, fluxos de inscricao e experiencias de transmissao. Ele deve ser seguido em todo desenvolvimento futuro.

## Visao de Produto

O Pro Play Brasil e uma plataforma de campeonatos online de games. O frontend deve posicionar o produto como uma marca forte, moderna e premium, com aparencia competitiva e experiencia confiavel para jogadores, times, organizadores e administradores.

O sistema precisa combinar:

- Energia visual do universo gamer
- Sofisticacao de SaaS premium
- Clareza operacional de plataforma administrativa
- Estrategias de conversao de landing pages modernas

## Pilares de Design

### 1. Gamer Premium

A interface deve transmitir:

- Competicao
- Performance
- Prestigio
- Tecnologia
- Movimento
- Comunidade

Evitar qualquer visual que remeta a produto generico, template barato ou painel corporativo sem personalidade.

### 2. Profissionalismo

Mesmo com identidade gamer, o produto deve parecer confiavel para pagamentos, inscricoes, premiacoes e administracao de campeonatos.

### 3. Conversao

Toda interface publica deve reduzir duvida e aumentar a chance de acao. O usuario precisa entender rapidamente:

- O que a plataforma oferece
- Como participar
- Quais campeonatos existem
- Qual jogo escolher
- Quanto custa
- Onde se inscrever
- Como acompanhar resultados

### 4. Clareza

Layouts ricos visualmente nao podem sacrificar compreensao. Informacao importante deve aparecer com hierarquia clara.

### 5. Escalabilidade

O frontend deve ser pensado para crescimento do produto, novos jogos, novos tipos de campeonatos, novos patrocinadores, novas funcionalidades e novas campanhas.

## Direcao Visual

### Estilo desejado

Combinar estes atributos:

- Visual gamer contemporaneo
- Acabamento premium
- Alto contraste com refinamento
- Blocos com profundidade
- Tipografia marcante
- Destaques energicos
- Componentes com ritmo visual forte

### Sensacoes que a interface deve passar

- "Este campeonato parece serio"
- "Esta plataforma e moderna"
- "Eu confio para pagar e participar"
- "Quero me inscrever"
- "Quero acompanhar os jogos"
- "Parece um produto de alto nivel"

## Direcao de Cores

As cores devem ser definidas como sistema, nunca aleatoriamente.

### Estrutura recomendada

- Cor base escura ou neutra profunda para reforcar universo gamer premium
- Cor principal vibrante para identidade e CTAs
- Cor secundaria para contraste e areas de apoio
- Cores de status bem definidas para sucesso, alerta, erro, ao vivo, inscricoes abertas, encerrado e pendente

### Regras de uso

- CTA principal deve ter cor forte e imediatamente identificavel
- Destaques de campeonato, ranking e premiacao precisam ser visualmente superiores
- O contraste deve manter excelente legibilidade
- Fundos nao devem ser chapados e sem profundidade quando a experiencia pede mais impacto

### Texturas e atmosfera

Usar com moderacao:

- Gradientes
- Brilhos sutis
- Bordas luminosas discretas
- Camadas com transparencia
- Elementos de atmosfera ligados a arena, energia e competicao

Sem exageros que prejudiquem legibilidade ou performance.

## Tipografia

### Objetivo

A tipografia deve equilibrar:

- Impacto visual
- Leitura rapida
- Aparencia premium
- Identidade competitiva

### Regras

- Headlines precisam ter presenca
- Textos operacionais devem priorizar clareza
- Numeros de ranking, premiacao, contagem e estatisticas devem receber destaque especial
- Evitar combinacoes tipograficas sem criterio
- Criar escala consistente de titulos, subtitulos, corpo, labels e microtextos

## Iconografia e Ilustracao

### Icones

- Devem ser modernos, consistentes e limpos
- Precisam apoiar escaneabilidade
- Devem reforcar competitividade, resultados, premiacoes, transmissoes e administracao

### Ilustracoes e elementos graficos

- Usar apenas quando agregarem percepcao de marca
- Priorizar composicoes abstratas, frames, grades, overlays e elementos inspirados em interfaces de e-sports
- Nao usar ilustracoes infantis, amadoras ou fora do contexto gamer premium

## Motion e Microinteracoes

Animacoes devem apoiar sensacao de produto moderno, sem virar excesso.

Usar quando fizer sentido:

- Entrada suave de secoes
- Hover com resposta premium
- Destaque de cards selecionados
- Transicoes de abas
- Feedback visual para inscricao, pagamento e envio de resultado
- Estados de carregamento bem desenhados

Evitar:

- Efeitos pesados
- Animacoes sem funcao
- Lentidao em acoes primarias

## Estrutura de Layout

### Regras gerais

- Construir layouts com grid consistente
- Usar espacamento padronizado
- Criar hierarquia clara entre topo, conteudo principal, laterais, cards e rodape
- Garantir leitura fluida em mobile antes de expandir para desktop

### Densidade visual

O sistema pode ser rico visualmente, mas deve manter organizacao. O usuario precisa localizar rapido:

- CTA
- Status do campeonato
- Proximos jogos
- Pagamento
- Classificacao
- Chaveamento
- Perfil
- Resultados
- Transmissao

## Responsividade

## Regra principal

Mobile e prioridade absoluta.

### Mobile

Toda tela precisa:

- Carregar bem
- Manter foco nas informacoes principais
- Ter botoes confortaveis para toque
- Evitar blocos apertados
- Reorganizar grids de forma inteligente
- Preservar CTA principal acima da dobra quando estrategico

### Tablet

- Aproveitar espaco extra sem parecer desktop comprimido
- Ajustar colunas, tabelas, cards e filtros

### Desktop

- Explorar mais profundidade visual
- Dar espaco para dashboards, rankings, tabelas e modulos secundarios
- Aproveitar areas laterais quando houver ganho real de UX

## Padrões de Componentes

Todo componente deve ser reutilizavel, consistente e escalavel.

### Componentes obrigatorios de alta qualidade

- Hero sections
- Cards de campeonato
- Cards de jogo
- Cards de ranking
- Tabelas responsivas
- Chaveamento
- Barras de status
- Banners promocionais
- Blocos de premiacao
- CTA sections
- Formularios
- Steps de inscricao
- Alertas e notificacoes
- Modais
- Tabs
- Accordions
- Avatares e badges
- Empty states
- Skeleton loaders

### Regras

- Todo estado precisa ser desenhado: normal, hover, ativo, loading, vazio, erro, sucesso, bloqueado
- Componentes devem aceitar reutilizacao sem gambiarra
- Variantes devem ser planejadas
- Labels, espacamentos e hierarquia devem ser consistentes

## Landing Pages

As landing pages do Pro Play Brasil devem combinar branding, prova, clareza e conversao.

### Estrutura recomendada

- Hero forte com proposta clara
- CTA principal direto
- Prova de valor da plataforma
- Jogos disponiveis
- Campeonatos em destaque
- Beneficios para jogadores e times
- Explicacao simples de como funciona
- Prova social ou indicios de confianca
- FAQ estrategico
- CTA final forte

### Regras de conversao

- Headline precisa comunicar beneficio
- Subheadline precisa remover duvida
- CTA precisa ser visivel e repetido com inteligencia
- Formularios devem pedir o minimo necessario
- Blocos devem responder objecoes reais

### O que evitar

- Hero fraco
- Texto genrico
- Excesso de informacao acima da dobra
- Layout sem ritmo
- CTA escondido

## Paginas de Jogos

Cada jogo deve ter pagina propria com identidade adaptada, sem perder coerencia com a marca principal.

### O que deve conter

- Banner premium do jogo
- Campeonatos ativos
- Informacoes da modalidade
- Regras resumidas
- Ranking relacionado
- Times ou jogadores em destaque
- CTA para participar

### Regras

- Adaptar atmosfera visual por jogo
- Nao quebrar padrao global da plataforma
- Usar variacoes de cor, imagem e textura com controle

## Paginas de Campeonato

Estas paginas sao centrais para o negocio e devem parecer eventos premium.

### Blocos essenciais

- Header com nome, jogo, status e destaque visual
- CTA de inscricao
- Valor de entrada
- Premiacao
- Datas
- Regulamento
- Participantes
- Formato do campeonato
- Tabela de classificacao
- Chaveamento
- Agenda ou cronograma
- Area de transmissao
- Resultados

### Prioridades de UX

- Usuario precisa entender o campeonato em segundos
- Inscricao deve estar sempre acessivel
- Informacoes criticas nao podem ficar escondidas
- Chaveamento e classificacao precisam ser legiveis no mobile

## Painel Administrativo

O painel precisa ser eficiente, premium e claro.

### Objetivos do admin

- Gerenciar campeonatos
- Aprovar ou acompanhar pagamentos
- Editar informacoes
- Montar chaveamentos
- Acompanhar resultados
- Validar uploads
- Gerir premiacoes
- Emitir certificados

### Caracteristicas obrigatorias

- Navegacao objetiva
- Visao resumida com metricas importantes
- Tabelas claras e filtraveis
- Formularios consistentes
- Feedback de acao confiavel
- Estados vazios bem orientados
- Menor numero possivel de passos para tarefas recorrentes

### UX do admin

- Menos decoracao e mais eficiencia
- Ainda assim manter acabamento premium
- Priorizar leitura, filtros, busca, status e produtividade

## Perfis de Jogador e Time

Perfis devem parecer paginas competitivas, nao cadastros secos.

### Jogador

- Avatar
- Nickname
- Jogo principal
- Estatisticas
- Historico
- Titulos
- Ranking
- Campeonatos disputados
- Medalhas, badges ou destaques

### Time

- Logo
- Nome
- Jogadores
- Historico
- Conquistas
- Ranking
- Campeonatos em andamento

### Regra visual

Perfis devem ter identidade, senso de progressao e orgulho competitivo.

## Pagamentos e Inscricao

Fluxos de pagamento precisam ser claros, seguros e simples.

### Regras

- Destacar preco, taxa, forma de pagamento e status
- Minimizar friccao
- Reforcar confianca
- Informar confirmacoes com clareza
- Exibir passos da inscricao
- Reduzir abandono

### UX desejada

- CTA forte
- Feedback imediato
- Status visual claro: pendente, aprovado, recusado, expirado

## Classificacao, Ranking e Chaveamento

Esses modulos sao nucleos da experiencia competitiva.

### Devem ser

- Faceis de entender
- Bonitos
- Escaneaveis
- Responsivos
- Compatíveis com mobile

### Regras de desenho

- Posicoes com destaque visual
- Pontuacoes e saldo com boa leitura
- Top 3 com tratamento especial quando fizer sentido
- Chaveamento com boa navegacao no celular
- Possibilidade de colapso, scroll controlado ou visual adaptado no mobile

## Area de Transmissao

### Deve incluir

- Destaque para status ao vivo
- Player ou embed bem encaixado
- Links para Twitch e YouTube
- Informacoes da partida
- Chamadas para acompanhar ou compartilhar

### Objetivo

Transformar acompanhamento em experiencia envolvente e nao apenas funcional.

## Certificados e Premiacao

### Premiacao

- Destacar valores, recompensas e beneficios
- Exibir de forma aspiracional

### Certificados

- Precisam parecer conquistas de valor
- Devem seguir linha visual premium

## Acessibilidade e Qualidade

Mesmo com apelo visual forte, o sistema deve manter:

- Contraste adequado
- Texto legivel
- Hierarquia clara
- Navegacao previsivel
- Componentes utilizaveis em toque
- Estados bem definidos

## Performance

Experiencia premium tambem depende de velocidade.

### Regras

- Evitar excesso de assets pesados
- Carregar o essencial primeiro
- Usar componentes eficientes
- Minimizar travamentos em mobile
- Manter fluidez em tabelas e listas

## Estrategia de Conteudo

A comunicacao visual e textual precisa falar com jogadores, times e organizadores.

### Tom esperado

- Forte
- Claro
- Atual
- Competitivo
- Profissional

### Evitar

- Textos vagos
- Jargoes confusos
- Copys frias demais
- Conteudo sem apelo para acao

## Referencias Visuais

Buscar referencias em categorias como:

- Plataformas modernas de e-sports
- Sites de eventos competitivos
- Dashboards SaaS premium
- Landing pages de alta conversao
- Paginas modernas de torneios
- Experiencias de streaming e comunidade gamer

Usar referencias apenas para estudar:

- Composicao
- Hierarquia
- Ritmo
- Conversao
- Design system
- Experiencia premium

Nunca copiar:

- Layout
- Texto
- Marca
- Arte
- Ilustracao
- Codigo

## Inovacao Obrigatoria

Sempre que houver oportunidade, propor elementos que elevem o nivel do produto, como:

- Cards mais inteligentes
- Blocos interativos de campeonato
- Melhor visualizacao de ranking
- Navegacao mais rapida
- Experiencias ao vivo mais envolventes
- Dashboards mais claros
- Areas promocionais mais persuasivas
- Melhor prova de confianca

O padrao do projeto e sempre evoluir alem do basico.

## Checklist Obrigatorio Antes de Entregar Qualquer Frontend

1. A interface parece um produto gamer premium?
2. O visual esta moderno e profissional?
3. A tela foge do generico?
4. O mobile foi realmente priorizado?
5. A hierarquia visual esta clara?
6. Existe foco em conversao quando necessario?
7. Os componentes estao consistentes e reutilizaveis?
8. O layout esta pronto para producao?
9. A experiencia parece superior a uma solucao comum?
10. Houve preocupacao real com escalabilidade, UX e performance?

## Regra Final

Nenhuma tela do Pro Play Brasil deve ser criada apenas para "funcionar". Toda entrega precisa unir estetica premium, estrategia de conversao, UX moderna, responsividade real, estrutura escalavel e identidade forte de plataforma de campeonatos online.
