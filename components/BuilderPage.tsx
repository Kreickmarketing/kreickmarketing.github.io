import SignupForm from "./SignupForm";
import NavMenu, { type NavItem } from "./NavMenu";
import CountUp from "./CountUp";
import type { LivePage } from "@/lib/builder-site";
import "./builder-site.css";

const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com";

// Nav links that jump to a section on the page, shown only when that section exists.
const JUMPS: [string, string][] = [["Solutions", "solutions"], ["Platforms", "platforms"]];

// A page made in the Studio builder. The section HTML comes from lib/builder-site.ts,
// which escapes all text and only allows safe links and local images. `paths` are the pages'
// addresses (set in Studio), so About and Pricing link to wherever those pages live.
export default function BuilderPage({ page, livePages = [], paths = {} }: { page: LivePage; livePages?: string[]; paths?: Record<string, string> }) {
  // Studio ids (uid) decide which links show; the address uses each section's link name.
  const ids = new Set(page.sections.map((s) => s.uid));
  const addr = (uid: string) => page.sections.find((s) => s.uid === uid)?.id ?? uid;
  // The nav's links: About and Pricing follow the pages' addresses; Solutions and Platforms
  // jump to that section, shown only when the page has it.
  const pricing = livePages.includes("pricing") && paths.pricing ? paths.pricing : ids.has("sol-offers") ? `#${addr("sol-offers")}` : null;
  // Links set in Studio (Global nav); before that, the built-in ones.
  const items: NavItem[] = page.nav ? page.nav.links : [
    { label: "About", href: paths.about ?? "/about" },
    ...JUMPS.filter(([, id]) => ids.has(id)).map(([label, id]) => ({ label, href: `/#${addr(id)}` })),
    ...(pricing ? [{ label: "Pricing", href: pricing }] : []),
  ];
  const cta: NavItem | null = page.nav ? page.nav.cta : { label: "Book a call →", href: calendlyUrl };
  const external = (href: string) => /^https?:/i.test(href);
  return (
    <div className="site">
      {/* Tablet / Phone photo crops set in Studio (numbers only, checked in lib/builder-site.ts). */}
      {page.css && <style dangerouslySetInnerHTML={{ __html: page.css }} />}
      <CountUp />
      <header className={`bnav${page.navOverPhoto ? "" : " nav-bar"}`}>
        <a href="/" aria-label="ClearMark home"><img src="/studio-media/logo-white.png" alt="ClearMark Training" /></a>
        <nav aria-label="Main">
          <ul>
            {items.map((it, i) => <li key={i}><a href={it.href} {...(external(it.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{it.label}</a></li>)}
            {cta && <li><a className="pill-cta" href={cta.href} {...(external(cta.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{cta.label}</a></li>}
          </ul>
        </nav>
        <NavMenu items={items} cta={cta} />
      </header>
      {page.sections.map((sec) => {
        if (sec.kind === "mail") {
          return (
            <section key={sec.id} id={sec.id} className={sec.className}>
              <div>
                <p className="tagline" data-slot=".label">{sec.label}</p>
                {sec.headline && <h2 data-slot=".headline">{sec.headline}</h2>}
                {sec.intro && <p data-slot=".intro">{sec.intro}</p>}
              </div>
              <SignupForm nameLabel={sec.nameLabel} emailLabel={sec.emailLabel} button={sec.button} thanks={sec.thanks} />
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
