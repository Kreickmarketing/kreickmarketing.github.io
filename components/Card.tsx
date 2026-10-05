import Image from "next/image";
import "./card.css";

// ClearMark card system. One set of content fields (see app/design-system)
// fills every card; the card's width decides which fields show and how big.

export type CardContent = {
  ct100: string;          // Content Title 100
  ct200?: string;         // Content Title 200
  ct300?: string;         // Content Title 300
  cs?: string;            // Content Short
  cb?: string;            // Content Button (text)
  cbl?: string;           // Content Button Link
  cp?: string;            // Content Price
  cpdt?: string[];        // Content Price Dates, one line each
  tags?: string[];        // Tags shown as "+" pills
  image: string;          // CI-01
  imageAlt?: string;
};

export const CARD_WIDTHS = [160, 320, 480, 640, 800, 960, 1120, 1280, 1440, 1600, 1760, 1920] as const;
export type CardWidth = (typeof CARD_WIDTHS)[number];

const HEIGHT: Record<CardWidth, number> = {
  160: 240, 320: 480, 480: 640, 640: 640, 800: 960, 960: 800,
  1120: 800, 1280: 800, 1440: 800, 1600: 960, 1760: 960, 1920: 960,
};

// Which type-scale step each field uses (names match styles/typography.css).
type Step = "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "h6" | "h5" | "h4" | "h3" | "h2";
type Scale = { ct100: Step; ct200: Step; ct300: Step; cp: Step; cpdt: Step };
const SMALL: Scale = { ct100: "md", ct200: "sm", ct300: "xxs", cp: "md", cpdt: "xxs" };
const PHONE: Scale = { ct100: "h6", ct200: "xl", ct300: "sm", cp: "h6", cpdt: "xs" };
const MEDIUM: Scale = { ct100: "h5", ct200: "h6", ct300: "md", cp: "h5", cpdt: "xs" };
const LARGE: Scale = { ct100: "h2", ct200: "h5", ct300: "md", cp: "h4", cpdt: "sm" };
const PANEL: Scale = { ct100: "h4", ct200: "h6", ct300: "md", cp: "h4", cpdt: "sm" };

function layout(w: CardWidth) {
  if (w === 160) return { tier: "s", scale: SMALL };
  if (w === 320) return { tier: "s", scale: PHONE };
  if (w <= 640) return { tier: "m", scale: MEDIUM };
  if (w <= 1120) return { tier: "m", scale: LARGE };
  return { tier: "l", scale: PANEL };
}

function Tags({ tags }: { tags: string[] }) {
  return (
    <ul className="card-tags">
      {tags.map((t) => (
        <li key={t}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          {t}
        </li>
      ))}
    </ul>
  );
}

function Price({ c, scale }: { c: CardContent; scale?: Scale }) {
  if (!c.cp) return null;
  return (
    <div className="card-price">
      <p className={`t-${scale?.cp ?? "h6"} card-cp`}>{c.cp}</p>
      {c.cpdt?.map((line) => <p key={line} className={`t-${scale?.cpdt ?? "xs"} card-cpdt`}>{line}</p>)}
    </div>
  );
}

function Button({ c }: { c: CardContent }) {
  if (!c.cb) return null;
  return (
    <a className="t-sm card-cb" href={c.cbl ?? "#"}>
      {c.cb}
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    </a>
  );
}

// Photo cards: Card-160 to Card-1920. Text sits on top of the photo.
export function Card({ width, content: c }: { width: CardWidth; content: CardContent }) {
  const { tier, scale } = layout(width);
  const titles = (
    <div className="card-titles">
      <h3 className={`t-${scale.ct100} card-ct100`}>{c.ct100}</h3>
      {c.ct200 && <p className={`t-${scale.ct200} card-ct200`}>{c.ct200}</p>}
      {c.ct300 && <p className={`t-${scale.ct300} card-ct300`}>{c.ct300}</p>}
    </div>
  );
  return (
    <article className={`card card-${width} card-tier-${tier}`} style={{ width, height: HEIGHT[width] }}>
      <Image src={c.image} alt={c.imageAlt ?? ""} fill sizes={`${width}px`} className="card-image" />
      {tier === "l" ? (
        <>
          <div className="card-panel">
            {titles}
            {c.cs && <p className="t-sm card-cs">{c.cs}</p>}
            <Button c={c} />
          </div>
          <div className="card-foot">
            {c.tags && <Tags tags={c.tags} />}
            <Price c={c} scale={scale} />
          </div>
        </>
      ) : (
        <>
          {titles}
          <div className={`card-foot${width === 160 ? "" : " card-divider"}`}>
            {tier === "m" && width >= 640 && c.tags && <Tags tags={c.tags} />}
            <Price c={c} scale={scale} />
          </div>
        </>
      )}
    </article>
  );
}

// Card-Image-Text (mobile): photo on top, dark text on a light card below.
export function CardImageText({ content: c }: { content: CardContent }) {
  return (
    <article className="card-it">
      <div className="card-it-image">
        <Image src={c.image} alt={c.imageAlt ?? ""} fill sizes="288px" className="card-image" />
      </div>
      <div className="card-titles">
        <h3 className="t-h6 card-ct100">{c.ct100}</h3>
        {c.ct200 && <p className="t-xl card-ct200">{c.ct200}</p>}
        {c.ct300 && <p className="t-sm card-ct300">{c.ct300}</p>}
      </div>
      {c.cs && <p className="t-sm card-cs">{c.cs}</p>}
      <Button c={c} />
      <div className="card-foot card-divider">
        {c.tags && <Tags tags={c.tags} />}
        <Price c={c} />
      </div>
    </article>
  );
}
