import Hero from "./Hero";
import SectionHeader from "./SectionHeader";
import Credibility from "./Credibility";
import Platforms from "./Platforms";
import SiteNav from "./SiteNav";
import { Card, CardImageText, type CardContent } from "./Card";
import type { PageContent, SiteSettings, StudioComponent } from "@/lib/studio";
import "./studio-page.css";

// Draws a Studio page from its JSON: each section in order, each component in
// its section, or a grid of CMS cards. Used by the live site and by the
// Studio preview, so both always look the same.
// `cards` maps "collection/item-slug" to the card's content.

export default function StudioPage({ content, settings, cards }: { content: PageContent; settings: SiteSettings; cards: Record<string, CardContent> }) {
  const nav = settings.nav ?? [];
  const hasHero = content.sections.some((s) => s.components?.some((c) => c.type === "hero"));

  return (
    <>
      {!hasHero && <SiteNav links={nav} cta={settings.navCta} />}
      {content.sections.map((s) => (
        <section key={s.id} id={s.id} className="sp-section">
          {s.components?.map((c) => <Block key={c.id} c={c} settings={settings} />)}
          {s.cards && (
            <ul className="sp-cards">
              {s.cards.items.map((slug) => {
                const g = s.cards!;
                const item = cards[`${g.collection}/${slug}`];
                if (!item) return null;
                return g.width === "image-text"
                  ? <li key={slug} style={{ maxWidth: 352 }}><CardImageText content={item} /></li>
                  : <li key={slug} style={{ maxWidth: g.width }}><Card width={g.width} content={item} /></li>;
              })}
            </ul>
          )}
        </section>
      ))}
    </>
  );
}

function Block({ c, settings }: { c: StudioComponent; settings: SiteSettings }) {
  switch (c.type) {
    case "hero": return <Hero content={c.props} nav={settings.nav ?? []} navCta={settings.navCta} />;
    case "section-header": return <SectionHeader {...c.props} />;
    case "credibility": return <Credibility {...c.props} />;
    case "platforms": return <Platforms {...c.props} />;
    default: return null;
  }
}
