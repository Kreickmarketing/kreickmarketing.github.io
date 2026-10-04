"use server";

import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase-server";

export type LoginState = { error: string };

// Usernames are stored in Supabase as emails: "andrew" logs in as andrew@clearmark.bz.
// A full email address also works.
const USERNAME_DOMAIN = "clearmark.bz";

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "Enter your username and password." };

  const email = username.includes("@") ? username : `${username}@${USERNAME_DOMAIN}`;
  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  // Same message for every failure, so it doesn't reveal which usernames exist.
  if (error) return { error: "That username and password don't match." };

  redirect("/clrcrm");
}

export async function signOut() {
  const supabase = await getServerSupabase();
  await supabase.auth.signOut();
  redirect("/clrcrm/login");
}
