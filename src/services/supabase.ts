import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function getSupabase() {
  if (!supabase) {
    console.warn("[WARN] Supabase not configured — SUPABASE_URL or SUPABASE_ANON_KEY missing.");
  }
  return supabase;
}
