import type { LivePage } from "@/lib/builder-site";
import "@/styles/brands/kreick.css";

const HOME_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/></svg>';

// A Kreick Marketing page made in the Studio builder (km-* templates, drawn by lib/builder-site.ts).
// The nav matches the builder's: Home, the links from Global nav, and the red pill. The footer is
// a section of the page itself (km-footer). Only the Kreick stylesheet is loaded: nothing ClearMark.
export default function KmSitePage({ page }: { page: LivePage }) {
  const external = (href: string) => /^https?:/i.test(href);
  const out = (href: string) => (external(href) ? { target: "_blank", rel: "noopener noreferrer" } : {});
  return (
    <div className="brand-km">
      {page.css && <style dangerouslySetInnerHTML={{ __html: page.css }} />}
      <nav className="km-nav" aria-label="Main">
        <a className="km-nav-name" href="/"><span dangerouslySetInnerHTML={{ __html: HOME_ICON }} style={{ display: "contents" }} /><span>Home</span></a>
        <ul>
          {page.nav?.links.map((l, i) => <li key={i}><a href={l.href} {...out(l.href)}>{l.label}</a></li>)}
        </ul>
        {page.nav?.cta && <a className="km-pill sm" href={page.nav.cta.href} {...out(page.nav.cta.href)}>{page.nav.cta.label}</a>}
      </nav>
      {page.sections.map((sec) => sec.kind === "html" && <section key={sec.id} id={sec.id} className={sec.className} dangerouslySetInnerHTML={{ __html: sec.html }} />)}
    </div>
  );
}
