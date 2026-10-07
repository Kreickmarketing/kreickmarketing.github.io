"use client";

import { useEffect, useState } from "react";

export type NavItem = { label: string; href: string };

// Tablet and phone nav (Studio pages): a menu button whose three lines turn into an X,
// opening a panel under the bar with the nav links and Book a call. Shown at 1000px and
// narrower by components/builder-site.css; desktop keeps the row of links.
export default function NavMenu({ items, calendlyUrl }: { items: NavItem[]; calendlyUrl: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <>
      <button type="button" className={`burger${open ? " is-open" : ""}`} aria-expanded={open} aria-controls="site-menu"
        aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
        <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
      </button>
      <div id="site-menu" className={`bnav-menu${open ? " is-open" : ""}`} aria-hidden={!open}>
        <div className="bnav-menu-inner">
          <ul>
            {items.map((it) => <li key={it.href + it.label}><a href={it.href} tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>{it.label}</a></li>)}
          </ul>
          <a className="bnav-menu-cta" href={calendlyUrl} target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1}>Book a call →</a>
        </div>
      </div>
    </>
  );
}
