import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente admin com service-role key — bypassa RLS.
// USAR APENAS EM CÓDIGO SERVER-SIDE (route handlers, server components).
// NUNCA importar em código que vai pro browser.

// Como não temos types do schema gerados, deixamos a tipagem genérica com `any`
// pra aceitar qualquer table. Sem isso, upsert/insert reclamam de tipo `never`.
/* eslint-disable-next-line */
type GenericClient = SupabaseClient<any, any, any>;

let cachedClient: GenericClient | null = null;

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function getSupabaseAdmin(): GenericClient {
  if (!isSupabaseAdminConfigured()) {
    throw new Error(
      "Supabase admin não configurado. Defina SUPABASE_SERVICE_ROLE_KEY no .env.local."
    );
  }
  if (!cachedClient) {
    cachedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    ) as GenericClient;
  }
  return cachedClient;
}
