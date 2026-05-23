export type RecruitmentPost = {
  id: string;
  authorNick: string;
  game: string;
  message: string;
  createdAt: string;
  expiresAt: string;
};

export const RECRUITMENT_STORAGE_KEY = "ppb_ads_v1";
export const RECRUITMENT_POST_TTL_DAYS = 5;
const RECRUITMENT_POST_TTL_MS = RECRUITMENT_POST_TTL_DAYS * 24 * 60 * 60 * 1000;

export function getRecruitmentExpiresAt(createdAt: string) {
  return new Date(new Date(createdAt).getTime() + RECRUITMENT_POST_TTL_MS).toISOString();
}

export function isRecruitmentPostActive(post: Pick<RecruitmentPost, "expiresAt">) {
  return new Date(post.expiresAt).getTime() > Date.now();
}

export function normalizeRecruitmentPosts(input: unknown): RecruitmentPost[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter((item): item is Partial<RecruitmentPost> => Boolean(item && typeof item === "object"))
    .map((item) => {
      const createdAt = typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString();
      const expiresAt =
        typeof item.expiresAt === "string" && item.expiresAt.trim().length > 0 ? item.expiresAt : getRecruitmentExpiresAt(createdAt);

      return {
        id: typeof item.id === "string" ? item.id : crypto.randomUUID(),
        authorNick: typeof item.authorNick === "string" ? item.authorNick : "",
        game: typeof item.game === "string" ? item.game : "",
        message: typeof item.message === "string" ? item.message : "",
        createdAt,
        expiresAt
      };
    })
    .filter((item) => item.authorNick && item.game && item.message)
    .filter(isRecruitmentPostActive);
}

export function readRecruitmentPosts(): RecruitmentPost[] {
  try {
    const raw = localStorage.getItem(RECRUITMENT_STORAGE_KEY);
    if (!raw) return [];
    return normalizeRecruitmentPosts(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function writeRecruitmentPosts(list: RecruitmentPost[]) {
  localStorage.setItem(RECRUITMENT_STORAGE_KEY, JSON.stringify(list));
}

export function loadActiveRecruitmentPosts() {
  const normalized = readRecruitmentPosts().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  writeRecruitmentPosts(normalized);
  return normalized;
}

export function createSeededRecruitmentPosts(): RecruitmentPost[] {
  const now = new Date();
  const firstCreatedAt = now.toISOString();
  const secondCreatedAt = new Date(Date.now() - 1000 * 60 * 22).toISOString();

  return [
    {
      id: "a1",
      authorNick: "AlineVibe",
      game: "Valorant",
      message: "Procurando 2 players para fechar time do campeonato. Requisitos: call boa, noite e foco competitivo.",
      createdAt: firstCreatedAt,
      expiresAt: getRecruitmentExpiresAt(firstCreatedAt)
    },
    {
      id: "a2",
      authorNick: "L7Pedro",
      game: "EA FC",
      message: "Buscando parceiro para treinar e jogar os proximos campeonatos da plataforma.",
      createdAt: secondCreatedAt,
      expiresAt: getRecruitmentExpiresAt(secondCreatedAt)
    }
  ];
}

export function formatRecruitmentRemaining(expiration: string) {
  const diff = new Date(expiration).getTime() - Date.now();
  if (diff <= 0) return "Expirando agora";

  const hours = Math.ceil(diff / (1000 * 60 * 60));
  if (hours < 24) return `Expira em ${hours}h`;

  const days = Math.ceil(hours / 24);
  return `Expira em ${days} dia${days > 1 ? "s" : ""}`;
}
