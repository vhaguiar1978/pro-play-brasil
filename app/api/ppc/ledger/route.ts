import { NextResponse } from "next/server";
import { getCurrentUserPpcLedger } from "@/lib/ppc-ledger-server";

export async function GET() {
  try {
    const ledger = await getCurrentUserPpcLedger();

    if (!ledger) {
      return NextResponse.json({ ok: false, message: "Usuario nao autenticado." }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      balance: ledger.balance,
      entries: ledger.entries
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao consultar a carteira PPC.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
