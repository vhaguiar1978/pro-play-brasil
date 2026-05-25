"use client";

export type ArenaProfileIdentity = {
  fullName: string;
  gamertag: string;
  platform: "PC" | "PlayStation" | "Xbox" | "Mobile" | "Crossplay";
  email: string;
  whatsapp: string;
  twitch: string;
  teamByGame: Record<string, string>;
};

const PROFILE_KEY = "ppb_profile_draft_v1";

export function readArenaProfile(): ArenaProfileIdentity | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<ArenaProfileIdentity> | null;
    if (!parsed || typeof parsed !== "object") return null;

    return {
      fullName: typeof parsed.fullName === "string" ? parsed.fullName : "",
      gamertag: typeof parsed.gamertag === "string" ? parsed.gamertag : "",
      platform:
        parsed.platform === "PlayStation" ||
        parsed.platform === "Xbox" ||
        parsed.platform === "Mobile" ||
        parsed.platform === "Crossplay"
          ? parsed.platform
          : "PC",
      email: typeof parsed.email === "string" ? parsed.email : "",
      whatsapp: typeof parsed.whatsapp === "string" ? parsed.whatsapp : "",
      twitch: typeof parsed.twitch === "string" ? parsed.twitch : "",
      teamByGame: parsed.teamByGame && typeof parsed.teamByGame === "object" ? parsed.teamByGame : {}
    };
  } catch {
    return null;
  }
}

export function writeArenaProfile(profile: ArenaProfileIdentity): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

/** Verifica se o nickname da URL é o do dono logado (case insensitive). */
export function isOwnerOfProfile(nickname: string): boolean {
  const profile = readArenaProfile();
  if (!profile?.gamertag) return false;
  return profile.gamertag.trim().toLowerCase() === nickname.trim().toLowerCase();
}
