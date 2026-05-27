export const publicRoutes = {
  home: "/",
  games: "/jogos-oficiais",
  tournaments: "/campeonatos",
  ranking: "/ranking",
  support: "/suporte",
  terms: "/termos-de-uso",
  login: "/entrar",
  signup: "/cadastrar",
  joinChampionship: "/entrar-no-campeonato"
} as const;

export function isRouteActive(pathname: string, href: string) {
  switch (href) {
    case publicRoutes.home:
      return pathname === "/" || pathname === publicRoutes.home;
    case publicRoutes.games:
      return pathname === publicRoutes.games || pathname === "/jogos" || pathname.startsWith("/jogos/");
    case publicRoutes.login:
      return pathname === publicRoutes.login || pathname === "/login";
    case publicRoutes.signup:
      return pathname === publicRoutes.signup || pathname === "/cadastro";
    case publicRoutes.joinChampionship:
      return pathname === publicRoutes.joinChampionship || pathname === publicRoutes.tournaments || pathname.startsWith("/campeonatos/");
    default:
      return pathname === href || pathname.startsWith(`${href}/`);
  }
}
