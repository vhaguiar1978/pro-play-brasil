import "server-only";

// Envio de e-mail via Resend (https://resend.com/docs/api-reference/emails/send-email).
// Sem RESEND_API_KEY definido, vira no-op silencioso. Sem EMAIL_FROM,
// usa um default visível pra ficar claro que a env está faltando.

type SendArgs = {
  to: string;
  subject: string;
  /** HTML body (pode usar tags básicas). Se vazio, manda só `text`. */
  html?: string;
  /** Texto puro de fallback. */
  text?: string;
};

export function isEmailSenderConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Envia um e-mail. Retorna `{ skipped: true }` se não houver key configurada,
 * `{ ok: true }` se enviou, ou `{ error }` em caso de falha. NUNCA lança —
 * pra não quebrar fluxos de notificação só por causa do envio externo.
 */
export async function sendEmail(args: SendArgs): Promise<
  { skipped: true } | { ok: true; id?: string } | { error: string }
> {
  if (!isEmailSenderConfigured()) return { skipped: true };
  if (!args.to.trim()) return { error: "destinatário vazio" };

  const from = process.env.EMAIL_FROM?.trim() || "Pro Play Brasil <no-reply@proplaybrasil.com>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from,
        to: [args.to],
        subject: args.subject,
        html: args.html,
        text: args.text ?? args.subject
      })
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { error: `Resend ${res.status}: ${detail.slice(0, 200)}` };
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: data.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao enviar email" };
  }
}
