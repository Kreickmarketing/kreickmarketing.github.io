import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCrmMember } from "@/lib/supabase-server";
import CrmShell from "../CrmShell";
import "../clrcrm.css";

export const metadata: Metadata = {
  title: "CRM | ClearMark",
  robots: { index: false, follow: false },
};

// Placeholder until this tool is built.
export default async function Page() {
  const member = await getCrmMember();
  if (!member) redirect("/clrcrm/login?denied=1");
  return (
    <CrmShell current="crm" username={member.username}>
      <main className="wrap crm-hero">
        <p className="who">Team tools</p>
        <h1>CRM</h1>
        <p className="purpose">Your sales pipeline: every lead, its stage, the deal value and the next action. Coming next.</p>
      </main>
    </CrmShell>
  );
}
