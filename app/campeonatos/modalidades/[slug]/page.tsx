import { GameHubPageClient } from "@/components/game-hub-page-client";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ModalidadePage({ params }: Props) {
  const { slug } = await params;
  return <GameHubPageClient slug={slug} />;
}
