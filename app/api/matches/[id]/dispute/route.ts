import { NextResponse } from "next/server";
import { disputeResult } from "@/lib/match-storage";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason : "";
  const proofUrl = typeof body.proofUrl === "string" ? body.proofUrl : null;
  const result = await disputeResult(id, reason, proofUrl);
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ ok: true, match: result });
}
