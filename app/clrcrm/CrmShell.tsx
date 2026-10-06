import Image from "next/image";
import { signOut } from "./actions";

const tools = [
  { key: "studio", label: "Studio", href: "/clrcrm/studio", external: false },
  { key: "crm", label: "CRM", href: "/clrcrm/crm", external: false },
  { key: "playbook", label: "Playbook", href: "/clrcrm", external: false },
  { key: "interview", label: "Interview app", href: "/clrcrm/interview", external: false },
] as const;

export type CrmTool = (typeof tools)[number]["key"];

// Top bar for every logged-in /clrcrm page: logo, and a menu (hamburger) with
// the team tools, who is logged in, and Log out. Built on <details>, so it
// opens and closes without any JavaScript.
export default function CrmShell({ current, username, className, children }: { current: CrmTool; username: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className ? `crm ${className}` : "crm"}>
      <header className="crm-bar">
        <a href="/clrcrm" aria-label="ClearMark team home">
          <Image src="/logo-white.png" alt="ClearMark" width={128} height={32} />
        </a>
        <details className="crm-menu">
          <summary aria-label="Menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="crm-menu-open">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="crm-menu-close">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </summary>
          <nav className="crm-menu-panel" aria-label="Team tools">
            <ul>
              {tools.map((t) => (
                <li key={t.key}>
                  <a
                    href={t.href}
                    className="text-lg-semi-bold"
                    aria-current={t.key === current ? "page" : undefined}
                    {...(t.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {t.label}
                    {t.external && <span className="crm-menu-ext" aria-label="(opens in a new tab)"> ↗</span>}
                  </a>
                </li>
              ))}
            </ul>
            <div className="crm-menu-user">
              <span className="text-sm-normal">Logged in as {username}</span>
              <form action={signOut}>
                <button type="submit" className="button button-outline">Log out</button>
              </form>
            </div>
          </nav>
        </details>
      </header>
      {children}
    </div>
  );
}
