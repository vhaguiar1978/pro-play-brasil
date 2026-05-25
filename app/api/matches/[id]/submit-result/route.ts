import { NextResponse } from "next/server";
import { submitResult } from "@/lib/match-storage";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  const by = body.by === "A" || body.by === "B" ? body.by : null;
  if (!by) return NextResponse.json({ error: "by deve ser 'A' ou 'B'" }, { status: 400 });
  const result = await submitResult(id, {
    by,
    scoreA: Number(body.scoreA),
    scoreB: Number(body.scoreB),
    proofUrl: typeof body.proofUrl === "string" ? body.proofUrl : null
  });
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ ok: true, match: result });
}
