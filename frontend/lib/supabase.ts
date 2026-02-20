import { createClient, SupabaseClient } from "@supabase/supabase-js";

const globalForSupabase = globalThis as unknown as {
  supabase: SupabaseClient;
};

function makeSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars",
    );
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

/** Server-side Supabase client (service role, bypasses RLS). */
export function getSupabase(): SupabaseClient {
  const client = globalForSupabase.supabase ?? makeSupabase();

  if (process.env.NODE_ENV !== "production") {
    globalForSupabase.supabase = client;
  }

  return client;
}
