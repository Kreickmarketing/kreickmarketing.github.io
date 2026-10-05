import Image from "next/image";
import Link from "next/link";
import "./footer.css";

const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com";

// Site-wide footer. It responds to its own width (a container query), so it
// fits wherever it is placed. Desktop: two rows split by a hairline. Tablet and phone:
// one column, with the back-to-top button dropped.
export default function Footer() {
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
          Copyright © {new Date().getFullYear()} Clearmark Training.<br className="site-footer-br" /> All rights reserved. Clearmark.bz
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
