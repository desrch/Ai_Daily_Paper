import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseServerKey, requireSupabaseUrl } from "@/lib/env";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseServerClient() {
  if (cachedClient) return cachedClient;

  cachedClient = createClient(requireSupabaseUrl(), requireSupabaseServerKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return cachedClient;
}

export function toCamelDate(value: unknown) {
  return typeof value === "string" ? new Date(value).toISOString() : new Date().toISOString();
}
