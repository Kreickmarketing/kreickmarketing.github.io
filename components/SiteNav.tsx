import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import "./site-nav.css";

// Global nav, from the hero designs:
// Desktop: logo left; links and a white "Enroll Today →" pill on the right.
// Tablet and phone: logo and a menu (☰) button that opens the links.
// Phones also get SiteTabBar, a row of icon links (used at the bottom of the hero).
// Sizes respond to the nav's own width (a container query), so it fits anywhere.

export type NavLink = { label: string; href: string; icon?: ReactNode };

const Arrow = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-arrow"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

export default function SiteNav({ links, cta, overPhoto = false }: { links: NavLink[]; cta?: NavLink; overPhoto?: boolean }) {
  return (
    <div className="site-nav-wrap">
      <header className={`site-nav${overPhoto ? " site-nav-photo" : ""}`}>
        <Link href="/" aria-label="ClearMark home" className="site-nav-logo">
          <Image src="/logo-white.png" alt="ClearMark Training" width={160} height={40} />
        </Link>
        <div className="site-nav-right">
          <nav aria-label="Main" className="site-nav-links">
            {links.map((l) => <Link key={l.label} href={l.href}>{l.label}</Link>)}
          </nav>
          {cta && <Link href={cta.href} className="cta-pill nav-cta">{cta.label}<Arrow /></Link>}
        </div>
        <details className="site-nav-menu">
          <summary aria-label="Menu">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-menu-open"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-menu-close"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </summary>
          <nav aria-label="Main" className="site-nav-panel">
            {links.map((l) => <Link key={l.label} href={l.href}>{l.label}</Link>)}
            {cta && <Link href={cta.href} className="cta-pill nav-cta">{cta.label}<Arrow /></Link>}
          </nav>
        </details>
      </header>
    </div>
  );
}

// Phone tab bar: icon above label, white on the photo.
export function SiteTabBar({ items }: { items: NavLink[] }) {
  return (
    <nav aria-label="Sections" className="site-tabbar">
      {items.map((t) => (
        <Link key={t.label} href={t.href}>
          {t.icon}
          <span>{t.label}</span>
        </Link>
      ))}
    </nav>
  );
}
