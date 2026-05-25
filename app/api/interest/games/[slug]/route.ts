import { NextResponse } from "next/server";
import { addClick, countClicksBySlug } from "@/lib/interest-storage";
import { checkRateLimit, rateLimitResponse, readClientIp } from "@/lib/rate-limit";

// GET /api/interest/games/[slug]  → { count }
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const count = await countClicksBySlug(slug);
  return NextResponse.json({ count });
}

// POST /api/interest/games/[slug]  body: { nick, tag }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Rate limit: 10 cliques de interesse por IP em 1min
  const ip = readClientIp(request);
  const rl = checkRateLimit(`interest:${ip}`, { limit: 10, windowSec: 60 });
  const rlResp = rateLimitResponse(rl);
  if (rlResp) return rlResp;

  let body: { nick?: string; tag?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  try {
    const click = await addClick({ gameSlug: slug, nick: body.nick ?? "", tag: body.tag ?? "" });
    const count = await countClicksBySlug(slug);
    return NextResponse.json({ ok: true, click, count });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao registrar" },
      { status: 400 }
    );
  }
}
