import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCrmMember } from "@/lib/supabase-server";
import CrmShell from "../CrmShell";
import "../clrcrm.css";

export const metadata: Metadata = {
  title: "Interview app | ClearMark",
  robots: { index: false, follow: false },
};

// Placeholder until this tool is built.
export default async function Page() {
  const member = await getCrmMember();
  if (!member) redirect("/clrcrm/login?denied=1");
  return (
    <CrmShell current="interview" username={member.username}>
      <main className="wrap crm-hero">
        <p className="who">Team tools</p>
        <h1>Interview app</h1>
        <p className="purpose">Coming soon.</p>
      </main>
    </CrmShell>
  );
}
