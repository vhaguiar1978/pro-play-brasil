export type MockRankingEntry = {
  pos: number;
  nick: string;
  pts: number;
  wins: number;
  city: string;
  uf: string;
};

const MOCK_RANKINGS_BY_GAME: Record<string, MockRankingEntry[]> = {
  fifa: [
    { pos: 1, nick: "BRZ_Kaique", pts: 1840, wins: 42, city: "Sao Paulo", uf: "SP" },
    { pos: 2, nick: "NoiaFC", pts: 1792, wins: 39, city: "Curitiba", uf: "PR" },
    { pos: 3, nick: "ZikaRJ", pts: 1755, wins: 37, city: "Rio de Janeiro", uf: "RJ" },
    { pos: 4, nick: "GauchoGK", pts: 1688, wins: 35, city: "Porto Alegre", uf: "RS" },
    { pos: 5, nick: "NordestePro", pts: 1640, wins: 33, city: "Recife", uf: "PE" }
  ],
  "free-fire": [
    { pos: 1, nick: "Squad Laranja", pts: 2120, wins: 28, city: "Manaus", uf: "AM" },
    { pos: 2, nick: "Alpha Rush", pts: 2084, wins: 26, city: "Belem", uf: "PA" },
    { pos: 3, nick: "Fenix 7", pts: 1992, wins: 24, city: "Salvador", uf: "BA" },
    { pos: 4, nick: "PulseFire", pts: 1918, wins: 23, city: "Fortaleza", uf: "CE" },
    { pos: 5, nick: "Meta Squad", pts: 1874, wins: 21, city: "Goiania", uf: "GO" }
  ],
  "call-of-duty": [
    { pos: 1, nick: "WarHouse", pts: 1680, wins: 18, city: "Brasilia", uf: "DF" },
    { pos: 2, nick: "Delta Five", pts: 1645, wins: 17, city: "Santos", uf: "SP" },
    { pos: 3, nick: "Hardpoint", pts: 1602, wins: 16, city: "Vitoria", uf: "ES" }
  ],
  pubg: [
    { pos: 1, nick: "Sky Drop", pts: 1710, wins: 14, city: "Natal", uf: "RN" },
    { pos: 2, nick: "Gas Zone", pts: 1674, wins: 13, city: "Maceio", uf: "AL" },
    { pos: 3, nick: "Scope Team", pts: 1598, wins: 12, city: "Joao Pessoa", uf: "PB" }
  ],
  valorant: [
    { pos: 1, nick: "AlineVibe", pts: 2015, wins: 58, city: "Campinas", uf: "SP" },
    { pos: 2, nick: "Brnox", pts: 1978, wins: 55, city: "Belo Horizonte", uf: "MG" },
    { pos: 3, nick: "NeonWolves", pts: 1896, wins: 51, city: "Fortaleza", uf: "CE" },
    { pos: 4, nick: "RazeSul", pts: 1812, wins: 47, city: "Florianopolis", uf: "SC" },
    { pos: 5, nick: "SovaPrime", pts: 1754, wins: 44, city: "Goiania", uf: "GO" }
  ],
  "counter-strike-2": [
    { pos: 1, nick: "Crosshair Prime", pts: 2210, wins: 41, city: "Curitiba", uf: "PR" },
    { pos: 2, nick: "Nuke House", pts: 2158, wins: 39, city: "Sao Paulo", uf: "SP" },
    { pos: 3, nick: "Mirage Call", pts: 2074, wins: 35, city: "Belo Horizonte", uf: "MG" },
    { pos: 4, nick: "AimLabers", pts: 1998, wins: 33, city: "Recife", uf: "PE" },
    { pos: 5, nick: "Bombsite A", pts: 1922, wins: 31, city: "Porto Alegre", uf: "RS" }
  ]
};

export function getRankingByGameSlug(slug: string): MockRankingEntry[] {
  return MOCK_RANKINGS_BY_GAME[slug] ?? [];
}
