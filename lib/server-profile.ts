import "server-only";

import { parseAdminEmails } from "@/lib/admin-access-shared";
import { createClient } from "@/lib/supabase/server";

type JsonRecord = Record<string, unknown>;

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function readRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function normalizePlatform(value: string) {
  if (value === "PlayStation" || value === "Xbox" || value === "Mobile") return value;
  return "PC";
}

function buildGamertag(email: string, metadata: JsonRecord) {
  const candidate = readString(metadata.gamertag);
  if (candidate) return candidate;
  const fromEmail = email.split("@")[0]?.trim();
  return fromEmail || "player";
}

export type SyncedProfile = {
  id: string;
  email: string;
  full_name: string;
  gamertag: string;
  cpf: string | null;
  whatsapp: string;
  platform: string;
  twitch: string;
  bio: string;
  cep: string;
  address: string;
  address_number: string;
  complement: string;
  city: string;
  state: string;
  team_by_game: JsonRecord;
  status: "active" | "penalized" | "banned";
  penalty_reason: string;
  is_admin: boolean;
};

export async function ensureCurrentProfile() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.id || !user.email) return null;

  const metadata = readRecord(user.user_metadata);
  const adminEmails = parseAdminEmails(process.env.ADMIN_EMAILS);
  const email = user.email.trim();
  const shouldBeAdmin = adminEmails.includes(email.toLowerCase());
  const fullName = readString(metadata.full_name) || buildGamertag(email, metadata);
  const gamertag = buildGamertag(email, metadata);

  const payload = {
    id: user.id,
    email,
    full_name: fullName,
    gamertag,
    cpf: readString(metadata.cpf) || null,
    whatsapp: readString(metadata.whatsapp),
    platform: normalizePlatform(readString(metadata.platform)),
    twitch: readString(metadata.twitch),
    bio: readString(metadata.bio),
    cep: readString(metadata.cep),
    address: readString(metadata.address),
    address_number: readString(metadata.number || metadata.address_number),
    complement: readString(metadata.complement),
    city: readString(metadata.city),
    state: readString(metadata.state),
    team_by_game: readRecord(metadata.team_by_game),
    is_admin: shouldBeAdmin
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select(
      "id,email,full_name,gamertag,cpf,whatsapp,platform,twitch,bio,cep,address,address_number,complement,city,state,team_by_game,status,penalty_reason,is_admin"
    )
    .single<SyncedProfile>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
