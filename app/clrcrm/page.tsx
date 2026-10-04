import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCrmMember } from "@/lib/supabase-server";
import { signOut } from "./actions";
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
    <div className="crm">
      <header className="crm-bar">
        <Image src="/logo-white.png" alt="ClearMark" width={128} height={32} />
        <div className="crm-bar-user">
          <span className="text-sm-normal">{member.username}</span>
          <form action={signOut}>
            <button type="submit" className="button button-outline">Log out</button>
          </form>
        </div>
      </header>
      {/* Our own fixed content, not visitor input, so rendering it as HTML is safe. */}
      <div id="playbook" dangerouslySetInnerHTML={{ __html: playbookHtml }} />
      <PlaybookControls />
    </div>
  );
}
