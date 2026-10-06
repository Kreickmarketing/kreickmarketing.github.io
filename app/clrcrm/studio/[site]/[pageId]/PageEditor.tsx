"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PageContent } from "@/lib/studio";
import { publishPage, saveDraft } from "../../actions";

type Props = {
  page: { id: string; slug: string; title: string; draft: PageContent; published: PageContent | null };
  site: { slug: string; name: string };
  cardNames: Record<string, string>;
};

type Path = (string | number)[];

const DESKTOP = 1280;

const COMPONENT_NAMES: Record<string, string> = {
  hero: "Hero", "section-header": "Section header", credibility: "Credibility", platforms: "Platforms",
};

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

function setIn<T>(obj: T, path: Path, value: unknown): T {
  if (path.length === 0) return value as T;
  const [head, ...rest] = path;
  const copy = (Array.isArray(obj) ? [...obj] : { ...obj }) as Record<string | number, unknown>;
  copy[head] = setIn(copy[head], rest, value);
  return copy as T;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export default function PageEditor({ page, site, cardNames }: Props) {
  const [content, setContent] = useState<PageContent>(page.draft);
  const [saved, setSaved] = useState<PageContent>(page.draft);
  const [published, setPublished] = useState<PageContent | null>(page.published);
  const [busy, setBusy] = useState<"" | "save" | "publish">("");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [summary, setSummary] = useState("");
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [device, setDevice] = useState<"desktop" | "phone">("desktop");
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Desktop preview: draw the page 1280px wide, shrunk to fit the panel.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / DESKTOP)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const dirty = !same(content, saved);
  const unpublished = !published || !same(saved, published);
  const state = dirty ? "Unsaved changes" : !published ? "Draft, never published" : unpublished ? "Saved, not published yet" : "Published";

  // Send the latest content to the preview frame.
  const sendPreview = useCallback(() => {
    frame.current?.contentWindow?.postMessage({ type: "studio-preview", content }, window.location.origin);
  }, [content]);
  useEffect(sendPreview, [sendPreview]);
  useEffect(() => {
    const onReady = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.type === "studio-preview-ready") sendPreview();
    };
    window.addEventListener("message", onReady);
    return () => window.removeEventListener("message", onReady);
  }, [sendPreview]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = (path: Path, value: unknown) => { setContent((c) => setIn(c, path, value)); setMessage(null); };

  async function onSave() {
    setBusy("save");
    const r = await saveDraft(page.id, content).catch(() => ({ ok: false as const, error: "Couldn't reach the server. Check your connection and try again." }));
    setBusy("");
    if (r.ok) { setSaved(content); setMessage({ kind: "ok", text: "Draft saved. Visitors don't see it until you publish." }); }
    else setMessage({ kind: "error", text: r.error });
  }

  async function onPublish() {
    const first = !published;
    const warning = first && page.slug === "/"
      ? "This is the first Publish of the Home page. It will replace the current homepage on the live site. Continue?"
      : "Publish this page to the live site?";
    if (!window.confirm(warning)) return;
    setBusy("publish");
    const r = await publishPage(page.id, content, summary).catch(() => ({ ok: false as const, error: "Couldn't reach the server. Check your connection and try again." }));
    setBusy("");
    if (r.ok) {
      setSaved(content); setPublished(content); setSummary("");
      setMessage({ kind: "ok", text: "Published. The live page updates within about a minute." });
    } else setMessage({ kind: "error", text: r.error });
  }

  const sections = useMemo(() => content.sections, [content]);

  return (
    <div className={`pe pe-view-${view}`}>
      <div className="pe-bar">
        <nav className="studio-crumbs" aria-label="Breadcrumb">
          <Link href="/clrcrm/studio">My Sites</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/clrcrm/studio/${site.slug}`}>{site.name}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{page.title}</span>
        </nav>
        <div className="pe-actions">
          <span className={`studio-pill ${dirty ? "studio-pill-changed" : unpublished ? "studio-pill-draft" : "studio-pill-live"}`}>{state}</span>
          <button type="button" className="pe-btn" onClick={onSave} disabled={!dirty || !!busy}>
            {busy === "save" ? "Saving…" : "Save draft"}
          </button>
          <input
            className="pe-summary" value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={300}
            placeholder="What changed? (optional)" aria-label="What changed (saved with this version)"
          />
          <button type="button" className="pe-btn pe-btn-action" onClick={onPublish} disabled={!!busy || (!dirty && !unpublished)}>
            {busy === "publish" ? "Publishing…" : "Publish"}
          </button>
        </div>
        <p className={`pe-message${message ? ` pe-message-${message.kind}` : ""}`} role="status" aria-live="polite">{message?.text}</p>
        <div className="pe-switch" role="tablist" aria-label="Show">
          <button type="button" role="tab" aria-selected={view === "edit"} onClick={() => setView("edit")}>Edit</button>
          <button type="button" role="tab" aria-selected={view === "preview"} onClick={() => setView("preview")}>Preview</button>
        </div>
      </div>

      <div className="pe-body">
        <aside className="pe-fields" aria-label="Page content">
          {sections.map((s, si) => (
            <details key={s.id} className="pe-section" open={si === 0}>
              <summary>
                <span>{s.components ? s.components.map((c) => COMPONENT_NAMES[c.type] ?? c.type).join(" + ") : "Cards"}</span>
                <span className="studio-code">#{s.id}</span>
              </summary>
              {s.components?.map((c, ci) => (
                <div key={c.id} className="pe-component">
                  {s.components!.length > 1 && <h3>{COMPONENT_NAMES[c.type]}</h3>}
                  <Fields value={c.props} path={["sections", si, "components", ci, "props"]} update={update} depth={0} />
                </div>
              ))}
              {s.cards && (
                <div className="pe-component">
                  <p className="studio-meta">
                    {s.cards.items.map((i) => cardNames[`${s.cards!.collection}/${i}`] ?? i).join(", ")} · from {s.cards.collection} · Card-{s.cards.width}
                  </p>
                  <p className="studio-hint">Card text is edited in the CMS (Studio step 5). Changing it there updates every page that shows the card.</p>
                </div>
              )}
            </details>
          ))}
        </aside>

        <div className="pe-preview">
          <div className="pe-devices" role="group" aria-label="Preview width">
            <button type="button" aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}>Desktop</button>
            <button type="button" aria-pressed={device === "phone"} onClick={() => setDevice("phone")}>Phone</button>
          </div>
          <div ref={box} className={`pe-frame pe-frame-${device}`}>
            <iframe
              ref={frame} src={`/clrcrm/preview/${page.id}`} title={`Preview of ${page.title}`} onLoad={sendPreview}
              style={device === "desktop" ? { width: DESKTOP, height: `${100 / scale}%`, transform: `scale(${scale})` } : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// One field per piece of text, following the shape of the component's content.
function Fields({ value, path, update, depth, name = "" }: { value: unknown; path: Path; update: (p: Path, v: unknown) => void; depth: number; name?: string }) {
  if (typeof value === "string") {
    const key = String(path[path.length - 1]);
    const isLink = key === "href";
    const long = LONG_TEXT.includes(name || key) && !isLink;
    const id = path.join("-");
    return (
      <div className="pe-field">
        <label htmlFor={id}>{typeof path[path.length - 1] === "number" ? `${SINGULAR[name] ?? "Item"} ${Number(key) + 1}` : label(key, depth)}</label>
        {long
          ? <textarea id={id} value={value} rows={3} onChange={(e) => update(path, e.target.value)} />
          : <input id={id} type={isLink ? "url" : "text"} inputMode={isLink ? "url" : undefined} value={value} onChange={(e) => update(path, e.target.value)} />}
        {isLink && <span className="pe-field-hint">https://…, /page or #section</span>}
      </div>
    );
  }
  if (typeof value === "number") {
    const key = String(path[path.length - 1]);
    const id = path.join("-");
    return (
      <div className="pe-field">
        <label htmlFor={id}>{label(key, depth)}</label>
        <input id={id} type="number" step="any" value={value} onChange={(e) => update(path, e.target.value === "" ? 0 : Number(e.target.value))} />
      </div>
    );
  }
  if (Array.isArray(value)) {
    return (
      <fieldset className="pe-group">
        <legend>{label(name, depth)}</legend>
        {value.map((v, i) => (
          typeof v === "object" && v !== null
            ? <fieldset key={i} className="pe-group pe-group-item"><legend>{SINGULAR[name] ?? "Item"} {i + 1}</legend>
                <Fields value={v} path={[...path, i]} update={update} depth={depth + 1} />
              </fieldset>
            : <Fields key={i} value={v} path={[...path, i]} update={update} depth={depth + 1} name={name} />
        ))}
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
