import { NextResponse } from "next/server";
import { uploadGenericImage } from "@/lib/image-storage";
import { getBadge, setBadgeLogo } from "@/lib/player-badges-storage";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 2 * 1024 * 1024;

// GET /api/players/[nickname]/badge → { badge: { logoUrl, active, grantedBy, ... } | null }
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ nickname: string }> }
) {
  const { nickname } = await params;
  const badge = await getBadge(decodeURIComponent(nickname));
  return NextResponse.json({ badge });
}

// POST FormData(file) — player upload do logo. Só funciona se já tiver selo ativo.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ nickname: string }> }
) {
  const { nickname } = await params;
  const decoded = decodeURIComponent(nickname).trim();
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: "Tipo inválido. Use JPG/PNG/WEBP." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Máximo 2 MB" }, { status: 413 });
  }
  try {
    const upload = await uploadGenericImage({
      folder: "badges",
      basename: decoded.toLowerCase(),
      file
    });
    const result = await setBadgeLogo(decoded, upload.url);
    if ("error" in result) {
      return NextResponse.json(result, { status: 403 });
    }
    return NextResponse.json({ ok: true, badge: result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
