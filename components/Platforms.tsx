import Image from "next/image";
import type { CredLogo } from "./Credibility";
import SectionHeader from "./SectionHeader";
import "./platforms.css";

// Platforms section: a label, a two-line light headline, a set of "+" tags
// (business areas) and a grid of white platform logos over a full-bleed photo.
// Layout responds to the section's own width (container queries).

export default function Platforms({
  label, title, tags, logos, image, imageAlt,
}: { label: string; title: string[]; tags: string[]; logos: CredLogo[]; image?: string; imageAlt?: string }) {
  return (
    <div className="plat-wrap">
      <section className="plat" aria-label={label}>
        {image && <Image src={image} alt={imageAlt ?? ""} fill sizes="100vw" className="plat-image" />}
        <SectionHeader light tagline={label} title={title} />
        <div className="plat-bottom">
          <ul className="plat-tags">
            {tags.map((t) => (
              <li key={t} className="tag tag-white plat-tag">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                {t}
              </li>
            ))}
          </ul>
          <ul className="plat-logos">
            {logos.map((l) => (
              <li key={l.name}>
                {l.src
                  ? <Image src={l.src} alt={l.name} width={l.width ?? 160} height={l.height ?? 48} className="plat-logo" />
                  : <span className="plat-placeholder">{l.name}</span>}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
