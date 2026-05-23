import { NextRequest, NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/admin-access-server";
import { createClient } from "@/lib/supabase/server";

// GET ?userId=xxx — lista etiquetas de um usuário específico
export async function GET(request: NextRequest) {
  const access = await getServerAdminAccess();
  if (!access.canAccess) {
    return NextResponse.json({ ok: false, message: "Acesso restrito." }, { status: 403 });
  }

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ ok: false, message: "userId obrigatorio." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_labels")
    .select("label_id, crm_labels(id,name,color)")
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, labels: (data ?? []).map((row) => row.crm_labels) });
}

// POST — atribui etiqueta a um usuario { userId, labelId }
export async function POST(request: NextRequest) {
  const access = await getServerAdminAccess();
  if (!access.canAccess) {
    return NextResponse.json({ ok: false, message: "Acesso restrito." }, { status: 403 });
  }

  const body = (await request.json()) as { userId?: string; labelId?: string };
  if (!body.userId || !body.labelId) {
    return NextResponse.json({ ok: false, message: "userId e labelId obrigatorios." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_labels")
    .upsert({ user_id: body.userId, label_id: body.labelId }, { onConflict: "user_id,label_id" });

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

// DELETE — remove etiqueta de um usuario { userId, labelId }
export async function DELETE(request: NextRequest) {
  const access = await getServerAdminAccess();
  if (!access.canAccess) {
    return NextResponse.json({ ok: false, message: "Acesso restrito." }, { status: 403 });
  }

  const body = (await request.json()) as { userId?: string; labelId?: string };
  if (!body.userId || !body.labelId) {
    return NextResponse.json({ ok: false, message: "userId e labelId obrigatorios." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_labels")
    .delete()
    .eq("user_id", body.userId)
    .eq("label_id", body.labelId);

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
