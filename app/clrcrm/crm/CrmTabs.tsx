"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const icon = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

const tabs = [
  { href: "/clrcrm/crm", label: "Home", icon: <svg {...icon}><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></svg> },
  { href: "/clrcrm/crm/database", label: "Database", icon: <svg {...icon}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M3 15h18M9 10v10" /></svg> },
  { href: "/clrcrm/crm/funnel", label: "Funnel", icon: <svg {...icon}><rect x="3" y="4" width="5" height="16" rx="1" /><rect x="10" y="4" width="5" height="11" rx="1" /><rect x="17" y="4" width="4" height="7" rx="1" /></svg> },
  { href: "/clrcrm/crm/products", label: "Products", icon: <svg {...icon}><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8M12 13v8" /></svg> },
  { href: "/clrcrm/crm/clients", label: "Clients", icon: <svg {...icon}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg> },
];

// The five CRM views. Same pill row as the Playbook on desktop; on phones the
// shared .crm-sections styles turn it into a bottom tab bar with icons.
export default function CrmTabs() {
  const path = usePathname();
  const active = (href: string) => (href === "/clrcrm/crm" ? path === href : path.startsWith(href));
  return (
    <nav className="crm-sections crm-tabs" aria-label="CRM views">
      <ul>
        {tabs.map((t) => (
          <li key={t.href}>
            <Link href={t.href} aria-current={active(t.href) ? "true" : undefined}>
              {t.icon}
              <span>{t.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
