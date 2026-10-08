import Image from "next/image";
import Link from "next/link";
import { getSites, shortDate, type SiteRow } from "./queries";

// My Sites: a card per site, like Framer's "All projects" page.
export default async function MySites() {
  const sites = await getSites();

  return (
    <div className="studio-page">
      <div className="studio-head">
        <p className="studio-kicker">Studio</p>
        <h1>My Sites</h1>
      </div>

      {sites.length === 0 ? (
        <p className="studio-empty">No sites yet.</p>
      ) : (
        <ul className="studio-sites">
          {sites.map((s) => (
            <li key={s.id}>
              {s.status === "coming"
                ? <div className="studio-site studio-site-coming" aria-disabled="true"><SiteCard site={s} /></div>
                // ClearMark opens the Studio builder (a full page load: it isn't a React page).
                : s.slug === "clearmark"
                  ? <a href="/clrcrm/studio/builder" className="studio-site"><SiteCard site={s} /></a>
                  : <Link href={`/clrcrm/studio/${s.slug}`} className="studio-site"><SiteCard site={s} /></Link>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SiteCard({ site: s }: { site: SiteRow }) {
  const pageCount = s.pages[0]?.count ?? 0;
  return (
    <>
      <div className="studio-thumb">
        {s.settings.thumbnail
          ? <Image src={s.settings.thumbnail} alt="" fill sizes="(max-width: 700px) 100vw, 360px" />
          : <span className="studio-thumb-letter" aria-hidden="true">{s.name[0]}</span>}
        {s.status === "coming" && <span className="studio-pill studio-pill-coming">Coming</span>}
      </div>
      <div className="studio-site-body">
        <h2>{s.name}</h2>
        <p>{s.domain ?? "No domain yet"}</p>
        <p className="studio-meta">
          {s.status === "coming"
            ? "Not connected yet"
            : `${pageCount} ${pageCount === 1 ? "page" : "pages"} · Edited ${shortDate(s.updated_at)}`}
        </p>
      </div>
    </>
  );
}
