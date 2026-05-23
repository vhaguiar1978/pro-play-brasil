"use client";

import { GAMES } from "@/lib/games";

export type ManagedGameHub = {
  slug: string;
  name: string;
  shortDescription: string;
  tournamentFormat: string;
  createdAt: string;
};

const STORAGE_KEY = "ppb_managed_game_hubs_v1";

function defaultDescription(name: string) {
  return `Página oficial de ${name} com campeonatos, criação de torneios e ranking próprio.`;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getDefaultGameHubs(): ManagedGameHub[] {
  return GAMES.map((game) => ({
    slug: game.slug,
    name: game.name,
    shortDescription: game.shortDescription,
    tournamentFormat: "Mata-mata",
    createdAt: "system"
  }));
}

function normalizeGameHubs(input: unknown): ManagedGameHub[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter((item): item is Partial<ManagedGameHub> => Boolean(item && typeof item === "object"))
    .map((item) => ({
      slug: typeof item.slug === "string" ? slugify(item.slug) : "",
      name: typeof item.name === "string" ? item.name.trim() : "",
      shortDescription:
        typeof item.shortDescription === "string" && item.shortDescription.trim().length > 0
          ? item.shortDescription.trim()
          : defaultDescription(typeof item.name === "string" ? item.name.trim() : "essa modalidade"),
      tournamentFormat:
        typeof item.tournamentFormat === "string" && item.tournamentFormat.trim().length > 0
          ? item.tournamentFormat.trim()
          : "Mata-mata",
      createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString()
    }))
    .filter((item) => item.slug && item.name);
}

function mergeWithDefaults(customHubs: ManagedGameHub[]) {
  const map = new Map<string, ManagedGameHub>();

  for (const hub of getDefaultGameHubs()) {
    map.set(hub.slug, hub);
  }

  for (const hub of customHubs) {
    map.set(hub.slug, hub);
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export function readManagedGameHubs(): ManagedGameHub[] {
  if (typeof window === "undefined") {
    return getDefaultGameHubs();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultGameHubs();
    return mergeWithDefaults(normalizeGameHubs(JSON.parse(raw)));
  } catch {
    return getDefaultGameHubs();
  }
}

export function writeManagedGameHubs(list: ManagedGameHub[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeGameHubs(list)));
}

export function upsertManagedGameHub(input: { name: string; tournamentFormat: string; shortDescription?: string }) {
  const name = input.name.trim();
  const slug = slugify(name);
  if (!name || !slug) return readManagedGameHubs();

  const current = readManagedGameHubs().filter(
    (hub) => hub.createdAt !== "system" || !GAMES.some((game) => game.slug === hub.slug)
  );
  const nextHub: ManagedGameHub = {
    slug,
    name,
    shortDescription: input.shortDescription?.trim() || defaultDescription(name),
    tournamentFormat: input.tournamentFormat.trim() || "Mata-mata",
    createdAt: new Date().toISOString()
  };

  const filtered = current.filter((hub) => hub.slug !== slug);
  writeManagedGameHubs([...filtered, nextHub]);
  return readManagedGameHubs();
}

export function removeManagedGameHub(slug: string) {
  const protectedSlug = GAMES.some((game) => game.slug === slug);
  if (protectedSlug) return readManagedGameHubs();

  const current = readManagedGameHubs().filter((hub) => hub.slug !== slug);
  writeManagedGameHubs(current);
  return readManagedGameHubs();
}

export function getManagedGameHubBySlug(slug: string) {
  return readManagedGameHubs().find((hub) => hub.slug === slug);
}
