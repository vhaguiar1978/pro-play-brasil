import { GAMES } from "@/lib/games";
import { getRankingByGameSlug } from "@/lib/mock-rankings";
import { RankingPageView } from "@/components/ranking/ranking-page-view";

export default function RankingPage() {
  const byGame = GAMES.map((game) => ({
    slug: game.slug,
    name: game.name,
    coverImage: game.coverImage,
    rows: getRankingByGameSlug(game.slug).map((r) => ({
      ...r,
      gameSlug: game.slug,
      gameName: game.name
    }))
  })).filter((g) => g.rows.length > 0);

  return <RankingPageView byGame={byGame} />;
}
