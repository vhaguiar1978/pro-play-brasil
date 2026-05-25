import { NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/admin-access-server";
import { uploadGameImage } from "@/lib/image-storage";

const ALLOWED_SLOTS = ["cover", "hero", "gallery1", "gallery2", "gallery3"] as const;
type Slot = (typeof ALLOWED_SLOTS)[number];

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 4 * 1024 * 1024; // 4MB
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,40}$/;

// Backend de storage selecionado automaticamente:
// - SUPABASE_SERVICE_ROLE_KEY definido → Supabase Storage (prod)
// - Sem variável → filesystem local /public/games (dev)
// Ver lib/image-storage.ts e docs/SUPABASE_MIGRATION.md

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { canAccess } = await getServerAdminAccess();
  if (!canAccess) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { slug } = await params;
  if (!SLUG_REGEX.test(slug)) {
    return NextResponse.json({ error: "Slug inválido" }, { status: 400 });
  }

  const formData = await request.formData();
  const slot = String(formData.get("slot") ?? "");
  const file = formData.get("file");

  if (!ALLOWED_SLOTS.includes(slot as Slot)) {
    return NextResponse.json(
      { error: `Slot inválido. Use: ${ALLOWED_SLOTS.join(", ")}` },
      { status: 400 }
    );
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "Tipo de arquivo não suportado. Use JPG, PNG ou WEBP." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Arquivo muito grande. Máximo ${MAX_BYTES / 1024 / 1024} MB.` },
      { status: 413 }
    );
  }

  try {
    const result = await uploadGameImage(slug, slot, file);
    return NextResponse.json({
      ok: true,
      url: result.url,
      backend: result.backend,
      slot,
      slug
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro no upload" },
      { status: 500 }
    );
  }
}
