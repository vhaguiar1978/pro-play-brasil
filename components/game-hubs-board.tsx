"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readManagedGameHubs, type ManagedGameHub } from "@/lib/managed-game-hubs";

export function GameHubsBoard() {
  const [hubs, setHubs] = useState<ManagedGameHub[]>([]);

  useEffect(() => {
    setHubs(readManagedGameHubs());
  }, []);

  if (hubs.length === 0) return null;

  return (
    <section className="rounded-3xl border border-ppb-border bg-ppb-surface p-6 shadow-ppb-card md:p-8">
      <div>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ppb-primary">Modalidades</span>
        <h2 className="mt-2 text-2xl font-black text-ppb-text md:text-3xl">Hubs por jogo</h2>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {hubs.map((hub) => (
          <Link
            key={hub.slug}
            href={`/campeonatos/modalidades/${hub.slug}`}
            className="rounded-2xl border border-ppb-border bg-ppb-subtle p-5 transition hover:-translate-y-0.5 hover:border-ppb-primary/40 hover:bg-white/[0.04]"
          >
            <strong className="block text-lg text-ppb-text">{hub.name}</strong>
            <p className="mt-2 text-sm text-ppb-muted">{hub.shortDescription}</p>
            <div className="mt-4 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-ppb-primary">
              <span>{hub.tournamentFormat}</span>
              <span>Abrir →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
