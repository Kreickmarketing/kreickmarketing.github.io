"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase-server";
import { safeNext } from "./next-path";

export type LoginState = { error: string };
export type ResetState = { error: string; sent?: boolean };

// Usernames are stored in Supabase as emails: "andrew" logs in as andrew@clearmark.bz.
// A full email address also works.
const USERNAME_DOMAIN = "clearmark.bz";

function toEmail(username: string) {
  return username.includes("@") ? username : `${username}@${USERNAME_DOMAIN}`;
}

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "Enter your username and password." };

  const email = toEmail(username);
  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  // Same message for every failure, so it doesn't reveal which usernames exist.
  if (error) return { error: "That username and password don't match." };

  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  const supabase = await getServerSupabase();
  await supabase.auth.signOut();
  redirect("/clrcrm/login");
}

// Step 1 of a password reset: email a link. The link returns to /clrcrm/auth/callback,
// which logs the person in and sends them to /clrcrm/reset to choose a new password.
export async function requestPasswordReset(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  if (!username) return { error: "Enter your username." };

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.resetPasswordForEmail(toEmail(username), {
    redirectTo: `${origin}/clrcrm/auth/callback?next=/clrcrm/reset`,
  });
  // Rate limits are the one failure worth telling apart; otherwise reply the same
  // either way, so the form doesn't reveal which usernames exist.
  if (error && error.status === 429) return { error: "Too many reset emails. Wait a few minutes and try again." };
  return { error: "", sent: true };
}

// Step 2: save the new password for whoever the reset link logged in.
export async function updatePassword(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 10) return { error: "Use at least 10 characters." };
  if (password !== confirm) return { error: "The two passwords don't match." };

  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "This reset link has expired. Ask for a new one." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Couldn't save the new password. Try a different one." };

  redirect("/clrcrm");
}
