import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCrmMember } from "@/lib/supabase-server";
import CrmShell from "../CrmShell";
import DriveApp from "./DriveApp";
import "../clrcrm.css";
import "../studio/studio.css";
import "./drive.css";

export const metadata: Metadata = {
  title: "Drive | ClearMark",
  robots: { index: false, follow: false },
};

// Clearmark Drive: every file in folders (lib/drive.ts, supabase/drive.sql). ?folder=<id> opens one.
export default async function DrivePage({ searchParams }: { searchParams: Promise<{ folder?: string }> }) {
  const member = await getCrmMember();
  if (!member) redirect("/apps/login?denied=1");
  const { folder } = await searchParams;
  return (
    <CrmShell current="drive" username={member.username} className="studio drive">
      <DriveApp initialFolder={folder ?? null} />
    </CrmShell>
  );
}
