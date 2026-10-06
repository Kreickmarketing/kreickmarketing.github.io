"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PageContent, StudioSection } from "@/lib/studio";
import { publishPage, saveDraft } from "../../actions";
import Fields, { type Path } from "./Fields";
import { CARDS, COMPONENTS, COMPONENT_NAMES, CardThumb, ComponentThumb, cardName, template, type CardOption, type ComponentType } from "./blocks";
import * as ops from "./page-ops";

export type EditorItem = { collection: string; slug: string; title: string };

type Props = {
  page: { id: string; slug: string; title: string; draft: PageContent; published: PageContent | null };
  site: { slug: string; name: string; bookingUrl: string };
  collections: { slug: string; name: string }[];
  items: EditorItem[];
};

// What is being dragged on a laptop: something from the Insert panel, or a section.
type Drag = { kind: "insert"; make: () => StudioSection } | { kind: "section"; from: number } | null;

const DESKTOP = 1280;

function setIn<T>(obj: T, path: Path, value: unknown): T {
  if (path.length === 0) return value as T;
  const [head, ...rest] = path;
  const copy = (Array.isArray(obj) ? [...obj] : { ...obj }) as Record<string | number, unknown>;
  copy[head] = setIn(copy[head], rest, value);
  return copy as T;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const sectionName = (s: StudioSection) => s.components
  ? s.components.map((c) => COMPONENT_NAMES[c.type] ?? c.type).join(" + ")
  : `Cards · ${cardName(s.cards.width)}`;

export default function PageEditor({ page, site, collections, items }: Props) {
  const [content, setContent] = useState<PageContent>(page.draft);
  const [saved, setSaved] = useState<PageContent>(page.draft);
  const [published, setPublished] = useState<PageContent | null>(page.published);
  const [history, setHistory] = useState<{ content: PageContent; what: string }[]>([]);
  const [busy, setBusy] = useState<"" | "save" | "publish">("");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [summary, setSummary] = useState("");
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [panel, setPanel] = useState<"layers" | "insert">("layers");
  const [open, setOpen] = useState(0);
  const [drag, setDrag] = useState<Drag>(null);
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
  const post = useCallback((msg: object) => frame.current?.contentWindow?.postMessage(msg, window.location.origin), []);
  const sendPreview = useCallback(() => post({ type: "studio-preview", content }), [post, content]);
  useEffect(sendPreview, [sendPreview]);
  useEffect(() => {
    const onReady = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.type === "studio-preview-ready") sendPreview();
    };
    window.addEventListener("message", onReady);
    return () => window.removeEventListener("message", onReady);
  }, [sendPreview]);
  const showInPreview = (id: string) => setTimeout(() => post({ type: "studio-focus", id }), 50);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Typing in a field.
  const update = (path: Path, value: unknown) => { setContent((c) => setIn(c, path, value)); setMessage(null); };

  // A layout change (add, move, remove), which Undo can take back.
  function change(what: string, fn: (c: PageContent) => PageContent) {
    setHistory((h) => [...h.slice(-30), { content, what }]);
    setContent(fn(content));
    setMessage(null);
  }
  function undo() {
    const last = history[history.length - 1];
    if (!last) return;
    setContent(last.content);
    setHistory((h) => h.slice(0, -1));
    setMessage({ kind: "ok", text: `Undid: ${last.what}.` });
  }

  // ── Inserting ──
  const firstItem = items[0];
  const makeComponent = (type: ComponentType) => (): StudioSection => {
    const id = ops.freeId(content, type);
    return { id, components: [template(type, `${id}-1`, site.bookingUrl)] };
  };
  const makeCards = (card: CardOption) => (): StudioSection => ({
    id: ops.freeId(content, "cards"),
    cards: { collection: firstItem.collection, items: [firstItem.slug], width: card.width },
  });
  function insertAt(at: number, make: () => StudioSection, name: string) {
    const s = make();
    change(`add ${name}`, (c) => ops.insertSection(c, at, s));
    setOpen(at);
    setPanel("layers");
    showInPreview(s.id);
  }
  const insertPoint = () => Math.min(open + 1, content.sections.length);

  function drop(at: number) {
    if (!drag) return;
    if (drag.kind === "insert") insertAt(at, drag.make, "a block");
    else if (drag.from !== at && drag.from + 1 !== at) {
      const to = drag.from < at ? at - 1 : at;
      change("move a section", (c) => ops.moveSection(c, drag.from, to));
      setOpen(to);
    }
    setDrag(null);
  }

  // ── Sections ──
  function moveSectionBy(i: number, dir: -1 | 1) {
    change("move a section", (c) => ops.moveSection(c, i, i + dir));
    setOpen(i + dir);
    showInPreview(content.sections[i].id);
  }
  function removeSection(i: number) {
    if (!window.confirm(`Remove the ${sectionName(content.sections[i])} section? (You can Undo.)`)) return;
    change("remove a section", (c) => ops.removeSection(c, i));
    setOpen(Math.max(0, i - 1));
  }
  function rename(i: number, id: string) {
    if (id === content.sections[i].id) return true;
    if (!/^[a-z0-9-]{1,60}$/.test(id)) { setMessage({ kind: "error", text: "Link names can only use small letters, numbers and dashes." }); return false; }
    if (content.sections.some((s, j) => j !== i && s.id === id)) { setMessage({ kind: "error", text: `Another section is already called #${id}.` }); return false; }
    change("rename a section", (c) => ops.renameSection(c, i, id));
    return true;
  }

  // ── Saving ──
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

  const titleOf = (collection: string, slug: string) => items.find((i) => i.collection === collection && i.slug === slug)?.title ?? slug;
  const collectionName = (slug: string) => collections.find((c) => c.slug === slug)?.name ?? slug;

  const DropZone = ({ at }: { at: number }) => drag ? (
    <div
      className="pe-drop" onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("pe-drop-over"); }}
      onDragLeave={(e) => e.currentTarget.classList.remove("pe-drop-over")}
      onDrop={(e) => { e.preventDefault(); drop(at); }}
    >Drop here</div>
  ) : null;

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
          <button type="button" className="pe-btn" onClick={undo} disabled={!history.length || !!busy}
            title={history.length ? `Undo: ${history[history.length - 1].what}` : "Nothing to undo"}>Undo</button>
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
          <div className="pe-tabs" role="tablist" aria-label="Panel">
            <button type="button" role="tab" aria-selected={panel === "layers"} onClick={() => setPanel("layers")}>Layers</button>
            <button type="button" role="tab" aria-selected={panel === "insert"} onClick={() => setPanel("insert")}>+ Insert</button>
          </div>

          {/* Both panels stay on the page (one hidden) so a drag that starts in
              Insert survives the switch to Layers. */}
          <div className="pe-insert" hidden={panel !== "insert"}>
              <p className="studio-hint">Laptop: drag a block onto the Layers list. Phone: tap it to add it after the open section (then use ↑ ↓ to move it).</p>
              <h3>Components</h3>
              <ul className="ins-list">
                {COMPONENTS.map((c) => (
                  <li key={c.type}>
                    <button
                      type="button" className="ins-item" draggable
                      onDragStart={(e) => { e.dataTransfer.setData("text/plain", c.type); const make = makeComponent(c.type); setTimeout(() => { setDrag({ kind: "insert", make }); setPanel("layers"); }, 0); }}
                      onDragEnd={() => setDrag(null)}
                      onClick={() => insertAt(insertPoint(), makeComponent(c.type), c.name)}
                    >
                      <ComponentThumb type={c.type} />
                      <span><strong>{c.name}</strong><span className="studio-meta">{c.about}</span></span>
                    </button>
                  </li>
                ))}
              </ul>
              <h3>Cards</h3>
              {!firstItem && <p className="studio-hint">Add items in the CMS first (Studio step 5).</p>}
              <ul className="ins-list ins-cards">
                {CARDS.map((c) => (
                  <li key={c.name}>
                    <button
                      type="button" className="ins-item" draggable={!!firstItem} disabled={!firstItem}
                      onDragStart={(e) => { e.dataTransfer.setData("text/plain", c.name); const make = makeCards(c); setTimeout(() => { setDrag({ kind: "insert", make }); setPanel("layers"); }, 0); }}
                      onDragEnd={() => setDrag(null)}
                      onClick={() => insertAt(insertPoint(), makeCards(c), c.name)}
                    >
                      <CardThumb ratio={c.ratio} imageText={c.width === "image-text"} />
                      <span><strong>{c.name}</strong><span className="studio-meta">{c.about}</span></span>
                    </button>
                  </li>
                ))}
              </ul>
          </div>

          <div className="pe-layers" hidden={panel !== "layers"}>
              {content.sections.length === 0 && <p className="studio-empty">This page is empty. Open + Insert to add a block.</p>}
              <DropZone at={0} />
              {content.sections.map((s, si) => {
                const isOpen = open === si;
                const prevComp = ops.neighbourWithComponents(content, si, -1);
                const nextComp = ops.neighbourWithComponents(content, si, 1);
                return (
                  <div key={si} className="pe-layer">
                    <div className={`pe-section${isOpen ? " pe-section-open" : ""}${drag?.kind === "section" && drag.from === si ? " pe-dragging" : ""}`}>
                      <div
                        className="pe-section-head" draggable title="Drag to move"
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", s.id);
                          e.dataTransfer.effectAllowed = "move";
                          // Chrome cancels a drag if the page changes during dragstart, so show drop spots a moment later.
                          setTimeout(() => setDrag({ kind: "section", from: si }), 0);
                        }}
                        onDragEnd={() => setDrag(null)}
                      >
                        <span className="pe-handle" aria-hidden="true">⋮⋮</span>
                        <button type="button" className="pe-section-title" aria-expanded={isOpen}
                          onClick={() => { setOpen(isOpen ? -1 : si); if (!isOpen) showInPreview(s.id); }}>
                          <span>{sectionName(s)}</span>
                          <span className="studio-code">#{s.id}</span>
                        </button>
                        <button type="button" className="pe-icon-btn" aria-label={`Move ${sectionName(s)} up`} disabled={si === 0} onClick={() => moveSectionBy(si, -1)}>↑</button>
                        <button type="button" className="pe-icon-btn" aria-label={`Move ${sectionName(s)} down`} disabled={si === content.sections.length - 1} onClick={() => moveSectionBy(si, 1)}>↓</button>
                        <button type="button" className="pe-icon-btn" aria-label={`Remove ${sectionName(s)}`} onClick={() => removeSection(si)}>×</button>
                      </div>

                      {isOpen && (
                        <div className="pe-section-body">
                          <AnchorField key={s.id} id={s.id} onCommit={(v) => rename(si, v)} />

                          {s.components?.map((c, ci) => (
                            <div key={c.id} className="pe-component">
                              <div className="pe-component-head">
                                <h3>{COMPONENT_NAMES[c.type]}</h3>
                                {s.components!.length > 1 && <>
                                  <button type="button" className="pe-icon-btn" aria-label={`Move ${COMPONENT_NAMES[c.type]} up within this section`} disabled={ci === 0}
                                    onClick={() => change("move a component", (x) => ops.moveComponent(x, si, ci, ci - 1))}>↑</button>
                                  <button type="button" className="pe-icon-btn" aria-label={`Move ${COMPONENT_NAMES[c.type]} down within this section`} disabled={ci === s.components!.length - 1}
                                    onClick={() => change("move a component", (x) => ops.moveComponent(x, si, ci, ci + 1))}>↓</button>
                                </>}
                                {prevComp >= 0 && <button type="button" className="pe-text-btn" onClick={() => { change("move a component", (x) => ops.moveComponentToSection(x, si, ci, prevComp)); setOpen(prevComp); }}>
                                  Into section above</button>}
                                {nextComp >= 0 && <button type="button" className="pe-text-btn" onClick={() => {
                                  const emptied = s.components!.length === 1;
                                  change("move a component", (x) => ops.moveComponentToSection(x, si, ci, nextComp));
                                  setOpen(emptied ? nextComp - 1 : nextComp);
                                }}>Into section below</button>}
                                {s.components!.length > 1 && <button type="button" className="pe-icon-btn" aria-label={`Remove ${COMPONENT_NAMES[c.type]}`}
                                  onClick={() => window.confirm(`Remove this ${COMPONENT_NAMES[c.type]}? (You can Undo.)`) && change("remove a component", (x) => ops.removeComponent(x, si, ci))}>×</button>}
                              </div>
                              <Fields value={c.props} path={["sections", si, "components", ci, "props"]} update={update} />
                            </div>
                          ))}

                          {s.cards && (
                            <div className="pe-component">
                              <div className="pe-field">
                                <label htmlFor={`width-${si}`}>Card size</label>
                                <select id={`width-${si}`} value={String(s.cards.width)}
                                  onChange={(e) => change("change the card size", (x) => ops.setCardWidth(x, si, e.target.value === "image-text" ? "image-text" : Number(e.target.value) as CardOption["width"]))}>
                                  {CARDS.map((c) => <option key={c.name} value={String(c.width)}>{c.name} · {c.about}</option>)}
                                </select>
                              </div>
                              <p className="studio-meta">From {collectionName(s.cards.collection)}</p>
                              <ol className="pe-cards">
                                {s.cards.items.map((slug, i) => (
                                  <li key={slug}>
                                    <span>{titleOf(s.cards!.collection, slug)}</span>
                                    <button type="button" className="pe-icon-btn" aria-label="Move card up" disabled={i === 0}
                                      onClick={() => change("move a card", (x) => ops.moveCard(x, si, i, i - 1))}>↑</button>
                                    <button type="button" className="pe-icon-btn" aria-label="Move card down" disabled={i === s.cards!.items.length - 1}
                                      onClick={() => change("move a card", (x) => ops.moveCard(x, si, i, i + 1))}>↓</button>
                                    <button type="button" className="pe-icon-btn" aria-label="Remove card from this page"
                                      onClick={() => change("remove a card", (x) => ops.removeCard(x, si, i))}>×</button>
                                  </li>
                                ))}
                              </ol>
                              {(() => {
                                const g = s.cards!;
                                const left = items.filter((it) => it.collection === g.collection && !g.items.includes(it.slug));
                                return left.length ? (
                                  <select aria-label="Add a card" value="" onChange={(e) => e.target.value && change("add a card", (x) => ops.addCard(x, si, e.target.value))}>
                                    <option value="">+ Add a card…</option>
                                    {left.map((it) => <option key={it.slug} value={it.slug}>{it.title}</option>)}
                                  </select>
                                ) : <p className="studio-hint">Every {collectionName(g.collection)} item is already here.</p>;
                              })()}
                              <p className="studio-hint">Card text is edited in the CMS (Studio step 5). Changing it there updates every page that shows the card.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <DropZone at={si + 1} />
                  </div>
                );
              })}
          </div>
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

// The section's link name, used by nav links (#solutions). Saved when you
// leave the box or press Enter, so typing doesn't jump around.
function AnchorField({ id, onCommit }: { id: string; onCommit: (v: string) => boolean }) {
  const [v, setV] = useState(id);
  const commit = () => { if (!onCommit(v.trim())) setV(id); };
  return (
    <div className="pe-field">
      <label htmlFor={`anchor-${id}`}>Link name (nav links use #{id})</label>
      <input id={`anchor-${id}`} value={v} onChange={(e) => setV(e.target.value.toLowerCase())} onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } }} />
    </div>
  );
}
