import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCrmMember } from "@/lib/supabase-server";
import CrmShell from "../CrmShell";
import InterviewDrill from "./InterviewDrill";
import "../clrcrm.css";
import "../crm/crm.css";
import "./interview.css";

export const metadata: Metadata = {
  title: "Interview drill | ClearMark",
  robots: { index: false, follow: false },
};

// Team-only interview practice. Everything runs in the browser; notes are never sent anywhere.
export default async function InterviewPage() {
  const member = await getCrmMember();
  if (!member) redirect("/clrcrm/login?denied=1");
  return (
    <CrmShell current="interview" username={member.username}>
      <InterviewDrill />
    </CrmShell>
  );
}
