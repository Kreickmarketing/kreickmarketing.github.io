// Live pages made in the Studio builder (/clrcrm/studio/builder).
//
// The builder saves one JSON "state" per site: pages (lists of template copies),
// spots ({ value, placed }), photo sides (flip) and template designs. Visitors see
// what was *placed* when Andrew pressed Publish. This file turns that state into
// HTML and CSS for the live site. It mirrors the builder's own drawing code
// (docs/prototypes/studio-builder/studio-builder.html: SECTION_HTML and cssFor),
// minus the editing marks, so keep the two in step when a template changes.
//
// Safety: the state is only ever written by logged-in CRM members, but it is
// still treated as untrusted here. Every text is escaped, images must be local
// files, links must be https, mailto or on-site, and design values must be one
// of the ClearMark names the Design view offers.

type Slot = { key: string; kind: "text" | "link" | "image" | "logos" | "list" | "offers" };
type Template = { id: string; type: string; slots: Slot[] };

const s = (key: string, kind: Slot["kind"]): Slot => ({ key, kind });
const TEMPLATES: Template[] = [
  { id: "hero", type: "hero", slots: [s("image", "image"), s("headline", "text"), s("button", "text"), s("link", "link"), s("quote", "list"), s("stat", "list")] },
  { id: "heading", type: "header", slots: [s("tagline", "text"), s("headline", "list"), s("body", "text")] },
  { id: "logos", type: "cred", slots: [s("label", "text"), s("logos", "logos")] },
  { id: "photo-points", type: "photopoints", slots: [s("photo", "image"), s("points", "list")] },
  { id: "photo-text", type: "story", slots: [s("photo", "image"), s("body", "text")] },
  { id: "photo-tags", type: "plat", slots: [s("image", "image"), s("label", "text"), s("headline", "list"), s("tags", "list"), s("logos", "logos")] },
  { id: "offers", type: "offersonly", slots: [s("cards", "offers")] },
  { id: "points", type: "points", slots: [s("points", "list")] },
  { id: "quote", type: "quote", slots: [s("text", "text"), s("by", "text")] },
  { id: "mailing", type: "mail", slots: [s("headline", "text"), s("intro", "text")] },
  { id: "page-hero", type: "pagehero", slots: [s("image", "image"), s("headline", "text")] },
  { id: "calendly", type: "calendly", slots: [] },
];

// Offer cards (the builder's CMS list for now).
const OFFERS: Record<string, { title: string; sub: string; price: string; note: string; image: string; status: string }> = {
  agency: { title: "Agency Systems", sub: "Pilot in three weeks, then a live cycle", price: "$2,500+", note: "setup · then $500–$1,500/mo", image: "/studio-media/poppies.jpg", status: "Ready" },
  content: { title: "Content System", sub: "AI content calendar and video scripts", price: "$125+", note: "a month · up to $500", image: "/studio-media/flowers.jpg", status: "Draft" },
  publishing: { title: "Publishing System", sub: "Book relaunch calendar and launch sprint", price: "$1,500+", note: "project · up to $5,000", image: "/studio-media/bridge.jpg", status: "Draft" },
  leadgen: { title: "Working Interview", sub: "A fast proof-of-work build, money-back", price: "$37", note: "one-time", image: "/studio-media/rock-climb.jpg", status: "Draft" },
};

const SECTION_CLASS: Record<string, string> = { hero: "hero", cred: "cred", photopoints: "std", plat: "std plat", quote: "std quote-sec", mail: "mail", pagehero: "hero page-hero", story: "std", points: "std", header: "std", offersonly: "std", calendly: "std" };
const PHOTO_TOP = ["hero", "pagehero", "plat"];

export type BuilderState = {
  pages?: Record<string, { uid: string; t: string; name?: string }[]>;
  slots?: Record<string, { placed?: unknown }>;
  flip?: Record<string, boolean>;
  design?: Record<string, Record<string, Record<string, Record<string, unknown>>>>;
  customTpls?: { id: string; base: string }[];
};

// One section of a live page. Most are finished HTML; the mailing list and
// Calendly need real React parts (the sign-up form), so they carry their text instead.
export type LiveSection =
  | { kind: "html"; id: string; className: string; html: string }
  | { kind: "mail"; id: string; className: string; headline: string; intro: string }
  | { kind: "calendly"; id: string; className: string };

export type LivePage = { sections: LiveSection[]; css: string; navOverPhoto: boolean };

// ── Safe values ──
const esc = (t: unknown) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const ID = /^[a-z0-9-]{1,60}$/;

export function safeImage(v: unknown): string | null {
  let src = str(v);
  if (src.startsWith("media/")) src = "/studio-media/" + src.slice(6);
  return /^\/[a-z0-9._/-]+\.(jpe?g|png|webp|gif|svg|avif)$/i.test(src) && !src.includes("..") ? src : null;
}
export function safeHref(v: unknown): string | null {
  const href = str(v);
  if (/^https:\/\/[^\s"'<>]+$/i.test(href) || /^mailto:[^\s"'<>]+$/i.test(href)) return href;
  if (/^\/[a-z0-9._/#?=&-]*$/i.test(href) && !href.startsWith("//")) return href;
  return null;
}
const rows = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? v.filter((r) => r && typeof r === "object") : []);
const hasText = (r: Record<string, unknown>) => Object.values(r).some((x) => str(x));

// ── Drawing each template (live mode: empty spots are simply left out) ──
function drawSection(type: string, P: (key: string) => unknown, flip: boolean): string {
  const text = (key: string, tag: string, cls = "") => { const v = str(P(key)); return v ? `<${tag}${cls ? ` class="${cls}"` : ""} data-slot=".${key}">${esc(v)}</${tag}>` : ""; };
  const lines = (key: string, tag: string) => { const v = rows(P(key)).map((r) => str(r.line)).filter(Boolean); return v.length ? `<${tag} data-slot=".${key}">${v.map((l) => `<span>${esc(l)}</span>`).join("")}</${tag}>` : ""; };
  const bg = (key: string) => { const src = safeImage(P(key)); return `<div class="hero-bg">${src ? `<img data-slot=".${key}" src="${esc(src)}" alt="">` : ""}</div>`; };
  const photo = (key: string) => { const src = safeImage(P(key)); return src ? `<img class="photo" data-slot=".${key}" src="${esc(src)}" alt="">` : "<div></div>"; };
  const points = (key: string) => { const v = rows(P(key)).filter(hasText); return v.length ? `<div class="points" data-slot=".${key}">${v.map((r) => `<div class="point"><b>${esc(str(r.title))}</b><p>${esc(str(r.proof))}</p></div>`).join("")}</div>` : ""; };
  const logos = (key: string, cls: string) => { const v = (Array.isArray(P(key)) ? (P(key) as unknown[]) : []).map(safeImage).filter(Boolean); return v.length ? `<div class="${cls}" data-slot=".${key}">${v.map((src) => `<img src="${esc(src)}" alt="">`).join("")}</div>` : ""; };

  switch (type) {
    case "hero": {
      const btn = str(P("button")), href = safeHref(P("link"));
      const q = rows(P("quote")).filter(hasText)[0], st = rows(P("stat")).filter(hasText)[0];
      return `${bg("image")}<div class="hero-main">${text("headline", "h1")}${btn && href ? `<a class="cta" data-slot=".button" href="${esc(href)}"${href.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : ""}>${esc(btn)} →</a>` : ""}</div>`
        + (q || st ? `<div class="hero-bottom">${q ? `<figure class="glass" data-slot=".quote"><b>${esc(str(q.name))}</b><span>${esc(str(q.quote))}</span></figure>` : "<div></div>"}${st ? `<aside class="stat-card" data-slot=".stat"><small>${esc(str(st.kicker))}</small><b>${esc(str(st.value))}</b></aside>` : ""}</div>` : "");
    }
    case "cred": return `${text("label", "p", "tagline")}${logos("logos", "logo-row")}`;
    case "photopoints": return `<div class="split${flip ? " flip" : ""}">${photo("photo")}${points("points")}</div>`;
    case "story": { const body = str(P("body")); return `<div class="split${flip ? " flip" : ""}">${photo("photo")}${body ? `<p class="body" data-slot=".body" style="font-size:20px;line-height:1.5;color:var(--iron-pine)">${esc(body)}</p>` : ""}</div>`; }
    case "plat": {
      const tags = rows(P("tags")).map((r) => str(r.tag)).filter(Boolean);
      return `${bg("image")}<div class="sh">${text("label", "p", "tagline")}${lines("headline", "h2")}</div><div class="plat-foot">${tags.length ? `<ul class="tag-pills" data-slot=".tags">${tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}${logos("logos", "plat-logos")}</div>`;
    }
    case "quote": { const q = str(P("text")); return `${q ? `<blockquote data-slot=".text">“${esc(q)}”</blockquote>` : ""}${text("by", "cite")}`; }
    case "pagehero": return `${bg("image")}<div class="hero-main">${text("headline", "h1")}</div>`;
    case "points": return points("points");
    case "header": { const body = str(P("body")); return `<div class="sh">${text("tagline", "p", "tagline")}<div>${lines("headline", "h2")}${body ? `<p class="body" data-slot=".body">${esc(body)}</p>` : ""}</div></div>`; }
    case "offersonly": {
      const ids = Array.isArray(P("cards")) ? (P("cards") as unknown[]) : [];
      const cards = ids.map((x) => OFFERS[str(x)]).filter(Boolean);
      return cards.length ? `<div class="offer-grid" data-slot=".cards">${cards.map((o) => `<article class="offer"><img src="${esc(o.image)}" alt=""><div><h3>${esc(o.title)}</h3><p>${esc(o.sub)}</p></div><div class="foot"><span style="font-family:var(--font-button);font-size:13px">+ ${o.status === "Ready" ? "Agency pilot" : "In the pipeline"}</span><div class="price">${esc(o.price)}<small>${esc(o.note)}</small></div></div></article>`).join("")}</div>` : "";
    }
    default: return "";
  }
}

// ── Design view choices → CSS (same rules as the builder's cssFor) ──
const COLORS = new Set(["white", "clay-light", "clay", "midnight", "rogue-cherry", "tidal-azure", "sage-mist", "deep-taupe", "iron-pine", "charcoal", "solar-flare", "honey-brass", "tangerine-burst", "iron-moss", "frosted-mint", "cobalt-wave", "aegean", "merlot", "lavender-mist"]);
// [size, line height, letter spacing, weight, phone size, phone line height]
const TEXT_STYLES: Record<string, number[]> = {
  h1: [112, 100, -4, 200, 88, 79], h2: [96, 88, -4, 200, 72, 65], h3: [80, 72, -4, 200, 60, 54],
  h4: [64, 56, -3, 300, 48, 43], h5: [52, 48, -2, 300, 40, 36], h6: [40, 36, -2, 300, 32, 29],
  tagline: [16, 16, 3, 700, 12, 12], xl: [28, 32, -1, 400], lg: [24, 28, -1, 400], md: [20, 24, -1, 400], sm: [16, 20, -1, 400], xs: [12, 14, -1, 400],
};
const WEIGHTS = new Set([200, 300, 400, 500, 600, 700, 800]);
const STEPS = new Set([0, 16, 32, 64, 96, 128, 160]);
const RATIOS = new Set(["1fr 1fr", "2fr 3fr", "3fr 2fr", "1fr 2fr", "2fr 1fr", "1fr"]);
const VALIGN = new Set(["start", "center", "end"]);
const ALIGN = new Set(["left", "center", "right"]);
const ASPECTS = new Set(["4 / 5", "1 / 1", "4 / 3", "16 / 9"]);
const BTN: Record<string, string> = { white: "background: var(--white); color: var(--midnight); border: 0", cherry: "background: var(--rogue-cherry); color: var(--white); border: 0", outline: "background: transparent; color: var(--white); border: 2px solid var(--white)" };
const COLS_SEL: Record<string, string> = { header: " .sh", photopoints: " .split", story: " .split", plat: " .sh", cred: "", mail: "" };
const num = (v: unknown, ok: (n: number) => boolean) => (typeof v === "number" && Number.isFinite(v) && ok(v) ? v : undefined);

function decls(props: Record<string, unknown>, bp: string): string[] {
  const out: string[] = [];
  const style = (k: unknown) => {
    const t = TEXT_STYLES[str(k)];
    if (!t) return;
    const ph = bp === "phone" && t[4];
    out.push(`font-size: ${ph ? t[4] : t[0]}px`, `line-height: ${ph ? t[5] : t[1]}px`, `letter-spacing: ${t[2]}px`, `font-weight: ${t[3]}`);
    if (k === "tagline") out.push("text-transform: uppercase");
  };
  for (const [p, v] of Object.entries(props)) {
    if ((p === "bg" || p === "color") && COLORS.has(str(v))) out.push(`${p === "bg" ? "background" : "color"}: var(--${v})`);
    else if (p === "pt" && num(v, (n) => STEPS.has(n)) !== undefined) out.push(`padding-top: ${v}px`);
    else if (p === "pb" && num(v, (n) => STEPS.has(n)) !== undefined) out.push(`padding-bottom: ${v}px`);
    else if (p === "px" && num(v, (n) => STEPS.has(n)) !== undefined) out.push(`padding-left: ${v}px`, `padding-right: ${v}px`);
    else if (p === "gap" && num(v, (n) => STEPS.has(n)) !== undefined) out.push(`gap: ${v}px`);
    else if (p === "hidden" && v === true) out.push("display: none");
    else if (p === "ratio" && RATIOS.has(str(v))) out.push(`grid-template-columns: ${v}`);
    else if (p === "valign" && VALIGN.has(str(v))) out.push(`align-items: ${v}`);
    else if (p === "style") style(v);
    else if (p === "weight" && num(v, (n) => WEIGHTS.has(n)) !== undefined) out.push(`font-weight: ${v}`);
    else if (p === "align" && ALIGN.has(str(v))) out.push(`text-align: ${v}`);
    else if (p === "radius" && num(v, (n) => n >= 0 && n <= 64) !== undefined) out.push(`border-radius: ${v}px`);
    else if (p === "aspect" && ASPECTS.has(str(v))) out.push(`aspect-ratio: ${v}`, "height: auto", "object-fit: cover");
  }
  return out;
}

function designCss(tplId: string, tpl: Template, d: Record<string, Record<string, Record<string, unknown>>>): string {
  const sc = `.site .t-${tplId}`, blocks: string[] = [];
  const obj = (x: unknown) => (x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, Record<string, unknown>>) : {});
  const at = { base: obj(d.base), tablet: obj(d.tablet), phone: obj(d.phone) };
  const valueAt = (bp: "phone", layer: string, prop: string) => { for (const b of ["phone", "tablet", "base"] as const) { const v = obj(at[b])[layer]?.[prop]; if (v !== undefined) return v; } return undefined; };
  for (const bp of ["base", "tablet", "phone"] as const) {
    const rules: string[] = [];
    const layers = new Set([...Object.keys(at[bp]), ...(bp === "phone" ? [...Object.keys(at.base), ...Object.keys(at.tablet)] : [])]);
    for (const layer of layers) {
      if (layer !== "section" && layer !== "columns" && !tpl.slots.some((x) => x.key === layer)) continue;
      const props: Record<string, unknown> = { ...(obj(at[bp][layer]) as Record<string, unknown>) };
      if (bp === "phone" && !props.style) { const st = valueAt("phone", layer, "style"); if (TEXT_STYLES[str(st)]?.[4]) props.style = st; }
      if (bp === "phone" && !props.tstyle) { const st = valueAt("phone", layer, "tstyle"); if (TEXT_STYLES[str(st)]?.[4]) props.tstyle = st; }
      if (!Object.keys(props).length) continue;
      if (layer === "columns" && !(tpl.type in COLS_SEL)) continue;
      const base = layer === "section" ? sc : layer === "columns" ? sc + COLS_SEL[tpl.type] : `${sc} [data-slot=".${layer}"]`;
      const sl = tpl.slots.find((x) => x.key === layer);
      const { tstyle, cols, logoh, btn, ...rest } = props;
      const own = decls(rest, bp);
      const hid = own.filter((x) => x.startsWith("display")), visual = own.filter((x) => !x.startsWith("display"));
      if (hid.length) rules.push(`${base} { ${hid.join("; ")}; }`);
      if (sl?.kind === "list" && layer === "points") {
        if (visual.length) rules.push(`${base} .point p { ${visual.join("; ")}; }`);
        const ts = decls({ style: tstyle }, bp);
        if (ts.length) rules.push(`${base} .point b { ${ts.join("; ")}; }`);
        if (COLORS.has(str(rest.color))) rules.push(`${base} .point b { color: var(--${rest.color}); }`);
        continue;
      }
      if (sl?.kind === "logos") { const h = num(logoh, (n) => n >= 16 && n <= 120); if (h !== undefined) rules.push(`${base} img { height: ${h}px; }`); continue; }
      if (sl?.kind === "offers") {
        const c = num(cols, (n) => Number.isInteger(n) && n >= 1 && n <= 4);
        if (c !== undefined) rules.push(`${base} { grid-template-columns: repeat(${c}, minmax(0, 1fr)); }`);
        const r = decls({ radius: rest.radius }, bp);
        if (r.length) rules.push(`${base} .offer { ${r.join("; ")}; }`);
        continue;
      }
      if (BTN[str(btn)]) rules.push(`${base} { ${BTN[str(btn)]}; }`);
      if (visual.length) rules.push(`${base} { ${visual.join("; ")}; }`);
    }
    if (!rules.length) continue;
    const q = bp === "tablet" ? "@container (max-width: 1000px)" : bp === "phone" ? "@container (max-width: 700px)" : "";
    blocks.push(q ? `${q} {\n  ${rules.join("\n  ")}\n}` : rules.join("\n"));
  }
  return blocks.join("\n");
}

// ── A whole live page ──
export function renderLivePage(state: BuilderState, pageId: string): LivePage | null {
  const list = Array.isArray(state?.pages?.[pageId]) ? state.pages![pageId] : null;
  if (!list?.length) return null;
  const tpls: Record<string, Template> = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));
  for (const c of Array.isArray(state.customTpls) ? state.customTpls : []) {
    if (ID.test(str(c?.id)) && tpls[str(c?.base)]) tpls[c.id] = { ...tpls[c.base], id: c.id };
  }
  const slots = state.slots && typeof state.slots === "object" ? state.slots : {};
  const sections: LiveSection[] = [];
  const used = new Set<string>();
  for (const inst of list) {
    const tpl = tpls[str(inst?.t)], uid = str(inst?.uid);
    if (!tpl || !ID.test(uid)) continue;
    used.add(tpl.id);
    const P = (key: string) => slots[`${uid}.${key}`]?.placed;
    const className = `sec t-${tpl.id} ${SECTION_CLASS[tpl.type]}`;
    if (tpl.type === "mail") sections.push({ kind: "mail", id: uid, className, headline: str(P("headline")), intro: str(P("intro")) });
    else if (tpl.type === "calendly") sections.push({ kind: "calendly", id: uid, className });
    else {
      // A section with nothing placed in it is left off the live page.
      const html = drawSection(tpl.type, P, state.flip?.[uid] === true);
      if (/<(img|h1|h2|h3|p|li|blockquote|cite|article)\b/.test(html)) sections.push({ kind: "html", id: uid, className, html });
    }
  }
  const design = state.design && typeof state.design === "object" ? state.design : {};
  const css = [...used].filter((id) => design[id]).map((id) => designCss(id, tpls[id], design[id])).filter(Boolean).join("\n");
  const first = tpls[str(list[0]?.t)];
  return { sections, css, navOverPhoto: !!first && PHOTO_TOP.includes(first.type) };
}

// The builder's pages and their addresses on the live site.
export const BUILDER_PAGES = [
  { id: "home", name: "Home", path: "/" },
  { id: "about", name: "About", path: "/about" },
  { id: "pricing", name: "Pricing", path: "/pricing" },
  { id: "book", name: "Book a call", path: "/book" },
] as const;

// Pages that have something to show in this state (visitors see these once published).
export function livePageIds(state: BuilderState | null | undefined): string[] {
  if (!state) return [];
  return BUILDER_PAGES.filter((p) => (renderLivePage(state, p.id)?.sections.length ?? 0) > 0).map((p) => p.id);
}
