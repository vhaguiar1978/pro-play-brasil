import { NextRequest, NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/admin-access-server";
import { createClient } from "@/lib/supabase/server";

// GET — lista sessoes de caixa (mais recentes primeiro)
export async function GET() {
  const access = await getServerAdminAccess();
  if (!access.canAccess) {
    return NextResponse.json({ ok: false, message: "Acesso restrito." }, { status: 403 });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cash_register_sessions")
      .select("*")
      .order("opened_at", { ascending: false })
      .limit(30);

    if (error) throw error;

    return NextResponse.json({ ok: true, sessions: data ?? [] });
  } catch {
    return NextResponse.json({ ok: false, message: "Tabela nao encontrada. Execute o SQL de criacao da caixa." }, { status: 500 });
  }
}

// POST — abre novo caixa { openingBalance, notes }
export async function POST(request: NextRequest) {
  const access = await getServerAdminAccess();
  if (!access.canAccess) {
    return NextResponse.json({ ok: false, message: "Acesso restrito." }, { status: 403 });
  }

  const body = (await request.json()) as { openingBalance?: number; notes?: string };
  const openingBalance = typeof body.openingBalance === "number" ? body.openingBalance : 0;
  const notes = (body.notes ?? "").trim();

  try {
    const supabase = await createClient();

    // Verifica se ja tem caixa aberto
    const { data: open } = await supabase
      .from("cash_register_sessions")
      .select("id")
      .eq("status", "open")
      .limit(1)
      .single();

    if (open) {
      return NextResponse.json({ ok: false, message: "Ja existe um caixa aberto. Feche-o antes de abrir um novo." }, { status: 409 });
    }

    const now = new Date();
    const { data, error } = await supabase
      .from("cash_register_sessions")
      .insert({
        date: now.toISOString().slice(0, 10),
        opened_at: now.toISOString(),
        opening_balance: openingBalance,
        notes,
        status: "open"
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, session: data }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, message: "Erro ao abrir caixa. Verifique se a tabela existe no Supabase." }, { status: 500 });
  }
}

// PATCH — fecha caixa existente { id, closingBalance, notes }
export async function PATCH(request: NextRequest) {
  const access = await getServerAdminAccess();
  if (!access.canAccess) {
    return NextResponse.json({ ok: false, message: "Acesso restrito." }, { status: 403 });
  }

  const body = (await request.json()) as { id?: string; closingBalance?: number; notes?: string };
  if (!body.id) {
    return NextResponse.json({ ok: false, message: "ID do caixa obrigatorio." }, { status: 400 });
  }

  const closingBalance = typeof body.closingBalance === "number" ? body.closingBalance : 0;
  const notes = (body.notes ?? "").trim();

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cash_register_sessions")
      .update({
        closed_at: new Date().toISOString(),
        closing_balance: closingBalance,
        notes: notes || undefined,
        status: "closed"
      })
      .eq("id", body.id)
      .eq("status", "open")
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, session: data });
  } catch {
    return NextResponse.json({ ok: false, message: "Erro ao fechar caixa." }, { status: 500 });
  }
}
