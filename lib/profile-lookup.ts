import "server-only";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/admin-client";

// Lookup server-side: gamertag → email do profile.
// Usado por triggers de notificação que precisam mandar email externo.
// Retorna null se Supabase não tá configurado ou se o gamertag não existe.

/** Cache simples em memória pra não martelar Supabase quando uma rodada
 * de notificações dispara várias chamadas pro mesmo nick. */
const cache = new Map<string, { email: string | null; expires: number }>();
const TTL_MS = 60_000;

export async function lookupEmailByGamertag(gamertag: string): Promise<string | null> {
  const key = gamertag.trim().toLowerCase();
  if (!key) return null;

  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.email;

  if (!isSupabaseAdminConfigured()) {
    cache.set(key, { email: null, expires: Date.now() + TTL_MS });
    return null;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("profiles")
      .select("email")
      .ilike("gamertag", gamertag.trim())
      .maybeSingle();
    const email = (data as { email?: string } | null)?.email?.trim() || null;
    cache.set(key, { email, expires: Date.now() + TTL_MS });
    return email;
  } catch {
    cache.set(key, { email: null, expires: Date.now() + TTL_MS });
    return null;
  }
}
