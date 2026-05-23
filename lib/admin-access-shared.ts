export type AdminIdentity = {
  email?: string | null;
  gamertag?: string | null;
};

const FALLBACK_MATCHERS = ["vhaguiar", "proplaybrasil"];

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function parseAdminEmails(raw: string | undefined) {
  return (raw ?? "")
    .split(",")
    .map((item) => normalize(item))
    .filter(Boolean);
}

export function canAccessAdminIdentity(identity: AdminIdentity, adminEmails: string[] = []) {
  const email = normalize(identity.email);
  const gamertag = normalize(identity.gamertag);

  if (adminEmails.length > 0) {
    return adminEmails.some((allowed) => allowed === email);
  }

  return FALLBACK_MATCHERS.some((matcher) => email.includes(matcher) || gamertag.includes(matcher));
}
