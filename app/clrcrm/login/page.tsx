import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCrmMember } from "@/lib/supabase-server";
import LoginForm from "./LoginForm";
import "../clrcrm.css";

export const metadata: Metadata = {
  title: "Log in | ClearMark",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  if (await getCrmMember()) redirect("/clrcrm");
  const { denied } = await searchParams;
  return (
    <main className="crm-login">
      <div className="crm-login-card">
        <div className="crm-login-head">
          <Image src="/logo-white.png" alt="ClearMark" width={160} height={40} className="crm-login-logo" />
        </div>
        <div className="crm-login-body">
          <p className="tagline">Team only</p>
          <h6>Log in</h6>
          {denied && (
            <p className="form-note-error text-sm-normal">This account doesn&apos;t have access. Log in with a team account.</p>
          )}
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
