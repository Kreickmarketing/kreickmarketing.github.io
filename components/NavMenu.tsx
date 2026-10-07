"use client";

import { useEffect, useState } from "react";

export type NavItem = { label: string; href: string };

// Tablet and phone nav (Studio pages): a menu button whose three lines turn into an X,
// opening a panel under the bar with the nav links and Book a call. Shown at 1000px and
// narrower by components/builder-site.css; desktop keeps the row of links.
export default function NavMenu({ items, cta }: { items: NavItem[]; cta: NavItem | null }) {
  const [open, setOpen] = useState(false);
  const ext = (href: string) => (/^https?:/i.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {});
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
            {items.map((it, i) => <li key={i}><a href={it.href} {...ext(it.href)} tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>{it.label}</a></li>)}
          </ul>
          {cta && <a className="bnav-menu-cta" href={cta.href} {...ext(cta.href)} tabIndex={open ? 0 : -1}>{cta.label}</a>}
        </div>
      </div>
    </>
  );
}
