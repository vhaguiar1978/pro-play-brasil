import { NextResponse } from "next/server";
import { uploadGenericImage } from "@/lib/image-storage";
import { getAvatarUrl, setAvatarUrl, removeAvatar } from "@/lib/player-avatars-storage";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 3 * 1024 * 1024;
const NICK_REGEX = /^[a-z0-9_\-.]{1,40}$/i;

// GET — retorna { url } se houver avatar
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ nickname: string }> }
) {
  const { nickname } = await params;
  const url = await getAvatarUrl(decodeURIComponent(nickname));
  return NextResponse.json({ url });
}

// POST FormData(file) — faz upload + grava no storage
export async function POST(
  request: Request,
  { params }: { params: Promise<{ nickname: string }> }
) {
  const { nickname } = await params;
  const decoded = decodeURIComponent(nickname).trim();
  if (!NICK_REGEX.test(decoded)) {
    return NextResponse.json({ error: "Nickname inválido" }, { status: 400 });
  }
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: "Tipo inválido. Use JPG, PNG ou WEBP." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Máximo ${MAX_BYTES / 1024 / 1024} MB` },
      { status: 413 }
    );
  }
  try {
    // Salva como avatars/<nick>.<ext>. Nickname lowercase pra deduplicar.
    const result = await uploadGenericImage({
      folder: "avatars",
      basename: decoded.toLowerCase(),
      file
    });
    await setAvatarUrl(decoded, result.url);
    return NextResponse.json({ ok: true, url: result.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}

// DELETE — remove avatar registrado
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ nickname: string }> }
) {
  const { nickname } = await params;
  await removeAvatar(decodeURIComponent(nickname));
  return NextResponse.json({ ok: true });
}
