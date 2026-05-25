import "server-only";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin-client";

// Abstração de storage de imagens. Detecta automaticamente o backend:
// - Se SUPABASE_SERVICE_ROLE_KEY estiver definido → usa Supabase Storage (bucket "games")
// - Senão → grava em /public/<folder>/ (modo dev local)

export type UploadResult = {
  url: string;
  backend: "fs" | "supabase";
};

const BUCKET = "games";

export function getStorageBackend(): "fs" | "supabase" {
  return isSupabaseAdminConfigured() ? "supabase" : "fs";
}

function extFromMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

/** Upload da imagem do jogo (cover/hero/gallery). */
export async function uploadGameImage(
  slug: string,
  slot: string,
  file: File
): Promise<UploadResult> {
  const ext = extFromMime(file.type);
  const buffer = Buffer.from(await file.arrayBuffer());
  return uploadAny({
    folder: `games/${slug}`,
    filename: `${slot}.${ext}`,
    buffer,
    mime: file.type
  });
}

/** Upload genérico — usado por prints de partida (folder = "matches/<id>", etc). */
export async function uploadGenericImage(input: {
  folder: string;
  basename: string;
  file: File;
}): Promise<UploadResult> {
  const ext = extFromMime(input.file.type);
  const buffer = Buffer.from(await input.file.arrayBuffer());
  return uploadAny({
    folder: input.folder,
    filename: `${input.basename}.${ext}`,
    buffer,
    mime: input.file.type
  });
}

async function uploadAny(input: {
  folder: string;
  filename: string;
  buffer: Buffer;
  mime: string;
}): Promise<UploadResult> {
  if (getStorageBackend() === "supabase") {
    const supabase = getSupabaseAdmin();
    const objectPath = `${input.folder}/${input.filename}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, input.buffer, {
        contentType: input.mime,
        upsert: true,
        cacheControl: "3600"
      });
    if (error) throw new Error(`Supabase upload falhou: ${error.message}`);
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
    return { url: `${data.publicUrl}?v=${Date.now()}`, backend: "supabase" };
  }

  // FS local — escreve em /public/<folder>/<filename>
  const dir = path.join(process.cwd(), "public", ...input.folder.split("/"));
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, input.filename), input.buffer);
  return {
    url: `/${input.folder}/${input.filename}?v=${Date.now()}`,
    backend: "fs"
  };
}
