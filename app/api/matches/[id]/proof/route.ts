import { NextResponse } from "next/server";
import { uploadGenericImage } from "@/lib/image-storage";

// POST /api/matches/[id]/proof  (FormData: file)
// Upload de print pra anexar ao envio de resultado ou contestação.
// Retorna a URL; cliente passa essa URL no submit-result ou dispute.

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "Tipo inválido. Use JPG, PNG ou WEBP." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Máximo ${MAX_BYTES / 1024 / 1024} MB` },
      { status: 413 }
    );
  }
  try {
    const result = await uploadGenericImage({
      folder: `matches/${id}`,
      basename: `proof-${Date.now()}`,
      file
    });
    return NextResponse.json({ ok: true, url: result.url, backend: result.backend });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}
