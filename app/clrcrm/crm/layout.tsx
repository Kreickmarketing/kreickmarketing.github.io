import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCrmMember } from "@/lib/supabase-server";
import CrmShell from "../CrmShell";
import CrmTabs from "./CrmTabs";
import "../clrcrm.css";
import "./crm.css";

export const metadata: Metadata = {
  title: "CRM | ClearMark",
  robots: { index: false, follow: false },
};

// Every CRM view sits inside this frame: the team menu on top, the view tabs
// below it (a bottom tab bar on phones). Only CRM members get past the check.
export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const member = await getCrmMember();
  if (!member) redirect("/clrcrm/login?denied=1");

  return (
    <CrmShell current="crm" username={member.username}>
      <CrmTabs />
      <main className="crm-app">{children}</main>
    </CrmShell>
  );
}
