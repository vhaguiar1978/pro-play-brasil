import "server-only";

export type NewUserWhatsAppAlert = {
  fullName: string;
  email: string;
  gamertag: string;
  platform: string;
  whatsapp: string;
  createdAt: string;
};

function normalizePhone(value: string | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return "";

  // If a country code is already present, keep it.
  if (digits.length >= 11) {
    return `+${digits}`;
  }

  // Brazilian local/mobile numbers usually arrive without country code.
  return digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
}

function toWhatsAppAddress(value: string | undefined) {
  const normalized = normalizePhone(value);
  return normalized ? `whatsapp:${normalized}` : "";
}

function buildFallbackBody(payload: NewUserWhatsAppAlert) {
  const createdAt = new Date(payload.createdAt).toLocaleString("pt-BR");

  return [
    "Novo usuario no Pro Play Brasil",
    `Nome: ${payload.fullName}`,
    `Email: ${payload.email}`,
    `Gamertag: ${payload.gamertag}`,
    `Plataforma: ${payload.platform}`,
    `WhatsApp: ${payload.whatsapp}`,
    `Data: ${createdAt}`
  ].join("\n");
}

export function isWhatsAppAlertConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_FROM &&
      process.env.ADMIN_WHATSAPP_TO
  );
}

export async function sendNewUserWhatsAppAlert(payload: NewUserWhatsAppAlert) {
  if (!isWhatsAppAlertConfigured()) {
    return { ok: false as const, reason: "not_configured" as const };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const from = toWhatsAppAddress(process.env.TWILIO_WHATSAPP_FROM);
  const to = toWhatsAppAddress(process.env.ADMIN_WHATSAPP_TO);
  const contentSid = process.env.TWILIO_WHATSAPP_CONTENT_SID?.trim();

  const body = new URLSearchParams();
  body.set("From", from);
  body.set("To", to);

  if (contentSid) {
    body.set("ContentSid", contentSid);
    body.set(
      "ContentVariables",
      JSON.stringify({
        full_name: payload.fullName,
        email: payload.email,
        gamertag: payload.gamertag,
        platform: payload.platform,
        whatsapp: payload.whatsapp,
        created_at: new Date(payload.createdAt).toLocaleString("pt-BR")
      })
    );
  } else {
    body.set("Body", buildFallbackBody(payload));
  }

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString(),
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Twilio WhatsApp retornou erro: ${text}`);
  }

  return { ok: true as const };
}
