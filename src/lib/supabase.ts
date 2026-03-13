import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

let client: SupabaseClient | null = null;

if (url && serviceKey) {
  client = createClient(url, serviceKey);
}

export function getSupabase(): SupabaseClient {
  if (!client) throw new Error("Supabase not configured");
  return client;
}
