import type { Metadata } from "next";
import AuthCard from "../AuthCard";
import ForgotForm from "./ForgotForm";
import "../clrcrm.css";

export const metadata: Metadata = {
  title: "Reset password | ClearMark",
  robots: { index: false, follow: false },
};

export default async function ForgotPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const { expired } = await searchParams;
  return (
    <AuthCard title="Reset password">
      {expired && (
        <p className="form-note-error text-sm-normal">That link has expired or was already used. Ask for a new one.</p>
      )}
      <p className="text-sm-normal">Enter your username and we&apos;ll email you a link to choose a new password.</p>
      <ForgotForm />
    </AuthCard>
  );
}
