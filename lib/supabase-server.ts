import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Supabase client for server code (pages, server actions) that knows who is
// logged in. The login is kept in a secure cookie that Supabase manages.
export async function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase settings. Copy .env.example to .env.local and fill it in.");
  }
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Pages can't set cookies; proxy.ts refreshes them instead.
        }
      },
    },
  });
}

// Returns the logged-in user only if they are on the CRM member list.
// getUser() checks the login with Supabase itself, so a faked cookie fails.
export async function getCrmMember() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: member } = await supabase
    .from("crm_members")
    .select("username")
    .eq("user_id", user.id)
    .maybeSingle();
  return member ? { user, username: member.username as string } : null;
}
