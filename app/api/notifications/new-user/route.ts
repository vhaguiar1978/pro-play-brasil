import { NextResponse } from "next/server";
import { sendNewUserWhatsAppAlert, type NewUserWhatsAppAlert } from "@/lib/whatsapp-alerts";

function readText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<NewUserWhatsAppAlert>;
    const payload: NewUserWhatsAppAlert = {
      fullName: readText(body.fullName),
      email: readText(body.email),
      gamertag: readText(body.gamertag),
      platform: readText(body.platform),
      whatsapp: readText(body.whatsapp),
      createdAt: readText(body.createdAt) || new Date().toISOString()
    };

    if (!payload.fullName || !payload.email || !payload.gamertag) {
      return NextResponse.json({ error: "Dados do novo usuario incompletos." }, { status: 400 });
    }

    const result = await sendNewUserWhatsAppAlert(payload);

    if (!result.ok) {
      return NextResponse.json({ ok: false, configured: false });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao disparar alerta de novo usuario.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
