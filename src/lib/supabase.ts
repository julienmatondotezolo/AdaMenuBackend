import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

/**
 * Admin Supabase client using the service role key.
 * Bypasses Row Level Security — use only in trusted server-side code.
 * Falls back to anon key if service key is not configured.
 */
let adminClient: SupabaseClient | null = null;

if (supabaseUrl && (supabaseServiceKey || supabaseAnonKey)) {
  adminClient = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey || "");
}

/**
 * Returns the admin Supabase client (service role).
 * Logs a warning if Supabase is not configured.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!adminClient) {
    console.warn(
      "[supabase] Not configured — set SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY)."
    );
  }
  return adminClient;
}

/**
 * Returns the admin Supabase client.
 * Alias for backwards compatibility with existing route code.
 */
export function getSupabase(): SupabaseClient | null {
  return getSupabaseAdmin();
}

export { adminClient as supabase };
