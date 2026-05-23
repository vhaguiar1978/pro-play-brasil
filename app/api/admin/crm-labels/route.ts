import { NextRequest, NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/admin-access-server";
import { createClient } from "@/lib/supabase/server";

// GET — lista todas as etiquetas
export async function GET() {
  const access = await getServerAdminAccess();
  if (!access.canAccess) {
    return NextResponse.json({ ok: false, message: "Acesso restrito." }, { status: 403 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_labels")
    .select("id,name,color,created_at")
    .order("name");

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, labels: data ?? [] });
}

// POST — cria nova etiqueta
export async function POST(request: NextRequest) {
  const access = await getServerAdminAccess();
  if (!access.canAccess) {
    return NextResponse.json({ ok: false, message: "Acesso restrito." }, { status: 403 });
  }

  const body = (await request.json()) as { name?: string; color?: string };
  const name = (body.name ?? "").trim();
  const color = (body.color ?? "#ff6a00").trim();

  if (!name) {
    return NextResponse.json({ ok: false, message: "Nome da etiqueta obrigatorio." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_labels")
    .insert({ name, color })
    .select("id,name,color,created_at")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, label: data }, { status: 201 });
}
