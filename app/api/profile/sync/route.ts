import { NextResponse } from "next/server";
import { ensureCurrentProfile } from "@/lib/server-profile";

export async function POST() {
  try {
    const profile = await ensureCurrentProfile();

    if (!profile) {
      return NextResponse.json({ ok: false, message: "Usuario nao autenticado." }, { status: 401 });
    }

    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Falha ao sincronizar o perfil." },
      { status: 500 }
    );
  }
}
