import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCrmMember } from "@/lib/supabase-server";
import CrmShell from "../../CrmShell";
import "../../clrcrm.css";
import "../create.css";

export const metadata: Metadata = {
  title: "FigCraft | ClearMark",
  robots: { index: false, follow: false },
};

// FigCraft's web build (public/apps/create/figcraft/app/) in a full-height frame under the team bar.
// It runs entirely in the browser; nothing is saved to Supabase yet.
export default async function FigCraftPage() {
  const member = await getCrmMember();
  if (!member) redirect("/apps/login?denied=1");
  return (
    <CrmShell current="create" username={member.username} className="craft-full">
      <iframe
        src="/apps/create/figcraft/app/index.html"
        title="FigCraft interface design tool"
        className="craft-frame"
        allow="fullscreen; clipboard-read; clipboard-write"
        allowFullScreen
      />
    </CrmShell>
  );
}
