import { NextResponse } from "next/server";
import { readAllMatches } from "@/lib/match-storage";

// GET /api/tournaments/[id]/matches — público (todos veem o bracket)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const matches = await readAllMatches(id);
  return NextResponse.json({ matches });
}
