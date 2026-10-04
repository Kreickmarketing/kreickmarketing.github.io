import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCrmMember } from "@/lib/supabase-server";
import CrmShell from "./CrmShell";
import { playbookHtml } from "./playbook-content";
import PlaybookControls from "./PlaybookControls";
import "./clrcrm.css";

export const metadata: Metadata = {
  title: "Brand Playbook | ClearMark",
  robots: { index: false, follow: false },
};

export default async function ClrCrmPage() {
  const member = await getCrmMember();
  if (!member) redirect("/clrcrm/login?denied=1");

  return (
    <CrmShell current="playbook" username={member.username}>
      {/* Our own fixed content, not visitor input, so rendering it as HTML is safe. */}
      <div id="playbook" dangerouslySetInnerHTML={{ __html: playbookHtml }} />
      <PlaybookControls />
    </CrmShell>
  );
}
