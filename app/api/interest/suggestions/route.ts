import { NextResponse } from "next/server";
import { addSuggestion, readSuggestions } from "@/lib/interest-storage";
import { checkRateLimit, rateLimitResponse, readClientIp } from "@/lib/rate-limit";

// GET /api/interest/suggestions  → { count }  (apenas total público)
export async function GET() {
  const all = await readSuggestions();
  return NextResponse.json({ count: all.length });
}

// POST /api/interest/suggestions  body: { gameName, nick, tag }
export async function POST(request: Request) {
  // Rate limit: 3 sugestões por IP a cada 5min (custo de moderação)
  const ip = readClientIp(request);
  const rl = checkRateLimit(`suggest:${ip}`, { limit: 3, windowSec: 300 });
  const rlResp = rateLimitResponse(rl);
  if (rlResp) return rlResp;

  let body: { gameName?: string; nick?: string; tag?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  try {
    const suggestion = await addSuggestion({
      gameName: body.gameName ?? "",
      nick: body.nick ?? "",
      tag: body.tag ?? ""
    });
    const all = await readSuggestions();
    return NextResponse.json({ ok: true, suggestion, count: all.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao registrar" },
      { status: 400 }
    );
  }
}
