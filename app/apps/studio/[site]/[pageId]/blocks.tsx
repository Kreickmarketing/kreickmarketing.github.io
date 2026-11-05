import { CARD_HEIGHTS, CARD_WIDTHS } from "@/components/Card";
import type { CardGrid, StudioComponent } from "@/lib/studio";

// What the Insert panel offers: the design system's components and cards.
// New components start with placeholder text to replace.

export type ComponentType = StudioComponent["type"];

export const COMPONENTS: { type: ComponentType; name: string; about: string }[] = [
  { type: "hero", name: "Hero", about: "Photo, nav, headline and button" },
  { type: "section-header", name: "Section header", about: "Tagline, two-line headline, paragraph" },
  { type: "credibility", name: "Credibility", about: "Label and a row of partner logos" },
  { type: "platforms", name: "Platforms", about: "Headline, + tags and platform logos" },
];
export const COMPONENT_NAMES = Object.fromEntries(COMPONENTS.map((c) => [c.type, c.name])) as Record<string, string>;

export function template(type: ComponentType, id: string, bookingUrl: string): StudioComponent {
  switch (type) {
    case "hero":
      return { id, type, props: { title: "Your headline here.", cta: { label: "Book a call", href: bookingUrl }, image: "/design-system/poppies.webp", imageAlt: "" } };
    case "section-header":
      return { id, type, props: { tagline: "Tagline", title: ["First line,", "second line"], body: "" } };
    case "credibility":
      return { id, type, props: { label: "Speaker & certifications:", logos: [{ name: "Logo 1" }, { name: "Logo 2" }, { name: "Logo 3" }, { name: "Logo 4" }] } };
    case "platforms":
      return { id, type, props: { label: "Platforms", title: ["For any business.", "On any platform."], tags: ["Tag"], logos: [{ name: "Platform" }] } };
  }
}

// The 13 cards, smallest first, with the shape each one has.
export type CardOption = { width: CardGrid["width"]; name: string; about: string; ratio: number };
export const CARDS: CardOption[] = [
  { width: 160, name: "Card-160", about: "Phone, half width", ratio: 160 / CARD_HEIGHTS[160] },
  { width: 320, name: "Card-320", about: "Phone, full width", ratio: 320 / CARD_HEIGHTS[320] },
  { width: "image-text", name: "Card-Image-Text", about: "Phone, photo on top", ratio: 0.6 },
  ...CARD_WIDTHS.filter((w) => w >= 480).map((w) => ({
    width: w, name: `Card-${w}`,
    about: w === 640 ? "Square" : CARD_HEIGHTS[w] > w ? "Tall" : w >= 1280 ? "Wide, text panel" : "Wide",
    ratio: w / CARD_HEIGHTS[w],
  })),
];
export const cardName = (w: CardGrid["width"]) => CARDS.find((c) => c.width === w)?.name ?? `Card-${w}`;

// Small line drawings of each component for the Insert panel.
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" } as const;
export function ComponentThumb({ type }: { type: ComponentType }) {
  return (
    <svg viewBox="0 0 80 48" aria-hidden="true" className="ins-thumb">
      <rect x="1" y="1" width="78" height="46" rx="4" {...stroke} />
      {type === "hero" && <>
        <path d="M6 7h12M48 7h8M60 7h8" {...stroke} />
        <path d="M8 26h40M8 31h28" {...stroke} strokeWidth={3} />
        <rect x="8" y="36" width="16" height="6" rx="3" {...stroke} />
      </>}
      {type === "section-header" && <>
        <path d="M8 12h14" {...stroke} />
        <path d="M34 12h36M34 19h28" {...stroke} strokeWidth={3} />
        <path d="M34 28h36M34 33h30M34 38h20" {...stroke} />
      </>}
      {type === "credibility" && <>
        <path d="M8 24h14" {...stroke} />
        {[30, 42, 54, 66].map((x) => <rect key={x} x={x} y="19" width="9" height="10" rx="2" {...stroke} />)}
      </>}
      {type === "platforms" && <>
        <path d="M8 9h10M30 9h40M30 15h28" {...stroke} />
        {[8, 22, 36].map((x) => <rect key={x} x={x} y="34" width="12" height="6" rx="3" {...stroke} />)}
        {[52, 60, 68].map((x) => <rect key={x} x={x} y="26" width="5" height="5" rx="1" {...stroke} />)}
        {[52, 60, 68].map((x) => <rect key={x + 1} x={x} y="34" width="5" height="5" rx="1" {...stroke} />)}
      </>}
    </svg>
  );
}

export function CardThumb({ ratio, imageText }: { ratio: number; imageText?: boolean }) {
  const h = 40;
  const w = Math.min(72, Math.round(h * ratio));
  return (
    <span className="ins-card-box" aria-hidden="true">
      <span className="ins-card-thumb" style={{ width: w, height: h }}>
        {imageText && <span className="ins-card-thumb-text" />}
      </span>
    </span>
  );
}
