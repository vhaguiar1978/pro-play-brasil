"use client";

import { useEffect, useState } from "react";

// Cache + dedupe igual ao usePlayerAvatar, mas pra logos de selo de campeão.
// Só retorna URL pra selos ATIVOS com logo. Players sem selo retornam null.

const cache = new Map<string, string | null>();
const pending = new Map<string, Promise<string | null>>();
const subscribers = new Map<string, Set<(url: string | null) => void>>();

function norm(nick: string): string {
  return nick.trim().toLowerCase();
}

function notify(key: string, url: string | null) {
  const set = subscribers.get(key);
  if (!set) return;
  for (const cb of set) cb(url);
}

async function fetchLogo(nick: string): Promise<string | null> {
  const key = norm(nick);
  if (cache.has(key)) return cache.get(key) ?? null;
  if (pending.has(key)) return pending.get(key)!;

  const p = fetch(`/api/players/${encodeURIComponent(nick)}/badge`)
    .then((r) => (r.ok ? r.json() : { badge: null }))
    .then((data: { badge: { logoUrl: string | null; active: boolean } | null }) => {
      const badge = data?.badge;
      const url = badge && badge.active && badge.logoUrl ? badge.logoUrl : null;
      cache.set(key, url);
      pending.delete(key);
      notify(key, url);
      return url;
    })
    .catch(() => {
      cache.set(key, null);
      pending.delete(key);
      notify(key, null);
      return null;
    });
  pending.set(key, p);
  return p;
}

export function usePlayerBadgeLogo(nick: string | null): string | null {
  const [url, setUrl] = useState<string | null>(() => {
    if (!nick) return null;
    const key = norm(nick);
    return cache.has(key) ? (cache.get(key) ?? null) : null;
  });

  useEffect(() => {
    if (!nick) return;
    const key = norm(nick);

    if (cache.has(key)) {
      setUrl(cache.get(key) ?? null);
      return;
    }

    if (!subscribers.has(key)) subscribers.set(key, new Set());
    subscribers.get(key)!.add(setUrl);
    fetchLogo(nick);
    return () => {
      subscribers.get(key)?.delete(setUrl);
    };
  }, [nick]);

  return url;
}

export function invalidatePlayerBadge(nick: string): void {
  const key = norm(nick);
  cache.delete(key);
  pending.delete(key);
}
