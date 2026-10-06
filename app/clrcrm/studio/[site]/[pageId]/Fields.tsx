"use client";

// The edit boxes for one component: one field per piece of text, following
// the shape of the component's content. Lists (tags, logos, headline lines)
// can grow and shrink.

export type Path = (string | number)[];
type Update = (p: Path, v: unknown) => void;

// Friendly names for the fields inside components.
const LABELS: Record<string, string> = {
  title: "Headline", cta: "Button", href: "Link", imageAlt: "Image description (read aloud by screen readers)",
  testimonial: "Testimonial", name: "Name", quote: "Quote", stat: "Stat card", kicker: "Small title",
  value: "Value", bars: "Bars", logos: "Logos", tags: "Tags", tagline: "Tagline", body: "Paragraph",
};
const SINGULAR: Record<string, string> = { logos: "Logo", bars: "Bar", tags: "Tag", title: "Line" };
const LONG_TEXT = ["quote", "body", "title"];
const HIDDEN = ["src", "avatar", "width", "height", "light", "icon"];
// The database stores fields alphabetically; show them in reading order instead.
const ORDER = ["tagline", "label", "name", "title", "body", "quote", "kicker", "value", "cta", "href", "image", "imageAlt", "testimonial", "stat", "tags", "logos", "bars"];
const rank = (k: string) => (ORDER.indexOf(k) + 1 || ORDER.length + 1);

const label = (key: string, depth: number) =>
  key === "label" ? (depth === 0 ? "Label" : "Text") : LABELS[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

// An empty copy of a list item, used for "+ Add".
function blank(v: unknown): unknown {
  if (typeof v === "string") return "";
  if (typeof v === "number") return 0;
  if (Array.isArray(v)) return [];
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blank(x)]));
  return "";
}

export default function Fields({ value, path, update, depth = 0, name = "" }: { value: unknown; path: Path; update: Update; depth?: number; name?: string }) {
  const last = path[path.length - 1];
  const id = path.join("-");

  if (typeof value === "string") {
    const key = String(last);
    const isLink = key === "href";
    const long = LONG_TEXT.includes(name || key) && !isLink;
    return (
      <div className="pe-field">
        <label htmlFor={id}>{typeof last === "number" ? `${SINGULAR[name] ?? "Item"} ${last + 1}` : label(key, depth)}</label>
        {long
          ? <textarea id={id} value={value} rows={3} onChange={(e) => update(path, e.target.value)} />
          : <input id={id} type={isLink ? "url" : "text"} inputMode={isLink ? "url" : undefined} value={value} onChange={(e) => update(path, e.target.value)} />}
        {isLink && <span className="pe-field-hint">https://…, /page or #section</span>}
      </div>
    );
  }

  if (typeof value === "number") {
    return (
      <div className="pe-field">
        <label htmlFor={id}>{label(String(last), depth)}</label>
        <input id={id} type="number" step="any" value={value} onChange={(e) => update(path, e.target.value === "" ? 0 : Number(e.target.value))} />
      </div>
    );
  }

  if (Array.isArray(value)) {
    const one = SINGULAR[name] ?? "item";
    return (
      <fieldset className="pe-group">
        <legend>{label(name, depth)}</legend>
        {value.map((v, i) => (
          <div key={i} className="pe-item">
            {typeof v === "object" && v !== null
              ? <fieldset className="pe-group pe-group-item"><legend>{SINGULAR[name] ?? "Item"} {i + 1}</legend>
                  <Fields value={v} path={[...path, i]} update={update} depth={depth + 1} />
                </fieldset>
              : <Fields value={v} path={[...path, i]} update={update} depth={depth + 1} name={name} />}
            <button type="button" className="pe-icon-btn" aria-label={`Remove ${one.toLowerCase()} ${i + 1}`} title="Remove"
              onClick={() => update(path, value.filter((_, j) => j !== i))}>×</button>
          </div>
        ))}
        <button type="button" className="pe-add" onClick={() => update(path, [...value, value.length ? blank(value[0]) : ""])}>
          + Add {one.toLowerCase()}
        </button>
      </fieldset>
    );
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => rank(a) - rank(b));
    const inner = entries.map(([k, v]) => {
      if (HIDDEN.includes(k)) return null;
      if (k === "image") return <p key={k} className="pe-field-hint">Image: {String(v)} (uploads come in Studio step 7)</p>;
      return Array.isArray(v) || (v && typeof v === "object")
        ? <Fields key={k} value={v} path={[...path, k]} update={update} depth={depth + 1} name={k} />
        : <Fields key={k} value={v} path={[...path, k]} update={update} depth={depth} />;
    });
    if (depth === 0 || !name) return <>{inner}</>;
    return <fieldset className="pe-group"><legend>{label(name, depth)}</legend>{inner}</fieldset>;
  }
  return null;
}
