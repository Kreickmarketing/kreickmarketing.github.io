import type { HeroContent } from "@/components/Hero";
import type { CredLogo } from "@/components/Credibility";
import type { CardWidth } from "@/components/Card";

// The shape of a Studio page, as stored in pages.draft and pages.published
// (see supabase/studio.sql). A page is an ordered list of sections; each
// section holds ordered components, or a grid of cards from a CMS collection.

export type StudioComponent =
  | { id: string; type: "hero"; props: HeroContent }
  | { id: string; type: "section-header"; props: { tagline: string; title: string[]; body?: string; light?: boolean } }
  | { id: string; type: "credibility"; props: { label: string; logos: CredLogo[] } }
  | { id: string; type: "platforms"; props: { label: string; title: string[]; tags: string[]; logos: CredLogo[]; image?: string; imageAlt?: string } };

export type CardGrid = {
  collection: string;  // collection slug, e.g. "products"
  items: string[];     // item slugs, in order
  width: CardWidth;
};

export type StudioSection =
  | { id: string; components: StudioComponent[]; cards?: never }
  | { id: string; cards: CardGrid; components?: never };

export type PageContent = { sections: StudioSection[] };

// Site-wide settings kept in sites.settings.
export type SiteSettings = {
  nav?: { label: string; href: string }[];
  navCta?: { label: string; href: string };
  calendlyUrl?: string;
};

// Columns visitors (not logged in) are allowed to read from pages.
// The draft column is hidden from them, so never use select("*") for public pages.
export const PUBLIC_PAGE_COLUMNS = "id, site_id, slug, title, description, search_visible, social_image, sort_order, published, published_at";
