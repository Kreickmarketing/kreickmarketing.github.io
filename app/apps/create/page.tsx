import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCrmMember } from "@/lib/supabase-server";
import CrmShell from "../CrmShell";
import { CRAFT_APPS } from "./craft-list";
import "../clrcrm.css";
import "../studio/studio.css";

export const metadata: Metadata = {
  title: "Create | ClearMark",
  robots: { index: false, follow: false },
};

// Create: a card per Craft app, in the same style as Clearmark Apps.
export default async function CreateHome() {
  const member = await getCrmMember();
  if (!member) redirect("/apps/login?denied=1");

  return (
    <CrmShell current="create" username={member.username} className="studio">
      <main className="studio-app">
        <div className="studio-page">
          <div className="studio-head">
            <p className="studio-kicker">Craft apps</p>
            <h1>Create</h1>
          </div>
          <ul className="studio-sites">
            {CRAFT_APPS.map((app) => {
              const card = (
                <>
                  <div className="studio-thumb">
                    <span className="studio-thumb-letter" aria-hidden="true">{app.name[0]}</span>
                    {app.status === "coming" && <span className="studio-pill studio-pill-coming">Coming</span>}
                  </div>
                  <div className="studio-site-body">
                    <h2>{app.name}</h2>
                    <p>{app.blurb}</p>
                    <p className="studio-meta">{app.status === "coming" ? "Not installed yet" : `/apps/create/${app.key}`}</p>
                  </div>
                </>
              );
              return (
                <li key={app.key}>
                  {app.status === "coming"
                    ? <div className="studio-site studio-site-coming" aria-disabled="true">{card}</div>
                    : <a href={`/apps/create/${app.key}`} className="studio-site">{card}</a>}
                </li>
              );
            })}
          </ul>
        </div>
      </main>
    </CrmShell>
  );
}
