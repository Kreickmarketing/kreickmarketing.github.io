import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCrmMember } from "@/lib/supabase-server";
import CrmShell from "../CrmShell";
import "../clrcrm.css";
import "./studio.css";

export const metadata: Metadata = {
  title: "Studio | ClearMark",
  robots: { index: false, follow: false },
};

// Studio: Andrew's website editor. Dark panels (like Figma and Framer) so the
// editor never looks like the sites it edits. Only CRM members get in.
export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const member = await getCrmMember();
  if (!member) redirect("/clrcrm/login?denied=1");

  return (
    <CrmShell current="studio" username={member.username} className="studio">
      <main className="studio-app">{children}</main>
    </CrmShell>
  );
}
