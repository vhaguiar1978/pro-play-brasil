"use client";

export type UserRegistryStatus = "active" | "penalized" | "banned";

export type UserRegistryEntry = {
  id: string;
  deviceId: string;
  fullName: string;
  cpf: string;
  email: string;
  gamertag: string;
  whatsapp: string;
  platform: "PC" | "PlayStation" | "Xbox" | "Mobile" | "Crossplay";
  createdAt: string;
  lastSeenAt: string;
  signupAttempts: number;
  status: UserRegistryStatus;
  penaltyReason: string;
};

export type UserRegistryInput = {
  fullName: string;
  cpf: string;
  email: string;
  gamertag: string;
  whatsapp: string;
  platform: "PC" | "PlayStation" | "Xbox" | "Mobile" | "Crossplay";
};

const USERS_KEY = "ppb_users_registry_v1";
const DEVICE_KEY = "ppb_device_id_v1";

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function getOrCreateDeviceId() {
  if (typeof window === "undefined") return "server";

  try {
    const existing = window.localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;
    const next = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_KEY, next);
    return next;
  } catch {
    return "unknown-device";
  }
}

function normalizeEntry(input: unknown): UserRegistryEntry | null {
  if (!input || typeof input !== "object") return null;
  const item = input as Partial<UserRegistryEntry>;

  if (
    typeof item.id !== "string" ||
    typeof item.deviceId !== "string" ||
    typeof item.fullName !== "string" ||
    typeof item.cpf !== "string" ||
    typeof item.email !== "string" ||
    typeof item.gamertag !== "string" ||
    typeof item.whatsapp !== "string" ||
    typeof item.createdAt !== "string" ||
    typeof item.lastSeenAt !== "string"
  ) {
    return null;
  }

  return {
    id: item.id,
    deviceId: item.deviceId,
    fullName: item.fullName,
    cpf: item.cpf,
    email: item.email,
    gamertag: item.gamertag,
    whatsapp: item.whatsapp,
    platform:
      item.platform === "PlayStation" ||
      item.platform === "Xbox" ||
      item.platform === "Mobile" ||
      item.platform === "Crossplay"
        ? item.platform
        : "PC",
    createdAt: item.createdAt,
    lastSeenAt: item.lastSeenAt,
    signupAttempts: typeof item.signupAttempts === "number" ? item.signupAttempts : 1,
    status: item.status === "penalized" || item.status === "banned" ? item.status : "active",
    penaltyReason: typeof item.penaltyReason === "string" ? item.penaltyReason : ""
  };
}

export function readUserRegistry() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeEntry).filter(Boolean) as UserRegistryEntry[];
  } catch {
    return [];
  }
}

export function writeUserRegistry(list: UserRegistryEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(list));
}

export function findUserConflicts(input: UserRegistryInput, currentId?: string) {
  const users = readUserRegistry();
  const cpf = onlyDigits(input.cpf);
  const email = normalizeText(input.email);
  const gamertag = normalizeText(input.gamertag);

  return users.filter((user) => {
    if (currentId && user.id === currentId) return false;
    return onlyDigits(user.cpf) === cpf || normalizeText(user.email) === email || normalizeText(user.gamertag) === gamertag;
  });
}

export function upsertUserRegistryEntry(input: UserRegistryInput) {
  const users = readUserRegistry();
  const deviceId = getOrCreateDeviceId();
  const now = new Date().toISOString();
  const normalizedCpf = onlyDigits(input.cpf);
  const normalizedEmail = normalizeText(input.email);
  const normalizedGamertag = normalizeText(input.gamertag);

  const existing = users.find(
    (user) =>
      user.deviceId === deviceId ||
      onlyDigits(user.cpf) === normalizedCpf ||
      normalizeText(user.email) === normalizedEmail ||
      normalizeText(user.gamertag) === normalizedGamertag
  );

  const nextEntry: UserRegistryEntry = existing
    ? {
        ...existing,
        fullName: input.fullName.trim(),
        cpf: input.cpf.trim(),
        email: input.email.trim(),
        gamertag: input.gamertag.trim(),
        whatsapp: input.whatsapp.trim(),
        platform: input.platform,
        lastSeenAt: now,
        signupAttempts: existing.signupAttempts + 1
      }
    : {
        id: crypto.randomUUID(),
        deviceId,
        fullName: input.fullName.trim(),
        cpf: input.cpf.trim(),
        email: input.email.trim(),
        gamertag: input.gamertag.trim(),
        whatsapp: input.whatsapp.trim(),
        platform: input.platform,
        createdAt: now,
        lastSeenAt: now,
        signupAttempts: 1,
        status: "active",
        penaltyReason: ""
      };

  const nextUsers = existing ? users.map((user) => (user.id === existing.id ? nextEntry : user)) : [nextEntry, ...users];
  writeUserRegistry(nextUsers);
  return nextEntry;
}

export function updateUserRegistryStatus(userId: string, status: UserRegistryStatus, penaltyReason: string) {
  const users = readUserRegistry();
  const next = users.map((user) =>
    user.id === userId
      ? {
          ...user,
          status,
          penaltyReason: penaltyReason.trim(),
          lastSeenAt: new Date().toISOString()
        }
      : user
  );
  writeUserRegistry(next);
  return next;
}

export function getUserDuplicateSnapshot(user: UserRegistryEntry, users: UserRegistryEntry[]) {
  const sameCpf = users.filter((item) => item.id !== user.id && onlyDigits(item.cpf) === onlyDigits(user.cpf)).length;
  const sameEmail = users.filter((item) => item.id !== user.id && normalizeText(item.email) === normalizeText(user.email)).length;
  const sameGamertag = users.filter((item) => item.id !== user.id && normalizeText(item.gamertag) === normalizeText(user.gamertag)).length;

  return {
    sameCpf,
    sameEmail,
    sameGamertag,
    riskLevel: sameCpf > 0 || sameEmail > 0 ? "high" : sameGamertag > 0 ? "medium" : "low"
  } as const;
}
