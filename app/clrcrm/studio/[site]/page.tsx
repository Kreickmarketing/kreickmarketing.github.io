import Link from "next/link";
import { notFound } from "next/navigation";
import { getSite, pageStatus, shortDate } from "../queries";

// One site: its pages, plus the CMS collections its cards pull from.
// Opening a page in the editor arrives in Studio step 3.
export default async function SitePages({ params }: { params: Promise<{ site: string }> }) {
  const { site: slug } = await params;
  const data = await getSite(slug);
  if (!data || data.site.status === "coming") notFound();
  const { site, pages, collections } = data;

  return (
    <div className="studio-page">
      <nav className="studio-crumbs" aria-label="Breadcrumb">
        <Link href="/clrcrm/studio">My Sites</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{site.name}</span>
      </nav>

      <div className="studio-head">
        <h1>{site.name}</h1>
        {site.domain && <p className="studio-meta">{site.domain}</p>}
      </div>

      <ul className="studio-tabs" aria-label="Site sections">
        <li><span aria-current="page">Pages</span></li>
        <li><span className="studio-soon">CMS</span></li>
        <li><span className="studio-soon">Settings</span></li>
        <li><span className="studio-soon">Versions</span></li>
      </ul>

      <section className="studio-panel" aria-labelledby="pages-title">
        <h2 id="pages-title">Pages</h2>
        {pages.length === 0 ? <p className="studio-empty">No pages yet.</p> : (
          <ul className="studio-rows">
            {pages.map((p) => {
              const status = pageStatus(p);
              const sections = p.draft.sections?.length ?? 0;
              return (
                <li key={p.id}>
                  <div className="studio-row-main">
                    <span className="studio-row-title">{p.title}</span>
                    <span className="studio-code">{p.slug}</span>
                  </div>
                  <span className="studio-meta">{sections} {sections === 1 ? "section" : "sections"} · Edited {shortDate(p.updated_at)}</span>
                  <span className={`studio-pill studio-pill-${status.key}`}>{status.label}</span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="studio-hint">Editing a page comes next (Studio step 3).</p>
      </section>

      <section className="studio-panel" aria-labelledby="cms-title">
        <h2 id="cms-title">CMS</h2>
        {collections.length === 0 ? <p className="studio-empty">No collections yet.</p> : (
          <ul className="studio-rows">
            {collections.map((c) => {
              const n = c.items[0]?.count ?? 0;
              return (
                <li key={c.id}>
                  <div className="studio-row-main"><span className="studio-row-title">{c.name}</span></div>
                  <span className="studio-meta">{n} {n === 1 ? "item" : "items"}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
