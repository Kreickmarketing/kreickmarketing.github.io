import Image from "next/image";
import Link from "next/link";
import "./footer.css";
import type { LiveFooter } from "@/lib/builder-site";

const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com";

// Site-wide footer. It responds to its own width (a container query), so it
// fits wherever it is placed. Desktop: two rows split by a hairline. Tablet and phone:
// one column, with the back-to-top button dropped.
// content: the footer's words and links set in Studio (Footer); without it, the built-in wording.
export default function Footer({ content }: { content?: LiveFooter | null }) {
  const year = new Date().getFullYear();
  const ext = (href: string) => (/^https?:/i.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {});
  if (content) {
    return (
      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="site-footer-top">
            <div className="site-footer-brand">
              <Link href="/" aria-label="ClearMark home">
                <Image src="/logo-white.png" alt="ClearMark Training" width={136} height={34} className="site-footer-logo" />
              </Link>
              {content.tagline && <p>{content.tagline}</p>}
            </div>
            <div className="site-footer-contact">
              {content.meeting && <a href={content.meeting.href} {...ext(content.meeting.href)}>{content.meeting.label}</a>}
              {content.address && <p>{content.address}</p>}
            </div>
          </div>
          <div className="site-footer-legal">
            <p className="site-footer-copy">{content.copyright.replace("{year}", String(year))}</p>
            {content.privacy ? <a href={content.privacy.href} {...ext(content.privacy.href)} className="site-footer-privacy">{content.privacy.label}</a> : <span />}
            {content.terms ? <a href={content.terms.href} {...ext(content.terms.href)} className="site-footer-terms">{content.terms.label}</a> : <span />}
            <a href="#" className="site-footer-top-link" aria-label="Back to top">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" /><path d="M8 13.5l4-4 4 4" /></svg>
            </a>
          </div>
        </div>
      </footer>
    );
  }
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
      <div className="site-footer-top">
        <div className="site-footer-brand">
          <Link href="/" aria-label="ClearMark home">
            <Image src="/logo-white.png" alt="ClearMark Training" width={136} height={34} className="site-footer-logo" />
          </Link>
          <p>Built for real people, in real jobs, right now.</p>
        </div>
        <div className="site-footer-contact">
          <a href={calendlyUrl} target="_blank" rel="noopener noreferrer">Set up a meeting</a>
          <p>Address: Eastern Ontario, Canada<br className="site-footer-br" />—Working Globally</p>
        </div>
      </div>
      <div className="site-footer-legal">
        <p className="site-footer-copy">
          Copyright © {year} Clearmark Training.<br className="site-footer-br" /> All rights reserved. Clearmark.bz
        </p>
        <Link href="/privacy" className="site-footer-privacy">Privacy Policy</Link>
        <Link href="/terms" className="site-footer-terms">Terms &amp; Conditions</Link>
        <a href="#" className="site-footer-top-link" aria-label="Back to top">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" /><path d="M8 13.5l4-4 4 4" /></svg>
        </a>
      </div>
      </div>
    </footer>
  );
}
