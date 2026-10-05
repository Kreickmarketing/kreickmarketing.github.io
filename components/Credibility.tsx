import Image from "next/image";
import "./credibility.css";

// Credibility section: a label ("Speaker & certifications:") and a row of
// white partner logos on Charcoal. Desktop: label left, logos in one row on the
// right. Tablet: logos in a 2 × 2 grid on the right. Phone: label on top, logos
// in a 2 × 2 grid below. Layout responds to the section's own width.

export type CredLogo = { name: string; src?: string; width?: number; height?: number; href?: string };

export default function Credibility({ label, logos }: { label: string; logos: CredLogo[] }) {
  return (
    <div className="cred-wrap">
      <section className="cred" aria-label={label.replace(/:$/, "")}>
        <p className="tagline cred-label">{label}</p>
        <ul className="cred-logos">
          {logos.map((l) => {
            // Until a logo file is added, the name stands in for it.
            const mark = l.src
              ? <Image src={l.src} alt={l.name} width={l.width ?? 160} height={l.height ?? 48} className="cred-logo" />
              : <span className="cred-placeholder">{l.name}</span>;
            return <li key={l.name}>{l.href ? <a href={l.href} target="_blank" rel="noopener noreferrer">{mark}</a> : mark}</li>;
          })}
        </ul>
      </section>
    </div>
  );
}
