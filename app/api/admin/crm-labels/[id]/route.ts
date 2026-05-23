import { NextRequest, NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/admin-access-server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

// DELETE — remove uma etiqueta (e todos os user_labels associados, via cascade)
export async function DELETE(_request: NextRequest, { params }: Params) {
  const access = await getServerAdminAccess();
  if (!access.canAccess) {
    return NextResponse.json({ ok: false, message: "Acesso restrito." }, { status: 403 });
  }

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from("crm_labels").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// PATCH — atualiza nome ou cor da etiqueta
export async function PATCH(request: NextRequest, { params }: Params) {
  const access = await getServerAdminAccess();
  if (!access.canAccess) {
    return NextResponse.json({ ok: false, message: "Acesso restrito." }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json()) as { name?: string; color?: string };
  const updates: { name?: string; color?: string } = {};
  if (body.name) updates.name = body.name.trim();
  if (body.color) updates.color = body.color.trim();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("crm_labels")
    .update(updates)
    .eq("id", id)
    .select("id,name,color,created_at")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, label: data });
}
