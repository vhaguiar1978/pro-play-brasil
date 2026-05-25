import { NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/admin-access-server";
import { generateBracket, type BracketFormat } from "@/lib/match-storage";
import { getServerTournamentById } from "@/lib/tournaments-server-storage";
import { MOCK_TOURNAMENTS } from "@/lib/mock-tournaments";

// POST /api/admin/tournaments/[id]/start
// Body: { participants: [{ nickname, teamName? }, ...] }
// Gera o bracket conforme o tournament.format (eliminação | grupos | pontos).

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { canAccess } = await getServerAdminAccess();
  if (!canAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const { id } = await params;
  let body: {
    participants?: Array<{ nickname: string; teamName?: string; whatsapp?: string }>;
    scheduledAt?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const participants = (body.participants ?? [])
    .filter((p) => p && typeof p.nickname === "string" && p.nickname.trim())
    .map((p) => ({
      nickname: p.nickname.trim().slice(0, 40),
      teamName: typeof p.teamName === "string" ? p.teamName.trim().slice(0, 60) : undefined,
      whatsapp: typeof p.whatsapp === "string" ? p.whatsapp.trim().slice(0, 30) : undefined
    }));

  if (participants.length < 2) {
    return NextResponse.json(
      { error: "Mínimo 2 participantes pra gerar bracket" },
      { status: 400 }
    );
  }

  // Detecta o formato do tournament pra escolher gerador correto
  const tournament =
    (await getServerTournamentById(id)) ?? MOCK_TOURNAMENTS.find((t) => t.id === id);
  const format = (tournament?.format ?? "eliminacao") as BracketFormat;

  try {
    const matches = await generateBracket({
      tournamentId: id,
      participants,
      format,
      scheduledAt: body.scheduledAt
    });
    return NextResponse.json({ ok: true, matches, format });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
