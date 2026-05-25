"use client";

import { useEffect, useState } from "react";

// Cache em memória + dedupe de requests pra evitar avalanche de fetches
// quando há várias listas com mesmos nicks na mesma página.

type Status = "idle" | "loading" | "loaded";

const cache = new Map<string, string | null>(); // nick lowercase → url ou null
const pending = new Map<string, Promise<string | null>>(); // request em andamento por nick
const subscribers = new Map<string, Set<(url: string | null) => void>>();

function norm(nick: string): string {
  return nick.trim().toLowerCase();
}

function notify(key: string, url: string | null) {
  const set = subscribers.get(key);
  if (!set) return;
  for (const cb of set) cb(url);
}

async function fetchAvatar(nick: string): Promise<string | null> {
  const key = norm(nick);
  if (cache.has(key)) return cache.get(key) ?? null;
  if (pending.has(key)) return pending.get(key)!;

  const p = fetch(`/api/players/${encodeURIComponent(nick)}/avatar`)
    .then((r) => (r.ok ? r.json() : { url: null }))
    .then((data: { url: string | null }) => {
      const url = data?.url ?? null;
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

/**
 * Hook que retorna a URL do avatar do jogador (ou null se sem foto).
 * Faz cache em memória, então listas com mesmos nicks só fazem 1 fetch.
 * Passar `null` desabilita o fetch.
 */
export function usePlayerAvatar(nick: string | null): string | null {
  const [url, setUrl] = useState<string | null>(() => {
    if (!nick) return null;
    const key = norm(nick);
    return cache.has(key) ? (cache.get(key) ?? null) : null;
  });

  useEffect(() => {
    if (!nick) return;
    const key = norm(nick);

    // Já tem cache
    if (cache.has(key)) {
      setUrl(cache.get(key) ?? null);
      return;
    }

    // Inscreve pra ser notificado quando o fetch terminar
    if (!subscribers.has(key)) subscribers.set(key, new Set());
    subscribers.get(key)!.add(setUrl);
    fetchAvatar(nick);
    return () => {
      subscribers.get(key)?.delete(setUrl);
    };
  }, [nick]);

  return url;
}

/** Limpa o cache de um nick (chamado após upload pra forçar reload). */
export function invalidatePlayerAvatar(nick: string): void {
  const key = norm(nick);
  cache.delete(key);
  pending.delete(key);
}
