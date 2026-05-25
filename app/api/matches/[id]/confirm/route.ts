import { NextResponse } from "next/server";
import { confirmResult } from "@/lib/match-storage";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await confirmResult(id);
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ ok: true, match: result });
}
