"use server";

import { getSupabase } from "@/lib/supabase";

export type SignupState = { status: "idle" | "success" | "error"; message: string };

export async function joinMailingList(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Please enter your name and a valid email." };
  }

  try {
    const { error } = await getSupabase().from("signups").insert({ name, email });
    if (error) {
      // 23505 = this email is already on the list
      if (error.code === "23505") return { status: "success", message: "You're already on the list." };
      console.error("Signup failed:", error.message);
      return { status: "error", message: "Something went wrong. Please try again." };
    }
  } catch (err) {
    console.error(err);
    return { status: "error", message: "Sign-ups aren't connected yet." };
  }

  return { status: "success", message: "Thanks, you're on the list." };
}
