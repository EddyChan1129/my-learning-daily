import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const globalForSupabase = globalThis as typeof globalThis & {
  supabaseClient?: SupabaseClient;
};

export function getSupabase() {
  if (!url || !anonKey) return null;

  globalForSupabase.supabaseClient ??= createClient(url, anonKey);
  return globalForSupabase.supabaseClient;
}
