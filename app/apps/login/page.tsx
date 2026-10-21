import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCrmMember } from "@/lib/supabase-server";
import AuthCard from "../AuthCard";
import LoginForm from "./LoginForm";
import { safeNext } from "../next-path";
import "../clrcrm.css";

export const metadata: Metadata = {
  title: "Log in | ClearMark",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ denied?: string; next?: string }> }) {
  const { denied, next } = await searchParams;
  const goTo = safeNext(next);
  if (await getCrmMember()) redirect(goTo);
  return (
    <AuthCard title="Log in">
      {denied && (
        <p className="form-note-error text-sm-normal">This account doesn&apos;t have access. Log in with a team account.</p>
      )}
      <LoginForm next={goTo} />
    </AuthCard>
  );
}
