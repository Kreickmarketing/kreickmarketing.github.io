import { createClient } from "@supabase/supabase-js";

// Connects to Supabase using the public URL and anon key from .env.local.
// The anon key is safe here: Row Level Security decides what it can do.
export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase settings. Copy .env.example to .env.local and fill it in.");
  }
  return createClient(url, key);
}
