export type GameStatus = "draft" | "hidden" | "visible_locked" | "active";

export type GameChampion = {
  season: string;
  name: string;
  title: string;
};

export type Game = {
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  themeColor: string;
  status: GameStatus;
  coverClassName: string;
  coverImage: string;
  heroImage: string;
  gallery: string[];
  rules: string[];
  champions: GameChampion[];
};

const LOCAL = (slug: string, file: string) => `/games/${slug}/${file}`;

export const GAMES: Game[] = [
  {
    slug: "fifa",
    name: "FIFA / EA SPORTS FC",
    shortDescription: "Futebol virtual com foco em x1, Pro Clubs e ligas competitivas.",
    fullDescription:
      "Hub oficial para campeonatos de futebol virtual da Pro Play Brasil, com eventos em x1, Pro Clubs, ranking premium e estrutura profissional para competicao real.",
    heroTitle: "Futebol virtual com operacao profissional",
    heroSubtitle: "Do x1 ao Pro Clubs, tudo em um hub premium para clubes, jogadores e campeonatos oficiais.",
    themeColor: "#FF6A00",
    status: "active",
    coverClassName:
      "bg-[radial-gradient(circle_at_top_left,_rgba(255,106,0,0.38),_transparent_28%),linear-gradient(120deg,_rgba(255,255,255,0.08),_transparent_30%),linear-gradient(135deg,_#251507_0%,_#0B0B0B_56%,_#141414_100%)]",
    coverImage: LOCAL("fifa", "cover.jpg"),
    heroImage: LOCAL("fifa", "hero.jpg"),
    gallery: [
      LOCAL("fifa", "gallery1.jpg"),
      LOCAL("fifa", "gallery2.jpg"),
      LOCAL("fifa", "gallery3.jpg"),
      LOCAL("fifa", "hero.jpg")
    ],
    rules: [
      "Check-in obrigatorio antes do horario oficial da rodada.",
      "Capitao responsavel por confirmar elenco e plataforma.",
      "Envio de resultado dentro do prazo da partida com print quando solicitado."
    ],
    champions: [
      { season: "Season 03", name: "BRZ Elite", title: "Campeao nacional Pro Clubs" },
      { season: "Season 02", name: "Noia FC", title: "Campeao x1 premium" }
    ]
  },
  {
    slug: "free-fire",
    name: "Free Fire",
    shortDescription: "Campeonatos squad e torneios de comunidade com foco mobile.",
    fullDescription:
      "Estrutura oficial para squads de Free Fire com inscricao organizada, ranking por modalidade e espaco dedicado para operacao de eventos mobile.",
    heroTitle: "A arena mobile com leitura rapida e operacao limpa",
    heroSubtitle: "Squads, classificatorias e eventos especiais em uma pagina propria do jogo.",
    themeColor: "#FF8C3A",
    status: "active",
    coverClassName:
      "bg-[radial-gradient(circle_at_top_left,_rgba(255,140,58,0.35),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.08),_transparent_25%),linear-gradient(135deg,_#2A1408_0%,_#0B0B0B_60%,_#121212_100%)]",
    coverImage: LOCAL("free-fire", "cover.jpg"),
    heroImage: LOCAL("free-fire", "cover.jpg"),
    gallery: [
      LOCAL("free-fire", "cover.jpg")
    ],
    rules: [
      "Sala liberada somente para lineups confirmadas na inscricao.",
      "Pontuacao segue o formato oficial do campeonato vigente.",
      "Desconexao e revisão sao tratadas pelo painel administrativo."
    ],
    champions: [{ season: "Open Series", name: "Squad Laranja", title: "Campeao squad aberto" }]
  },
  {
    slug: "call-of-duty",
    name: "Call of Duty",
    shortDescription: "Hub competitivo para lineups taticas e series eliminatorias.",
    fullDescription:
      "Pagina da modalidade Call of Duty preparada para eventos competitivos, regras proprias e centralizacao de campeonatos quando o jogo estiver ativo.",
    heroTitle: "Modalidade visivel, liberacao operacional em breve",
    heroSubtitle: "A estrutura do jogo ja esta pronta no Pro Play Brasil, aguardando abertura oficial para participacao.",
    themeColor: "#FF6A00",
    status: "visible_locked",
    coverClassName:
      "bg-[radial-gradient(circle_at_top_right,_rgba(255,106,0,0.30),_transparent_28%),linear-gradient(135deg,_#24120B_0%,_#0B0B0B_60%,_#141414_100%)]",
    coverImage: LOCAL("call-of-duty", "cover.jpg"),
    heroImage: LOCAL("call-of-duty", "hero.jpg"),
    gallery: [
      LOCAL("call-of-duty", "gallery1.jpg"),
      LOCAL("call-of-duty", "gallery2.jpg"),
      LOCAL("call-of-duty", "gallery3.jpg"),
      LOCAL("call-of-duty", "hero.jpg")
    ],
    rules: [
      "Inscricoes ainda nao estao liberadas para a modalidade.",
      "O hub sera ativado quando o calendario oficial do jogo abrir.",
      "A pagina publica ja serve como ponto de comunicacao da modalidade."
    ],
    champions: []
  },
  {
    slug: "pubg",
    name: "PUBG",
    shortDescription: "Pagina dedicada para o competitivo tatico de battle royale.",
    fullDescription:
      "Hub preparado para campeonatos de PUBG com acompanhamento por modalidade, historico de campeoes e gerenciamento por status operacional.",
    heroTitle: "Battle royale preparado para abrir com autoridade",
    heroSubtitle: "Visual premium, regras prontas e estrutura para quando as inscricoes forem liberadas.",
    themeColor: "#FF8C3A",
    status: "visible_locked",
    coverClassName:
      "bg-[radial-gradient(circle_at_center,_rgba(255,140,58,0.24),_transparent_24%),linear-gradient(135deg,_#1F1208_0%,_#0B0B0B_65%,_#101010_100%)]",
    coverImage: LOCAL("pubg", "cover.jpg"),
    heroImage: LOCAL("pubg", "hero.jpg"),
    gallery: [
      LOCAL("pubg", "gallery1.jpg"),
      LOCAL("pubg", "gallery2.jpg"),
      LOCAL("pubg", "gallery3.jpg"),
      LOCAL("pubg", "hero.jpg")
    ],
    rules: [
      "Modalidade publica e visivel no site.",
      "Cadastro e criacao de time ficam bloqueados ate a abertura oficial.",
      "Quando ativa, a pagina passa a aceitar inscricoes e ranking."
    ],
    champions: []
  },
  {
    slug: "valorant",
    name: "Valorant",
    shortDescription: "FPS tatico 5v5 com ranking por lineup e competicao estruturada.",
    fullDescription:
      "Hub oficial de Valorant com torneios ativos, historico de campeoes, estrutura de bracket premium e central para operacao de times.",
    heroTitle: "Competicao taticamente organizada para lineups de alto nivel",
    heroSubtitle: "Series eliminatorias, ranking por modalidade e experencia premium para equipe competitiva.",
    themeColor: "#FF6A00",
    status: "active",
    coverClassName:
      "bg-[radial-gradient(circle_at_top_left,_rgba(255,106,0,0.28),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.08),_transparent_22%),linear-gradient(135deg,_#28110B_0%,_#0B0B0B_60%,_#151515_100%)]",
    coverImage: LOCAL("valorant", "gameplay.jpg"),
    heroImage: LOCAL("valorant", "gameplay.jpg"),
    gallery: [
      LOCAL("valorant", "gameplay.jpg")
    ],
    rules: [
      "Lineup travada apos o fechamento das inscricoes.",
      "Confrontos seguem o calendario oficial do campeonato.",
      "Resultado aprovado atualiza tabela e rodada automaticamente."
    ],
    champions: [
      { season: "Masters Beta", name: "Neon Wolves", title: "Campeao da primeira etapa" }
    ]
  },
  {
    slug: "counter-strike-2",
    name: "Counter-Strike 2",
    shortDescription: "Operacao de lineups, ligas e chaveamentos para o cenario competitivo.",
    fullDescription:
      "Pagina dedicada ao CS2 com leitura profissional de campeonatos, ranking por jogo e experiencia preparada para times competitivos.",
    heroTitle: "A casa das lineups de CS2 no Pro Play Brasil",
    heroSubtitle: "Ligas, mata-mata e operacao premium para partidas de alto nivel.",
    themeColor: "#FF8C3A",
    status: "active",
    coverClassName:
      "bg-[radial-gradient(circle_at_top_right,_rgba(255,140,58,0.30),_transparent_28%),linear-gradient(135deg,_#29130A_0%,_#0B0B0B_58%,_#151515_100%)]",
    coverImage: LOCAL("counter-strike-2", "cover.jpg"),
    heroImage: LOCAL("counter-strike-2", "hero.jpg"),
    gallery: [
      LOCAL("counter-strike-2", "gallery1.jpg"),
      LOCAL("counter-strike-2", "gallery2.jpg"),
      LOCAL("counter-strike-2", "gallery3.jpg"),
      LOCAL("counter-strike-2", "hero.jpg")
    ],
    rules: [
      "Capitao valida lineup antes do inicio da serie.",
      "Partidas podem ser remarcadas somente com aprovacao administrativa.",
      "Envio de resultado passa por revisao quando houver conflito."
    ],
    champions: [{ season: "Prime League", name: "Crosshair Prime", title: "Campeao da liga principal" }]
  }
];

export function getGameBySlug(slug: string): Game | undefined {
  return GAMES.find((game) => game.slug === slug);
}

export function getVisibleGames() {
  return GAMES.filter((game) => game.status === "active" || game.status === "visible_locked");
}
