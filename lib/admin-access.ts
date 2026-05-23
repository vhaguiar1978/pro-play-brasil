"use client";

import { readArenaProfile } from "@/lib/profile-storage";
import { canAccessAdminIdentity } from "@/lib/admin-access-shared";

export function hasAdminAccess() {
  const profile = readArenaProfile();
  if (!profile) return false;

  return canAccessAdminIdentity({
    gamertag: profile.gamertag,
    email: profile.email
  });
}
