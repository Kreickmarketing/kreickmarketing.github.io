import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Nav from "@/components/Nav";
import { Card, CardImageText, CARD_WIDTHS } from "@/components/Card";
import { BODY_SIZES, BODY_WEIGHTS, COLOR_GROUPS, FIELDS, FIELD_MAP, HEADINGS, SAMPLE } from "./content";
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

const SECTIONS = [["color", "Color"], ["typography", "Typography"], ["buttons", "Buttons"], ["grid", "Grid"], ["fields", "Content fields"], ["cards", "Cards"]];

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
          <p className="text-md-light ds-lede">Pill shaped, set in Courier Prime. Rogue Cherry for the main action.</p>
          <div className="ds-buttons">
            <span className="button button-action">Book a call</span>
            <span className="button button-dark">Secondary</span>
          </div>
          <p className="text-xs-normal ds-note">.button .button-action · .button .button-dark</p>
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
          <p className="text-xs-normal ds-note">Shown at actual size. Scroll sideways inside a card&apos;s frame to see all of it.</p>
          {large.map((w) => (
            <figure key={w} className="ds-large">
              <figcaption className="text-xs-normal"><b>Card-{w}</b></figcaption>
              <div className="ds-frame"><Card width={w} content={SAMPLE} /></div>
            </figure>
          ))}
        </section>
      </main>
    </>
  );
}
