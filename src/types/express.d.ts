import { SupabaseClient } from "@supabase/supabase-js";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        email: string;
        restaurantId: string | null;
        role: "owner" | "manager" | "staff" | null;
      };
      supabaseClient?: SupabaseClient;
    }
  }
}
