import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Card, CardImageText, CARD_WIDTHS } from "@/components/Card";
import SiteNav from "@/components/SiteNav";
import Hero from "@/components/Hero";
import Credibility from "@/components/Credibility";
import Platforms from "@/components/Platforms";
import SectionHeader from "@/components/SectionHeader";
import { SECTION_HEADER_SAMPLE, PLATFORMS_LABEL, PLATFORMS_LOGOS, PLATFORMS_TAGS, PLATFORMS_TITLE, BODY_SIZES, BODY_WEIGHTS, COLOR_GROUPS, CRED_LABEL, CRED_LOGOS, FIELDS, FIELD_MAP, HEADINGS, HERO_SAMPLE, NAV_CTA, NAV_LINKS, SAMPLE } from "./content";
import "./design-system.css";

export const metadata: Metadata = {
  title: "Design System | ClearMark",
  robots: { index: false, follow: false },
};

const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com";

// Read the real values from styles/colors.css, so this page always matches the site.
function readColors() {
  const css = fs.readFileSync(path.join(process.cwd(), "styles/colors.css"), "utf8");
  const values: Record<string, { hex: string; approx: boolean }> = {};
  let approx = false;
  for (const line of css.split("\n")) {
    if (/\/\*/.test(line)) approx = /approx/i.test(line);
    const m = line.match(/--([a-z-]+):\s*(#[0-9A-Fa-f]{6})/);
    if (m) values[m[1]] = { hex: m[2].toUpperCase(), approx };
  }
  return values;
}

const title = (name: string) => name.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

const tabIcon = (d: string) => <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>;
const TABS = [
  { label: "Solutions", href: "#components", icon: tabIcon("M4 4h6v6H4zM14 4l3 3-3 3-3-3zM4 14h6v6H4zM14 14h6v6h-6z") },
  { label: "Platforms", href: "#components", icon: tabIcon("M4 8h13M14 5l3 3-3 3M20 16H7M10 13l-3 3 3 3") },
  { label: "The Engine", href: "#components", icon: tabIcon("M12 4a2 2 0 1 0 0 .01M5 18a2 2 0 1 0 0 .01M19 18a2 2 0 1 0 0 .01M12 6v5M12 11l-6 6M12 11l6 6") },
  { label: "Pricing", href: "#components", icon: tabIcon("M6 3h9l3 3v15H6zM14 9.5c-.5-.7-1.3-1-2.2-1-1.3 0-2.3.7-2.3 1.7 0 2.4 4.8 1.2 4.8 3.6 0 1-1 1.7-2.4 1.7-1 0-1.9-.4-2.4-1.1M12 7v1.5M12 15.5V17") },
];

const SECTIONS = [["color", "Color"], ["typography", "Typography"], ["buttons", "Buttons"], ["nav", "Navigation"], ["footer", "Footer"], ["components", "Components"], ["grid", "Grid"], ["fields", "Content fields"], ["cards", "Cards"]];

export default function DesignSystemPage() {
  const colors = readColors();
  const large = CARD_WIDTHS.filter((w) => w >= 480);

  return (
    <>
      <Nav calendlyUrl={calendlyUrl} />
      <main className="ds">
        <header className="ds-wrap ds-intro">
          <p className="tagline">ClearMark</p>
          <h1 className="as-h2">Design System</h1>
          <p className="text-md-light">The colors, type, buttons, grid and cards the ClearMark site is built from. Values on this page are read from the site&apos;s own style files.</p>
          <nav aria-label="Sections" className="ds-toc">
            {SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`} className="text-sm-semi-bold">{label}</a>)}
          </nav>
        </header>

        {/* ── Color ── */}
        <section id="color" className="ds-wrap ds-section">
          <h2 className="as-h3">Color</h2>
          <div>
            <h3 className="as-h5">Primitive Variables</h3>
            <p className="text-md-light ds-lede">Primitive colors are the foundational building blocks of a design system&apos;s color palette. They serve as the base for more specific design decisions.</p>
          </div>
          <div className="ds-colors">
            {COLOR_GROUPS.map((g) => (
              <div key={g.title}>
                <h4 className="as-h6 ds-group">{g.title}</h4>
                <ul className="ds-swatches">
                  {g.colors.map((name) => (
                    <li key={name}>
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="ds-drop"><path d="M12 3.5c3 3.6 5 6.6 5 9.5a5 5 0 0 1-10 0c0-2.9 2-5.9 5-9.5z" /></svg>
                      <span className="ds-name">
                        <span className="text-md-light">{title(name)}</span>
                        <code className="text-xs-normal">
                          var(--{name}) · {colors[name]?.hex}{colors[name]?.approx ? " (approx)" : ""}
                        </code>
                      </span>
                      <span className="ds-chip" style={{ background: `var(--${name})` }} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── Typography ── */}
        <section id="typography" className="ds-wrap ds-section">
          <h2 className="as-h3">Typography</h2>
          <div className="ds-specimen">
            <p className="text-xs-normal">Heading and body typeface</p>
            <p className="ds-saira">Saira</p>
            <p className="text-md-medium">ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />abcdefghijklmnopqrstuvwxyz<br />1234567890!@#$%^&amp;*()</p>
            <p className="text-xs-normal ds-note">Buttons use Courier Prime.</p>
          </div>

          <div className="ds-two">
            {(["desktop", "phone"] as const).map((device) => (
              <div key={device}>
                <h3 className="as-h5 ds-device">{device === "desktop" ? "Desktop" : "Mobile"}</h3>
                <p className="text-xs-normal ds-note">{device === "desktop" ? "Wider than 767px" : "767px and narrower"}</p>
                {HEADINGS.map((h) => {
                  const [size, lh] = h[device];
                  return (
                    <div key={h.tag} className="ds-row">
                      <p className="text-xs-normal ds-label">Font size: {size}px / {lh}px · letter spacing {h.ls}px</p>
                      {/* Specimen drawn at its exact size for this device, whatever the screen. */}
                      <p className={`as-${h.tag} ds-fixed`} style={{ fontSize: size, lineHeight: `${lh}px`, letterSpacing: h.ls }}>
                        Heading {h.tag.slice(1)}
                      </p>
                    </div>
                  );
                })}
                <div className="ds-row">
                  <p className="text-xs-normal ds-label">Font size: {device === "desktop" ? "16px / 16px" : "12px / 12px"} · letter spacing 3px</p>
                  <p className="tagline ds-fixed" style={{ fontSize: device === "desktop" ? 16 : 12, lineHeight: device === "desktop" ? "16px" : "12px" }}>Tagline</p>
                </div>
              </div>
            ))}
          </div>

          <div>
            <h3 className="as-h5 ds-device">Body text</h3>
            <p className="text-xs-normal ds-note">The same on every screen size. Class: .text-[size]-[weight], e.g. .text-sm-bold</p>
          </div>
          <div className="ds-body-wrap">
            <div className="ds-body">
              {BODY_SIZES.map((s) => (
                <div key={s.key} className="ds-body-col">
                  <p className="text-xs-normal ds-label">Font size: {s.size}</p>
                  {BODY_WEIGHTS.map((w) => (
                    <p key={w.key} className={`text-${s.key}-${w.key}`}>{s.label}<br />{w.label}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="ds-weights">
            <h3 className="as-h6 ds-group">Weights</h3>
            <p className="text-sm-normal">Thin 100 · Light 300 · Normal 400 · Medium 500 · Semi bold 600 · Bold 700 · Extra bold 800</p>
            <p className="text-xs-normal ds-note">Change only the weight of a style with .weight-[name], e.g. class=&quot;as-h6 weight-bold&quot;.</p>
          </div>
        </section>

        {/* ── Buttons ── */}
        <section id="buttons" className="ds-wrap ds-section">
          <h2 className="as-h3">Buttons</h2>

          <div className="ds-btn-group">
            <h3 className="as-h6 ds-group">Pill buttons</h3>
            <p className="text-md-light ds-lede">Set in Courier Prime. Rogue Cherry for the main action.</p>
            <div className="ds-buttons">
              <span className="button button-action">Book a call</span>
              <span className="button button-dark">Secondary</span>
            </div>
            <p className="text-xs-normal ds-note">.button .button-action · .button .button-dark</p>
          </div>

          <div className="ds-btn-group">
            <h3 className="as-h6 ds-group">Tags, text buttons and labels</h3>
            <p className="text-md-light ds-lede">Each comes in two versions: dark text for light backgrounds, and white for photos and dark backgrounds.</p>
            <div className="ds-btn-grid">
              {[false, true].map((white) => (
                <div key={String(white)} className={`ds-btn-panel${white ? " ds-btn-panel-photo" : ""}`}>
                  {white && <Image src="/design-system/poppies.webp" alt="" fill sizes="720px" className="ds-btn-photo" />}
                  {[
                    { cls: `tag${white ? " tag-white" : ""}`, name: "Tag, large · 40px tall", plus: true },
                    { cls: `tag tag-sm${white ? " tag-white" : ""}`, name: "Tag, small · 32px tall", plus: true },
                    { cls: `tag-label${white ? " tag-label-white" : ""}`, name: "Tag label", plus: false },
                  ].map((t) => (
                    <div key={t.name} className="ds-btn-row">
                      <span className={t.cls}>
                        {t.plus && <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>}
                        Hybrid course
                      </span>
                      <code className="text-xs-normal">.{t.cls.replaceAll(" ", " .")}</code>
                    </div>
                  ))}
                  <div className="ds-btn-row">
                    <span className={`text-button${white ? " text-button-white" : ""}`}>
                      Button Text Here
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </span>
                    <code className="text-xs-normal">.text-button{white ? " .text-button-white" : ""}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Navigation ── */}
        <section id="nav" className="ds-wrap ds-section">
          <h2 className="as-h3">Navigation</h2>
          <p className="text-md-light ds-lede">Logo on the left. On desktop, the links and a white &quot;Enroll Today →&quot; pill sit on the right. On tablet and phone they move into a menu (☰), and phones add an icon tab bar at the bottom of the hero.</p>
          <figure className="ds-large">
            <figcaption className="text-xs-normal"><b>Desktop, on Midnight</b> · &lt;SiteNav /&gt;</figcaption>
            <div className="ds-nav-frame"><SiteNav links={NAV_LINKS} cta={NAV_CTA} /></div>
          </figure>
          <figure className="ds-large">
            <figcaption className="text-xs-normal"><b>Phone, menu closed</b> · tap ☰ to open it</figcaption>
            <div className="ds-nav-frame ds-phone-frame"><SiteNav links={NAV_LINKS} cta={NAV_CTA} /></div>
          </figure>
          <div className="ds-table-wrap">
            <table className="ds-table text-sm-normal">
              <thead><tr><th>Part</th><th>Rule</th></tr></thead>
              <tbody>
                <tr><td>Bar</td><td>32px top and bottom; sides 96 (wide), 64 (laptop), 32 (phone)</td></tr>
                <tr><td>Logo</td><td>White ClearMark Training logo, 160px wide (120 on phone)</td></tr>
                <tr><td>Links</td><td>16px Saira Light, 48px apart (32 on laptop)</td></tr>
                <tr><td>Button</td><td>White pill, Midnight text, 32px tall, with an arrow</td></tr>
                <tr><td>Tablet and phone</td><td>Links and button move into the ☰ menu</td></tr>
                <tr><td>Phone tab bar</td><td>Solutions, Platforms, The Engine, Pricing: a 24px icon above each label</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Footer ── */}
        <section id="footer" className="ds-wrap ds-section">
          <h2 className="as-h3">Footer</h2>
          <p className="text-md-light ds-lede">The same footer on every public page: Charcoal background, white text.</p>
          <div className="ds-table-wrap">
            <table className="ds-table text-sm-normal">
              <thead><tr><th>Screen</th><th>Layout</th><th>Side margins</th><th>Text</th></tr></thead>
              <tbody>
                <tr><td>1440px and wider</td><td>Logo and tagline left, meeting link and address right. A 1px white line, then copyright, Privacy, Terms and a back-to-top button.</td><td>96</td><td>20px (md)</td></tr>
                <tr><td>1024 to 1439</td><td>Same two rows</td><td>64</td><td>20px (md)</td></tr>
                <tr><td>Tablet</td><td>One column: logo, tagline, meeting link, address, line, Privacy, Terms, copyright. No back-to-top.</td><td>40</td><td>16px (sm)</td></tr>
                <tr><td>Phone</td><td>One column, with fixed line breaks in the address and copyright</td><td>32</td><td>16px (sm)</td></tr>
              </tbody>
            </table>
          </div>
          <figure className="ds-large">
            <figcaption className="text-xs-normal"><b>Desktop</b> · &lt;Footer /&gt;</figcaption>
            <div className="ds-foot-frame"><Footer /></div>
          </figure>
          <figure className="ds-large">
            <figcaption className="text-xs-normal"><b>Phone</b> · the same footer at 360px wide</figcaption>
            <div className="ds-foot-frame ds-foot-phone"><Footer /></div>
          </figure>
          <p className="text-xs-normal ds-note">The footer changes layout based on its own width, so it fits wherever it&apos;s placed. components/Footer.tsx</p>
        </section>

        {/* ── Components ── */}
        <section id="components" className="ds-wrap ds-section">
          <h2 className="as-h3">Components</h2>
          <p className="text-md-light ds-lede">Page building blocks. Each one is designed here and filled with content per page. They change layout based on their own width, so the desktop and phone versions can sit side by side.</p>

          <h3 className="as-h5 ds-device">Section header</h3>
          <p className="text-xs-normal ds-note">&lt;SectionHeader /&gt; · sits at the top of every section: tagline left, light headline and paragraph right. Add <code>light</code> for photos and dark backgrounds (as in Platforms below).</p>
          <figure className="ds-large">
            <figcaption className="text-xs-normal"><b>Desktop</b></figcaption>
            <div className="ds-comp-frame ds-sh-frame"><SectionHeader {...SECTION_HEADER_SAMPLE} /></div>
          </figure>
          <figure className="ds-large">
            <figcaption className="text-xs-normal"><b>Phone</b> · 375px wide</figcaption>
            <div className="ds-comp-frame ds-sh-frame ds-phone-frame"><SectionHeader {...SECTION_HEADER_SAMPLE} /></div>
          </figure>

          <h3 className="as-h5 ds-device">Hero</h3>
          <p className="text-xs-normal ds-note">&lt;Hero /&gt; · photo, nav, headline, button, testimonial and stat card. On phones the testimonial and stat card hide and the tab bar appears.</p>
          <figure className="ds-large">
            <figcaption className="text-xs-normal"><b>Desktop</b></figcaption>
            <div className="ds-comp-frame ds-hero-desktop"><Hero content={HERO_SAMPLE} nav={NAV_LINKS} navCta={NAV_CTA} tabs={TABS} /></div>
          </figure>
          <figure className="ds-large">
            <figcaption className="text-xs-normal"><b>Phone</b> · 375px wide</figcaption>
            <div className="ds-comp-frame ds-hero-phone"><Hero content={HERO_SAMPLE} nav={NAV_LINKS} navCta={NAV_CTA} tabs={TABS} /></div>
          </figure>

          <h3 className="as-h5 ds-device">Credibility</h3>
          <p className="text-xs-normal ds-note">&lt;Credibility /&gt; · a label and partner logos on Charcoal. Dashed boxes are placeholders until the logo files are added.</p>
          <figure className="ds-large">
            <figcaption className="text-xs-normal"><b>Desktop</b></figcaption>
            <div className="ds-comp-frame"><Credibility label={CRED_LABEL} logos={CRED_LOGOS} /></div>
          </figure>
          <figure className="ds-large">
            <figcaption className="text-xs-normal"><b>Phone</b> · 375px wide</figcaption>
            <div className="ds-comp-frame ds-phone-frame"><Credibility label={CRED_LABEL} logos={CRED_LOGOS} /></div>
          </figure>

          <h3 className="as-h5 ds-device">Platforms</h3>
          <p className="text-xs-normal ds-note">&lt;Platforms /&gt; · label, headline, &quot;+&quot; tags and platform logos over a full-bleed photo. Placeholders show until the photo and logo files are added.</p>
          <figure className="ds-large">
            <figcaption className="text-xs-normal"><b>Desktop</b></figcaption>
            <div className="ds-comp-frame"><Platforms label={PLATFORMS_LABEL} title={PLATFORMS_TITLE} tags={PLATFORMS_TAGS} logos={PLATFORMS_LOGOS} /></div>
          </figure>
          <figure className="ds-large">
            <figcaption className="text-xs-normal"><b>Phone</b> · 375px wide</figcaption>
            <div className="ds-comp-frame ds-phone-frame"><Platforms label={PLATFORMS_LABEL} title={PLATFORMS_TITLE} tags={PLATFORMS_TAGS} logos={PLATFORMS_LOGOS} /></div>
          </figure>
        </section>

        {/* ── Grid ── */}
        <section id="grid" className="ds-wrap ds-section">
          <h2 className="as-h3">Grid</h2>
          <p className="text-md-light ds-lede">The site is set up on a <strong>32px grid</strong>: spacing is 32, 64 or 96, with 16 and 8 only inside small parts like tags. Card widths go up in steps of 160px.</p>
          <div className="ds-widths">
            {CARD_WIDTHS.map((w) => (
              <div key={w} className="ds-width">
                <span className="text-xs-semi-bold">{w}</span>
                <span className="ds-bar" style={{ width: `${(w / 1920) * 100}%` }} />
              </div>
            ))}
          </div>
        </section>

        {/* ── Content fields ── */}
        <section id="fields" className="ds-wrap ds-section">
          <h2 className="as-h3">Content fields</h2>
          <p className="text-md-light ds-lede">Every card is filled from the same fields. Each field has a short code that tells a card what to show.</p>
          <div className="ds-table-wrap">
            <table className="ds-table text-sm-normal">
              <thead><tr><th>Field</th><th>Code</th><th>Rule</th></tr></thead>
              <tbody>
                {FIELDS.map(([f, code, rule]) => <tr key={f}><td>{f}</td><td><code>{code}</code></td><td>{rule}</td></tr>)}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Cards ── */}
        <section id="cards" className="ds-wrap ds-section">
          <h2 className="as-h3">Cards</h2>
          <p className="text-md-light ds-lede">Most of the site is built from cards. One piece of content can show as any card; the card&apos;s width decides which fields appear and how big.</p>

          <h3 className="as-h5 ds-device">Which fields each card shows</h3>
          <div className="ds-table-wrap">
            <table className="ds-table text-sm-normal">
              <thead>
                <tr>{["Card", "Device", "CI-01", "CT100", "CT200", "CT300", "CS", "CB", "Tags", "Divider", "CP + CPDT"].map((h) => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {FIELD_MAP.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}
              </tbody>
            </table>
          </div>
          <p className="text-xs-normal ds-note">&quot;Panel&quot; means the field sits in a dark see-through box on the left of the card.</p>

          <h3 className="as-h5 ds-device">Mobile</h3>
          <div className="ds-mobile">
            <figure>
              <div className="ds-pair">
                <Card width={160} content={SAMPLE} />
                <Card width={160} content={SAMPLE} />
              </div>
              <figcaption className="text-xs-normal"><b>Card-160</b> (Card-Mobile-50%) · 160 × 240 · padding 16 · two side by side</figcaption>
            </figure>
            <figure>
              <Card width={320} content={SAMPLE} />
              <figcaption className="text-xs-normal"><b>Card-320</b> (Card-Mobile-320) · 320 × 480 · padding 32</figcaption>
            </figure>
            <figure>
              <CardImageText content={SAMPLE} />
              <figcaption className="text-xs-normal"><b>Card-Image-Text</b> · 352 wide · padding 32</figcaption>
            </figure>
          </div>

          <h3 className="as-h5 ds-device">Tablet, laptop and desktop</h3>
          <p className="text-xs-normal ds-note">Every card is responsive: it fills the space it&apos;s given, from the next card size down up to its own size, and keeps its shape. Card-1920 has no maximum and stretches to fill its container. Make your browser window narrower or wider to see it. When the window is smaller than a card&apos;s minimum, the card scrolls sideways.</p>
          {large.map((w) => (
            <figure key={w} className={`ds-large${w === 1920 ? " ds-bleed" : ""}`}>
              <figcaption className="text-xs-normal"><b>Card-{w}</b> · {w === 1920 ? "1760 and wider" : `${CARD_WIDTHS[CARD_WIDTHS.indexOf(w) - 1]} to ${w} wide`}</figcaption>
              <div className="ds-frame"><Card width={w} content={SAMPLE} /></div>
            </figure>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}
