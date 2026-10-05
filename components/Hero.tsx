import Image from "next/image";
import Link from "next/link";
import SiteNav, { SiteTabBar, type NavLink } from "./SiteNav";
import "./hero.css";

// Photo hero with the nav on top, from the hero designs.
// Desktop and tablet: headline, button, a see-through testimonial panel and a
// white stat card with a bar chart. Phone: headline, full-width button and the
// icon tab bar; the testimonial and stat card are hidden.
// Layout responds to the hero's own width (container queries).

export type HeroContent = {
  title: string;
  cta: NavLink;
  image: string;
  imageAlt?: string;
  testimonial?: { name: string; quote: string; avatar?: string };
  stat?: { kicker: string; value: string; bars: { label: string; value: number }[] };
};

const initials = (name: string) => name.split(/\s+/).filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).slice(0, 2).join("");

export default function Hero({ content: c, nav, navCta, tabs }: { content: HeroContent; nav: NavLink[]; navCta?: NavLink; tabs?: NavLink[] }) {
  return (
    <div className="hero-x-wrap">
      <section className="hero-x">
        <Image src={c.image} alt={c.imageAlt ?? ""} fill priority sizes="100vw" className="hero-x-image" />
        <div className="hero-x-shade" aria-hidden="true" />
        <SiteNav overPhoto links={nav} cta={navCta} />

        <div className="hero-x-body">
          <h1 className="as-h6 weight-bold hero-x-title">{c.title}</h1>
          <Link href={c.cta.href} className="hero-x-cta">
            {c.cta.label}
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>
        </div>

        <div className="hero-x-bottom">
          {c.testimonial && (
            <figure className="hero-x-quote">
              <figcaption>
                {c.testimonial.avatar
                  ? <Image src={c.testimonial.avatar} alt="" width={48} height={48} className="hero-x-avatar" />
                  : <span className="hero-x-avatar" aria-hidden="true">{initials(c.testimonial.name)}</span>}
                <span className="hero-x-name">{c.testimonial.name}</span>
              </figcaption>
              <blockquote>{c.testimonial.quote}</blockquote>
            </figure>
          )}
          {c.stat && (
            <aside className="hero-x-stat" aria-label={`${c.stat.kicker}: ${c.stat.value}`}>
              <div className="hero-x-stat-head">
                <p className="hero-x-kicker">{c.stat.kicker}</p>
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" /><path d="M12 17V7M8 11l4-4 4 4" /></svg>
              </div>
              <p className="hero-x-value">{c.stat.value}</p>
              <ol className="hero-x-bars">
                {c.stat.bars.map((b) => (
                  <li key={b.label}>
                    <span className="hero-x-bar"><i style={{ height: `${Math.round(b.value * 100)}%` }} /></span>
                    <span>{b.label}</span>
                  </li>
                ))}
              </ol>
            </aside>
          )}
        </div>

        {tabs && <div className="hero-x-tabs"><SiteTabBar items={tabs} /></div>}
      </section>
    </div>
  );
}
