import { NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/admin-access-server";
import {
  clearGameOverride,
  setGameOverride,
  type GameRuntimeStatus
} from "@/lib/games-overrides-storage";

const ALLOWED_STATUS: GameRuntimeStatus[] = ["active", "frozen", "hidden"];

type UpdateBody = {
  name?: string;
  shortDescription?: string;
  themeColor?: string;
  status?: GameRuntimeStatus;
};

function sanitizeBody(raw: unknown): UpdateBody | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "JSON inválido" };
  const body = raw as Record<string, unknown>;
  const out: UpdateBody = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length === 0) {
      return { error: "Nome inválido" };
    }
    out.name = body.name.trim().slice(0, 80);
  }

  if (body.shortDescription !== undefined) {
    if (typeof body.shortDescription !== "string") {
      return { error: "Descrição inválida" };
    }
    out.shortDescription = body.shortDescription.trim().slice(0, 220);
  }

  if (body.themeColor !== undefined) {
    if (typeof body.themeColor !== "string" || !/^#[0-9a-fA-F]{3,8}$/.test(body.themeColor.trim())) {
      return { error: "Cor inválida. Use formato hexa (ex: #FF6A00)." };
    }
    out.themeColor = body.themeColor.trim();
  }

  if (body.status !== undefined) {
    if (!ALLOWED_STATUS.includes(body.status as GameRuntimeStatus)) {
      return { error: `Status inválido. Use: ${ALLOWED_STATUS.join(", ")}` };
    }
    out.status = body.status as GameRuntimeStatus;
  }

  return out;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { canAccess } = await getServerAdminAccess();
  if (!canAccess) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  const { slug } = await params;
  const raw = await request.json().catch(() => null);
  const parsed = sanitizeBody(raw);
  if ("error" in parsed) return NextResponse.json(parsed, { status: 400 });

  const all = await setGameOverride(slug, parsed);
  return NextResponse.json({ ok: true, slug, override: all[slug], all });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { canAccess } = await getServerAdminAccess();
  if (!canAccess) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  const { slug } = await params;
  const all = await clearGameOverride(slug);
  return NextResponse.json({ ok: true, slug, all });
}
