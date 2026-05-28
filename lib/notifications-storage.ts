import "server-only";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin-client";
import { lookupEmailByGamertag } from "@/lib/profile-lookup";
import { isEmailSenderConfigured, sendEmail } from "@/lib/email-sender";
import { getSiteUrl } from "@/lib/site-url";

/** Tipos que disparam push externo (e-mail), além do sino in-site. */
const CRITICAL_TYPES = new Set<NotificationType>([
  "match_ready",
  "match_disputed",
  "match_finalized",
  "bracket_generated"
]);

const SITE_URL = getSiteUrl();

async function maybeSendEmail(n: Notification): Promise<void> {
  if (!isEmailSenderConfigured()) return;
  if (!CRITICAL_TYPES.has(n.type)) return;
  const email = await lookupEmailByGamertag(n.recipientNick);
  if (!email) return;
  const linkAbsolute = n.link ? `${SITE_URL}${n.link.startsWith("/") ? n.link : `/${n.link}`}` : null;
  const html = `
    <div style="font-family: system-ui, sans-serif; max-width:480px; margin:0 auto; padding:24px; background:#06070B; color:#fff; border-radius:16px;">
      <div style="color:#FF6A00; font-size:11px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase;">Pro Play Brasil</div>
      <h2 style="margin:8px 0 12px; font-size:22px;">${escapeHtml(n.title)}</h2>
      <p style="margin:0 0 16px; line-height:1.5; color:rgba(255,255,255,0.8);">${escapeHtml(n.body)}</p>
      ${linkAbsolute ? `<a href="${linkAbsolute}" style="display:inline-block; padding:10px 18px; background:#FF6A00; color:#06070B; text-decoration:none; font-weight:800; border-radius:10px; text-transform:uppercase; letter-spacing:0.1em; font-size:13px;">Ver detalhes</a>` : ""}
    </div>
  `.trim();
  await sendEmail({ to: email, subject: n.title, html, text: `${n.body}${linkAbsolute ? `\n\n${linkAbsolute}` : ""}` });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;"
  );
}

// Notificações in-site (sino no header).
// Backend: filesystem (dev) → Supabase (prod).
// SQL: ver docs/SUPABASE_MIGRATION.md (table: notifications).

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "notifications.json");
const TABLE = "notifications";

/** Limite por destinatário — trim automático no insert pra não inflar. */
const PER_NICK_LIMIT = 50;

export type NotificationType =
  | "match_ready"
  | "match_result_submitted"
  | "match_disputed"
  | "match_finalized"
  | "bracket_generated";

export type Notification = {
  id: string;
  recipientNick: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

function shouldUseSupabase(): boolean {
  return isSupabaseAdminConfigured();
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

type DbRow = {
  id: string;
  recipient_nick: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

function rowToNotification(row: DbRow): Notification {
  return {
    id: row.id,
    recipientNick: row.recipient_nick,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    read: row.read,
    createdAt: row.created_at
  };
}

function notificationToRow(n: Notification): DbRow {
  return {
    id: n.id,
    recipient_nick: n.recipientNick,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
    read: n.read,
    created_at: n.createdAt
  };
}

function norm(value: string): string {
  return value.trim().toLowerCase();
}

export async function readNotifications(nick: string): Promise<Notification[]> {
  const key = norm(nick);
  if (!key) return [];
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("recipient_nick", key)
      .order("created_at", { ascending: false })
      .limit(PER_NICK_LIMIT);
    if (error) throw new Error(`Supabase readNotifications: ${error.message}`);
    return (data ?? []).map((r) => rowToNotification(r as DbRow));
  }
  const all = await readJson<Notification[]>(FILE, []);
  return all
    .filter((n) => norm(n.recipientNick) === key)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, PER_NICK_LIMIT);
}

export async function createNotification(input: {
  recipientNick: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
}): Promise<Notification | null> {
  const recipient = input.recipientNick.trim();
  if (!recipient) return null;

  const notification: Notification = {
    id: randomUUID(),
    recipientNick: recipient,
    type: input.type,
    title: input.title.slice(0, 120),
    body: input.body.slice(0, 280),
    link: input.link ?? null,
    read: false,
    createdAt: new Date().toISOString()
  };

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from(TABLE).insert(notificationToRow(notification));
    if (error) throw new Error(`Supabase createNotification: ${error.message}`);
    // Fire-and-forget email: não bloqueia a notificação in-site se Resend falhar
    void maybeSendEmail(notification).catch((err) =>
      console.warn("[notifications] email push falhou:", err)
    );
    return notification;
  }

  const all = await readJson<Notification[]>(FILE, []);
  all.push(notification);
  // Trim leve: mantém só as PER_NICK_LIMIT mais recentes por nick
  const trimmed: Notification[] = [];
  const counts = new Map<string, number>();
  for (const n of [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt))) {
    const k = norm(n.recipientNick);
    const c = counts.get(k) ?? 0;
    if (c < PER_NICK_LIMIT) {
      trimmed.push(n);
      counts.set(k, c + 1);
    }
  }
  await writeJson(FILE, trimmed);
  void maybeSendEmail(notification).catch((err) =>
    console.warn("[notifications] email push falhou:", err)
  );
  return notification;
}

export async function markNotificationRead(
  id: string,
  nick: string
): Promise<{ ok: boolean }> {
  const key = norm(nick);
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from(TABLE)
      .update({ read: true })
      .eq("id", id)
      .eq("recipient_nick", key);
    if (error) throw new Error(`Supabase markNotificationRead: ${error.message}`);
    return { ok: true };
  }
  const all = await readJson<Notification[]>(FILE, []);
  const idx = all.findIndex((n) => n.id === id && norm(n.recipientNick) === key);
  if (idx >= 0) {
    all[idx] = { ...all[idx], read: true };
    await writeJson(FILE, all);
  }
  return { ok: true };
}

export async function markAllNotificationsRead(nick: string): Promise<{ ok: boolean }> {
  const key = norm(nick);
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from(TABLE)
      .update({ read: true })
      .eq("recipient_nick", key)
      .eq("read", false);
    if (error) throw new Error(`Supabase markAllNotificationsRead: ${error.message}`);
    return { ok: true };
  }
  const all = await readJson<Notification[]>(FILE, []);
  let changed = false;
  for (let i = 0; i < all.length; i++) {
    if (norm(all[i].recipientNick) === key && !all[i].read) {
      all[i] = { ...all[i], read: true };
      changed = true;
    }
  }
  if (changed) await writeJson(FILE, all);
  return { ok: true };
}
