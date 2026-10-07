import SignupForm from "./SignupForm";
import type { LivePage } from "@/lib/builder-site";
import "./builder-site.css";

const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com";

// Nav links that jump to a section on the page, shown only when that section exists.
const JUMPS: [string, string][] = [["Solutions", "solutions"], ["Platforms", "platforms"]];

// A page made in the Studio builder. The section HTML comes from lib/builder-site.ts,
// which escapes all text and only allows safe links and local images. `paths` are the pages'
// addresses (set in Studio), so About and Pricing link to wherever those pages live.
export default function BuilderPage({ page, livePages = [], paths = {} }: { page: LivePage; livePages?: string[]; paths?: Record<string, string> }) {
  const ids = new Set(page.sections.map((s) => s.id));
  return (
    <div className="site">
      <header className={`bnav${page.navOverPhoto ? "" : " nav-bar"}`}>
        <a href="/" aria-label="ClearMark home"><img src="/studio-media/logo-white.png" alt="ClearMark Training" /></a>
        <nav aria-label="Main">
          <ul>
            <li><a href={paths.about ?? "/about"}>About</a></li>
            {JUMPS.filter(([, id]) => ids.has(id)).map(([label, id]) => <li key={id}><a href={`/#${id}`}>{label}</a></li>)}
            {livePages.includes("pricing") && paths.pricing ? <li><a href={paths.pricing}>Pricing</a></li> : ids.has("sol-offers") && <li><a href="#sol-offers">Pricing</a></li>}
            <li><a className="pill-cta" href={calendlyUrl} target="_blank" rel="noopener noreferrer">Book a call →</a></li>
          </ul>
        </nav>
      </header>
      {page.sections.map((sec) => {
        if (sec.kind === "mail") {
          return (
            <section key={sec.id} id={sec.id} className={sec.className}>
              <div>
                <p className="tagline">Mailing list</p>
                {sec.headline && <h2 data-slot=".headline">{sec.headline}</h2>}
                {sec.intro && <p data-slot=".intro">{sec.intro}</p>}
              </div>
              <SignupForm />
            </section>
          );
        }
        if (sec.kind === "calendly") {
          return (
            <section key={sec.id} id={sec.id} className={sec.className}>
              <div className="calendly">
                <b>Book a 15-minute call</b>
                <a className="cta cta-red" href={calendlyUrl} target="_blank" rel="noopener noreferrer">Book a call →</a>
              </div>
            </section>
          );
        }
        return <section key={sec.id} id={sec.id} className={sec.className} dangerouslySetInnerHTML={{ __html: sec.html }} />;
      })}
    </div>
  );
}
