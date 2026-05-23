"use client";

import { useEffect, useMemo, useState } from "react";
import { getParticipantStream } from "@/lib/mock-streams";
import type { TournamentParticipant } from "@/lib/mock-tournaments";
import { getTournamentRegistrationsById, type TournamentRegistration } from "@/lib/tournament-registration";

type Props = {
  tournamentId: string;
  baseParticipants: TournamentParticipant[];
};

type ParticipantView = {
  nickname: string;
  teamName: string;
  paymentStatus: "confirmed" | "pending";
  twitchUrl?: string | null;
  isLive: boolean;
};

function toViewModel(participant: TournamentParticipant): ParticipantView {
  const stream = getParticipantStream(participant.nickname);

  return {
    nickname: participant.nickname,
    teamName: participant.teamName?.trim() ?? "",
    paymentStatus: "confirmed",
    twitchUrl: stream?.twitchUrl ?? null,
    isLive: stream?.isLive ?? false
  };
}

function registrationToViewModel(registration: TournamentRegistration): ParticipantView {
  const stream = getParticipantStream(registration.nickname);

  return {
    nickname: registration.nickname,
    teamName: registration.teamName.trim(),
    paymentStatus: registration.paymentStatus === "paid" || registration.paymentMethod === "free" ? "confirmed" : "pending",
    twitchUrl: stream?.twitchUrl ?? null,
    isLive: stream?.isLive ?? false
  };
}

export function TournamentParticipants({ tournamentId, baseParticipants }: Props) {
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);

  useEffect(() => {
    setRegistrations(getTournamentRegistrationsById(tournamentId));
  }, [tournamentId]);

  const participants = useMemo(() => {
    const map = new Map<string, ParticipantView>();

    baseParticipants.forEach((participant) => {
      map.set(participant.nickname.toLowerCase(), toViewModel(participant));
    });

    registrations.forEach((registration) => {
      map.set(registration.nickname.toLowerCase(), registrationToViewModel(registration));
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
      if (a.teamName && !b.teamName) return -1;
      if (!a.teamName && b.teamName) return 1;
      return a.nickname.localeCompare(b.nickname);
    });
  }, [baseParticipants, registrations]);

  return (
    <div className="card">
      <div className="inline-actions" style={{ justifyContent: "space-between", marginTop: 0 }}>
        <h2 style={{ margin: 0 }}>Participantes</h2>
        <span className="badge">{participants.length} confirmados na lista</span>
      </div>
      <p className="muted" style={{ marginTop: 10 }}>
        Quando existir nome de time, ele aparece em destaque e o jogador fica menor logo abaixo.
      </p>

      <div className="stack" style={{ marginTop: 14 }}>
        {participants.map((participant) => {
          const nameBlock = (
            <span className={`participant-name participant-list-name ${participant.isLive ? "participant-name-live" : ""}`}>
              <span className="participant-name-copy">
                <span>{participant.teamName || participant.nickname}</span>
                {participant.teamName ? <small>{participant.nickname}</small> : null}
              </span>
              {participant.isLive ? <span className="participant-live-badge">Ao vivo</span> : null}
            </span>
          );

          return (
            <div key={participant.nickname} className="participant-card">
              <div>
                {participant.isLive && participant.twitchUrl ? (
                  <a
                    className="participant-link"
                    href={participant.twitchUrl}
                    target="_blank"
                    rel="noreferrer"
                    title={`Assistir ${participant.nickname} na Twitch`}
                  >
                    {nameBlock}
                  </a>
                ) : (
                  nameBlock
                )}
              </div>
              <span className={`status ${participant.paymentStatus === "confirmed" ? "ok" : "warn"}`}>
                {participant.paymentStatus === "confirmed" ? "Inscricao confirmada" : "Pagamento pendente"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
