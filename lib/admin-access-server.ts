import "server-only";

import { canAccessAdminIdentity, parseAdminEmails } from "@/lib/admin-access-shared";
import { createClient } from "@/lib/supabase/server";

function readGamertagFromMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return "";

  const value = (metadata as { gamertag?: unknown }).gamertag;
  return typeof value === "string" ? value : "";
}

export async function getServerAdminAccess() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      canAccess: false,
      email: "",
      gamertag: ""
    };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const email = user?.email ?? "";
  const gamertag = readGamertagFromMetadata(user?.user_metadata);

  return {
    canAccess: canAccessAdminIdentity({ email, gamertag }, parseAdminEmails(process.env.ADMIN_EMAILS)),
    email,
    gamertag
  };
}
