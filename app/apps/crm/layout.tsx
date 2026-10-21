import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCrmMember } from "@/lib/supabase-server";
import CrmShell from "../CrmShell";
import "../clrcrm.css";
import "./crm.css";

export const metadata: Metadata = {
  title: "CRM | ClearMark",
  robots: { index: false, follow: false },
};

// Frame for the Products price list (the one page kept from the old CRM, Oct 14; the
// old lead pages were retired for the new CRM at /apps/crm). Only CRM members get in.
export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const member = await getCrmMember();
  if (!member) redirect("/apps/login?denied=1");

  return (
    <CrmShell current="products" username={member.username}>
      <main className="crm-app">{children}</main>
    </CrmShell>
  );
}
