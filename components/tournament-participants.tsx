"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { ChampionBadge } from "@/components/ui/champion-badge";
import { getParticipantStream } from "@/lib/mock-streams";
import type { TournamentParticipant } from "@/lib/mock-tournaments";

type Props = {
  tournamentId: string;
  baseParticipants: TournamentParticipant[];
};

type PublicRegistration = {
  tournamentId: string;
  nickname: string;
  teamName: string;
  platform: string;
  paymentStatus: "free" | "paid";
  createdAt: string;
};

type ParticipantView = {
  nickname: string;
  teamName: string;
  platform?: string;
  paymentStatus: "confirmed" | "pending";
  twitchUrl?: string | null;
  isLive: boolean;
  source: "mock" | "server";
};

function fromMock(p: TournamentParticipant): ParticipantView {
  const stream = getParticipantStream(p.nickname);
  return {
    nickname: p.nickname,
    teamName: p.teamName?.trim() ?? "",
    paymentStatus: "confirmed",
    twitchUrl: stream?.twitchUrl ?? null,
    isLive: stream?.isLive ?? false,
    source: "mock"
  };
}

function fromServer(r: PublicRegistration): ParticipantView {
  const stream = getParticipantStream(r.nickname);
  return {
    nickname: r.nickname,
    teamName: r.teamName.trim(),
    platform: r.platform,
    paymentStatus: r.paymentStatus === "paid" ? "confirmed" : "confirmed",
    twitchUrl: stream?.twitchUrl ?? null,
    isLive: stream?.isLive ?? false,
    source: "server"
  };
}

export function TournamentParticipants({ tournamentId, baseParticipants }: Props) {
  const [registrations, setRegistrations] = useState<PublicRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/tournaments/${tournamentId}/registrations`, { cache: "no-store" });
      const data = await r.json();
      setRegistrations((data?.registrations ?? []) as PublicRegistration[]);
    } catch {
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const participants = useMemo(() => {
    const map = new Map<string, ParticipantView>();
    baseParticipants.forEach((p) => map.set(p.nickname.toLowerCase(), fromMock(p)));
    registrations.forEach((r) => map.set(r.nickname.toLowerCase(), fromServer(r)));
    return Array.from(map.values()).sort((a, b) => {
      if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
      if (a.source !== b.source) return a.source === "server" ? -1 : 1;
      return a.nickname.localeCompare(b.nickname);
    });
  }, [baseParticipants, registrations]);

  return (
    <div className="overflow-hidden rounded-3xl border border-ppb-border bg-ppb-surface p-5 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-ppb-accent/15 text-ppb-accent ring-1 ring-ppb-accent/30">
            <Users className="h-4 w-4" />
          </span>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-ppb-accent">
              Participantes
            </div>
            <div className="font-display text-lg font-black text-ppb-text">
              {participants.length} confirmados
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-full border border-ppb-border bg-ppb-background/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ppb-mutedSoft transition hover:border-ppb-primary/40 hover:text-ppb-text disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          Atualizar
        </button>
      </div>

      {participants.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-ppb-border bg-ppb-background/30 px-4 py-8 text-center text-sm text-ppb-mutedSoft">
          Nenhum inscrito ainda. Seja o primeiro a marcar presença pela página de inscrição.
        </p>
      ) : (
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {participants.map((p) => {
            const Inner = (
              <div className="flex items-center gap-3">
                <PlayerAvatar nick={p.nickname} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-bold text-ppb-text">
                      {p.teamName || p.nickname}
                    </span>
                    <ChampionBadge nick={p.nickname} size="sm" />
                    {p.isLive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-rose-300 ring-1 ring-rose-500/30">
                        <span className="h-1 w-1 animate-pulse rounded-full bg-rose-300" />
                        AO VIVO
                      </span>
                    ) : null}
                  </div>
                  {p.teamName ? (
                    <div className="truncate text-[11px] text-ppb-mutedSoft">{p.nickname}</div>
                  ) : null}
                </div>
                {p.platform ? (
                  <span className="rounded-full bg-ppb-background/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ppb-mutedSoft ring-1 ring-ppb-border">
                    {p.platform}
                  </span>
                ) : null}
              </div>
            );

            return (
              <li
                key={p.nickname}
                className={cn(
                  "rounded-2xl border border-ppb-border bg-ppb-background/40 px-3 py-2.5 transition",
                  p.isLive && "border-rose-500/40 bg-rose-500/5"
                )}
              >
                {p.isLive && p.twitchUrl ? (
                  <a
                    className="block"
                    href={p.twitchUrl}
                    target="_blank"
                    rel="noreferrer"
                    title={`Assistir ${p.nickname} na Twitch`}
                  >
                    {Inner}
                  </a>
                ) : (
                  Inner
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
