import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCrmMember } from "@/lib/supabase-server";
import CrmShell from "./CrmShell";
import { APPS, type AppCard } from "./apps-list";
import "./clrcrm.css";
import "./studio/studio.css";

export const metadata: Metadata = {
  title: "Clearmark Apps",
  robots: { index: false, follow: false },
};

// Clearmark Apps: a card per team app, in the same style as Studio's My Sites.
export default async function AppsHome() {
  const member = await getCrmMember();
  if (!member) redirect("/apps/login?denied=1");

  return (
    <CrmShell current="apps" username={member.username} className="studio">
      <main className="studio-app">
        <div className="studio-page">
          <div className="studio-head">
            <p className="studio-kicker">Team</p>
            <h1>Clearmark Apps</h1>
          </div>
          <ul className="studio-sites">
            {APPS.map((app) => (
              <li key={app.key}>
                {app.status === "coming"
                  ? <div className="studio-site studio-site-coming" aria-disabled="true"><Card app={app} /></div>
                  : app.fullLoad
                    ? <a href={app.href} className="studio-site"><Card app={app} /></a>
                    : <Link href={app.href} className="studio-site"><Card app={app} /></Link>}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </CrmShell>
  );
}

function Card({ app }: { app: AppCard }) {
  return (
    <>
      <div className="studio-thumb">
        {app.thumbnail
          ? <Image src={app.thumbnail} alt="" fill sizes="(max-width: 700px) 100vw, 360px" />
          : <span className="studio-thumb-letter" aria-hidden="true">{app.name[0]}</span>}
        {app.status === "coming" && <span className="studio-pill studio-pill-coming">Coming</span>}
      </div>
      <div className="studio-site-body">
        <h2>{app.name}</h2>
        <p>{app.blurb}</p>
        <p className="studio-meta">{app.status === "coming" ? "Not connected yet" : app.href}</p>
      </div>
    </>
  );
}
