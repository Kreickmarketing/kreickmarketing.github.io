import Image from "next/image";
import Link from "next/link";
import "./site-nav.css";

// Global nav from the uploaded NavBar rules (components/navigation/NavBar.jsx):
// logo left, link row centre, two outlined pill buttons right.
// On phones the CTA shows its short label (e.g. "Enroll Today") and Login hides.
// Default sits on Midnight; `overPhoto` is transparent with white text for heroes.

export type NavLink = { label: string; href: string; short?: string };

export default function SiteNav({
  links,
  cta,
  login,
  overPhoto = false,
}: {
  links: NavLink[];
  cta?: NavLink;
  login?: NavLink;
  overPhoto?: boolean;
}) {
  return (
    <header className={`site-nav${overPhoto ? " site-nav-photo" : ""}`}>
      <Link href="/" aria-label="ClearMark home" className="site-nav-logo">
        <Image src="/logo-white.png" alt="ClearMark Training" width={128} height={32} />
      </Link>
      <nav aria-label="Main" className="site-nav-links">
        {links.map((l) => <Link key={l.label} href={l.href}>{l.label}</Link>)}
      </nav>
      <div className="site-nav-actions">
        {cta && (
          <Link href={cta.href} className="nav-pill">
            <span className={cta.short ? "nav-pill-long" : undefined}>{cta.label}</span>
            {cta.short && <span className="nav-pill-short">{cta.short}</span>}
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>
        )}
        {login && <Link href={login.href} className="nav-pill nav-pill-login">{login.label}</Link>}
      </div>
    </header>
  );
}
