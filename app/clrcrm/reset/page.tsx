import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase-server";
import AuthCard from "../AuthCard";
import ResetForm from "./ResetForm";
import "../clrcrm.css";

export const metadata: Metadata = {
  title: "Choose a new password | ClearMark",
  robots: { index: false, follow: false },
};

export default async function ResetPage() {
  // Only reachable through the emailed link, which logs the person in first.
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/clrcrm/forgot?expired=1");
  return (
    <AuthCard title="Choose a new password">
      <ResetForm />
    </AuthCard>
  );
}
