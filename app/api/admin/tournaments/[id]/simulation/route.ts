import { NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/admin-access-server";
import { adminResolveMatch, confirmResult, deleteMatchesByTournament, disputeResult, generateBracket, readAllMatches, submitResult } from "@/lib/match-storage";
import { readNotifications } from "@/lib/notifications-storage";
import { addRegistration, deleteRegistrationsByTournament, readRegistrationsByTournament, updateTournamentRegistrationPayments } from "@/lib/tournament-registrations-server-storage";
import { getServerTournamentById, updateServerTournament } from "@/lib/tournaments-server-storage";

type SimulationAction = "seed" | "start" | "step" | "dispute_step" | "payments_all_paid" | "run_all" | "reset";

function toTournamentInput(tournament: NonNullable<Awaited<ReturnType<typeof getServerTournamentById>>>, overrides?: Partial<{
  registered: number;
  status: "open" | "live" | "finished";
}>) {
  return {
    name: tournament.name,
    gameSlug: tournament.gameSlug,
    origin: tournament.origin,
    description: tournament.description ?? "",
    platform: tournament.platform,
    maxPlayers: tournament.maxPlayers,
    minimumPlayers: tournament.minimumPlayers,
    registered: overrides?.registered ?? tournament.registered,
    startDate: tournament.startDate,
    feeLabel: tournament.feeLabel,
    prize: tournament.prize,
    format: tournament.format,
    status: overrides?.status ?? tournament.status,
    regionLabel: tournament.regionLabel
  };
}

function buildFakeParticipants(count: number, minimumPlayers?: number) {
  const nickSeeds = [
    "KaiqueRush",
    "LunaStrike",
    "PedroElite",
    "RafaGhost",
    "TayHawk",
    "NinaPrime",
    "BrenoWave",
    "VitorFlux",
    "DudaPixel",
    "CaioRift",
    "BiaStorm",
    "LeoTurbo",
    "MayaAce",
    "GuiNova",
    "SahSniper",
    "DanLegend"
  ];
  const teamPrefixes = ["Alpha", "Bravo", "Crimson", "Delta", "Elite", "Flux", "Ghost", "Hawk", "Inferno", "Legacy"];
  const teamSuffixes = ["Squad", "Force", "United", "GG", "Prime", "Rush", "Wave", "Line", "Zone", "Nation"];
  const paymentMethods = ["mercado_pago", "pagseguro", "ppc"] as const;
  const isTeamTournament = Boolean(minimumPlayers && minimumPlayers > 1);

  return Array.from({ length: count }).map((_, index) => {
    const teamName = `${teamPrefixes[index % teamPrefixes.length]} ${teamSuffixes[index % teamSuffixes.length]}`;
    const nickname = isTeamTournament
      ? `Capitao${nickSeeds[index % nickSeeds.length]}_${String(index + 1).padStart(2, "0")}`
      : `${nickSeeds[index % nickSeeds.length]}_${String(index + 1).padStart(2, "0")}`;
    const whatsapp = `551199999${String(100 + index).padStart(3, "0")}`;
    return {
      nickname,
      teamName,
      whatsapp,
      paymentMethod: paymentMethods[index % paymentMethods.length]
    };
  });
}

function pickScore() {
  const scoreA = Math.floor(Math.random() * 4);
  let scoreB = Math.floor(Math.random() * 4);
  if (scoreA === scoreB) scoreB = (scoreB + 1) % 5;
  return { scoreA, scoreB };
}

async function readSummary(tournamentId: string, minimumPlayers?: number) {
  const registrations = await readRegistrationsByTournament(tournamentId);
  const matches = await readAllMatches(tournamentId);
  const actionable = matches.filter((match) =>
    (match.status === "pending" && match.playerA && match.playerB) ||
    match.status === "result_submitted" ||
    match.status === "disputed"
  );
  const finalized = matches.filter((match) => match.status === "finalized");
  const championMatch =
    [...finalized]
      .sort((a, b) => {
        const aFinal = a.finalizedAt ? new Date(a.finalizedAt).getTime() : 0;
        const bFinal = b.finalizedAt ? new Date(b.finalizedAt).getTime() : 0;
        return bFinal - aFinal || b.round - a.round || b.matchNumber - a.matchNumber;
      })
      .find((match) => match.winner && !match.nextMatchId) ?? null;

  const champion =
    championMatch?.winner === "A"
      ? championMatch.playerA?.nickname ?? null
      : championMatch?.winner === "B"
        ? championMatch.playerB?.nickname ?? null
        : null;

  const notificationsPerRecipient = await Promise.all(
    registrations.map(async (registration) => {
      const notifications = await readNotifications(registration.nickname);
      return notifications.length;
    })
  );

  const teamTournament = Boolean(minimumPlayers && minimumPlayers > 1);
  const uniqueTeams = Array.from(
    new Set(
      registrations
        .map((registration) => registration.teamName.trim())
        .filter(Boolean)
    )
  );

  return {
    registrations: registrations.length,
    matches: matches.length,
    actionableMatches: actionable.length,
    finalizedMatches: finalized.length,
    champion,
    notifications: notificationsPerRecipient.reduce((sum, count) => sum + count, 0),
    paidRegistrations: registrations.filter((registration) => registration.paymentStatus === "paid").length,
    teamMode: teamTournament,
    teams: uniqueTeams.length,
    minimumPlayers: minimumPlayers ?? 1,
    estimatedRosterSpots: teamTournament ? uniqueTeams.length * (minimumPlayers ?? 1) : registrations.length
  };
}

async function simulateOneMatch(tournamentId: string) {
  const matches = await readAllMatches(tournamentId);
  const target = matches.find((match) => match.status === "pending" && match.playerA && match.playerB)
    ?? matches.find((match) => match.status === "result_submitted")
    ?? matches.find((match) => match.status === "disputed");

  if (!target) {
    return { ok: false as const, message: "Nao existe partida disponivel para simular." };
  }

  if (target.status === "pending") {
    const { scoreA, scoreB } = pickScore();
    const submitted = await submitResult(target.id, {
      by: Math.random() > 0.5 ? "A" : "B",
      scoreA,
      scoreB
    });
    if ("error" in submitted) return { ok: false as const, message: submitted.error };
    const confirmed = await confirmResult(target.id);
    if ("error" in confirmed) return { ok: false as const, message: confirmed.error };
    return { ok: true as const, matchId: target.id, status: confirmed.status };
  }

  if (target.status === "result_submitted") {
    const confirmed = await confirmResult(target.id);
    if ("error" in confirmed) return { ok: false as const, message: confirmed.error };
    return { ok: true as const, matchId: target.id, status: confirmed.status };
  }

  const { scoreA, scoreB } = pickScore();
  const resolved = await adminResolveMatch(target.id, { scoreA, scoreB });
  if ("error" in resolved) return { ok: false as const, message: resolved.error };
  return { ok: true as const, matchId: target.id, status: resolved.status };
}

async function simulateOneDisputedMatch(tournamentId: string) {
  const matches = await readAllMatches(tournamentId);
  const target = matches.find((match) => match.status === "pending" && match.playerA && match.playerB);

  if (!target) {
    return { ok: false as const, message: "Nao existe partida pronta para simular disputa." };
  }

  const { scoreA, scoreB } = pickScore();
  const submitted = await submitResult(target.id, {
    by: "A",
    scoreA,
    scoreB
  });
  if ("error" in submitted) return { ok: false as const, message: submitted.error };

  const disputed = await disputeResult(target.id, "Teste automatico de contestacao");
  if ("error" in disputed) return { ok: false as const, message: disputed.error };

  const resolved = await adminResolveMatch(target.id, { scoreA, scoreB });
  if ("error" in resolved) return { ok: false as const, message: resolved.error };

  return { ok: true as const, matchId: target.id, status: resolved.status };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { canAccess } = await getServerAdminAccess();
  if (!canAccess) return NextResponse.json({ ok: false, message: "Acesso negado" }, { status: 403 });

  const { id } = await params;
  const tournament = await getServerTournamentById(id);
  if (!tournament) {
    return NextResponse.json({ ok: false, message: "Campeonato nao encontrado." }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: SimulationAction;
    participantsCount?: number;
  };

  const action = body.action;
  if (!action) {
    return NextResponse.json({ ok: false, message: "Acao obrigatoria." }, { status: 400 });
  }

  if (action === "reset") {
    await deleteMatchesByTournament(id);
    await deleteRegistrationsByTournament(id);
    await updateServerTournament(id, toTournamentInput(tournament, { registered: 0, status: "open" }));
    return NextResponse.json({ ok: true, action, summary: await readSummary(id, tournament.minimumPlayers) });
  }

  if (action === "seed") {
    const participantsCount = Math.max(2, Math.min(Number(body.participantsCount) || 8, tournament.maxPlayers));
    await deleteMatchesByTournament(id);
    await deleteRegistrationsByTournament(id);

    const fakeParticipants = buildFakeParticipants(participantsCount, tournament.minimumPlayers);
    for (const [index, participant] of fakeParticipants.entries()) {
      const hasFee = Boolean(tournament.feeLabel);
      await addRegistration({
        tournamentId: id,
        nickname: participant.nickname,
        teamName: participant.teamName,
        platform: tournament.platform,
        whatsapp: participant.whatsapp,
        paymentMethod: hasFee ? participant.paymentMethod : "free",
        paymentStatus: hasFee && index < Math.ceil(participantsCount * 0.7) ? "paid" : "free"
      });
    }

    await updateServerTournament(id, toTournamentInput(tournament, { registered: participantsCount, status: "open" }));
    return NextResponse.json({ ok: true, action, summary: await readSummary(id, tournament.minimumPlayers) });
  }

  if (action === "start") {
    const registrations = await readRegistrationsByTournament(id);
    if (registrations.length < 2) {
      return NextResponse.json({ ok: false, message: "Cadastre pelo menos 2 participantes de teste antes de iniciar." }, { status: 400 });
    }

    await deleteMatchesByTournament(id);
    await generateBracket({
      tournamentId: id,
      participants: registrations.map((registration) => ({
        nickname: registration.nickname,
        teamName: registration.teamName || undefined,
        whatsapp: registration.whatsapp || undefined
      })),
      format: tournament.format
    });
    await updateServerTournament(id, toTournamentInput(tournament, { registered: registrations.length, status: "live" }));
    return NextResponse.json({ ok: true, action, summary: await readSummary(id, tournament.minimumPlayers) });
  }

  if (action === "payments_all_paid") {
    await updateTournamentRegistrationPayments(id, "paid", "mercado_pago");
    return NextResponse.json({ ok: true, action, summary: await readSummary(id, tournament.minimumPlayers) });
  }

  if (action === "step") {
    const result = await simulateOneMatch(id);
    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
    }

    const summary = await readSummary(id, tournament.minimumPlayers);
    if (summary.actionableMatches === 0 && summary.finalizedMatches > 0) {
      await updateServerTournament(id, toTournamentInput(tournament, { registered: summary.registrations, status: "finished" }));
    }
    return NextResponse.json({ ok: true, action, result, summary: await readSummary(id, tournament.minimumPlayers) });
  }

  if (action === "dispute_step") {
    const result = await simulateOneDisputedMatch(id);
    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
    }

    const summary = await readSummary(id, tournament.minimumPlayers);
    if (summary.actionableMatches === 0 && summary.finalizedMatches > 0) {
      await updateServerTournament(id, toTournamentInput(tournament, { registered: summary.registrations, status: "finished" }));
    }
    return NextResponse.json({ ok: true, action, result, summary: await readSummary(id, tournament.minimumPlayers) });
  }

  if (action === "run_all") {
    let loops = 0;
    while (loops < 500) {
      const result = await simulateOneMatch(id);
      if (!result.ok) break;
      loops += 1;
    }

    const summary = await readSummary(id, tournament.minimumPlayers);
    if (summary.finalizedMatches > 0 && summary.actionableMatches === 0) {
      await updateServerTournament(id, toTournamentInput(tournament, { registered: summary.registrations, status: "finished" }));
    }

    return NextResponse.json({ ok: true, action, processedMatches: loops, summary: await readSummary(id, tournament.minimumPlayers) });
  }

  return NextResponse.json({ ok: false, message: "Acao invalida." }, { status: 400 });
}
