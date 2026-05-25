import { NextResponse } from "next/server";
import {
  endLiveStream,
  readLiveStreams,
  readLiveStreamsByGame,
  upsertLiveStream
} from "@/lib/live-streams-storage";

// GET /api/streams           → todas as streams ativas
// GET /api/streams?game=fifa → só de um jogo
// POST /api/streams          → registra ou renova (body: { nickname, gameSlug, twitchUrl, title })
// DELETE /api/streams?nickname=X → encerra

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const game = searchParams.get("game");
  const streams = game ? await readLiveStreamsByGame(game) : await readLiveStreams();
  return NextResponse.json({ streams });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const result = await upsertLiveStream({
    nickname: typeof b.nickname === "string" ? b.nickname : "",
    gameSlug: typeof b.gameSlug === "string" ? b.gameSlug : "",
    twitchUrl: typeof b.twitchUrl === "string" ? b.twitchUrl : "",
    title: typeof b.title === "string" ? b.title : ""
  });
  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json({ ok: true, stream: result });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const nickname = searchParams.get("nickname") ?? "";
  if (!nickname.trim()) {
    return NextResponse.json({ error: "nickname obrigatório" }, { status: 400 });
  }
  await endLiveStream(nickname);
  return NextResponse.json({ ok: true });
}
