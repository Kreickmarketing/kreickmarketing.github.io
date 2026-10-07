// Live pages made in the Studio builder (/clrcrm/studio/builder).
//
// The builder saves one JSON "state" per site: pages (lists of template copies),
// spots ({ value, placed }), photo sides (flip) and the page list (names and
// addresses). Template designs live in code (and Claude Design), not in the state. Visitors see
// what was *placed* when Andrew pressed Publish. This file turns that state into
// HTML and CSS for the live site. It mirrors the builder's own drawing code
// (docs/prototypes/studio-builder/studio-builder.html: SECTION_HTML),
// minus the editing marks, so keep the two in step when a template changes.
//
// Safety: the state is only ever written by logged-in CRM members, but it is
// still treated as untrusted here. Every text is escaped, images must be local
// files, links must be https, mailto or on-site, and page addresses must be
// simple lower-case slugs that don't clash with the site's own routes.

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
  { id: "mailing", type: "mail", slots: [s("label", "text"), s("headline", "text"), s("intro", "text"), s("name", "text"), s("email", "text"), s("button", "text"), s("thanks", "text")] },
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
  crop?: Record<string, { x?: unknown; y?: unknown; z?: unknown }>;  // image focus points (% from top-left) and zoom (1–3×)
  pageList?: { id: string; name?: string; path?: string; unpublished?: boolean }[];
};

// One section of a live page. Most are finished HTML; the mailing list and
// Calendly need real React parts (the sign-up form), so they carry their text instead.
export type LiveSection =
  | { kind: "html"; id: string; className: string; html: string }
  | { kind: "mail"; id: string; className: string; label: string; headline: string; intro: string; nameLabel: string; emailLabel: string; button: string; thanks: string }
  | { kind: "calendly"; id: string; className: string };

export type LivePage = { sections: LiveSection[]; navOverPhoto: boolean };

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
function drawSection(type: string, P: (key: string) => unknown, flip: boolean, crop: (key: string) => string = () => "", link: (v: unknown) => unknown = (v) => v): string {
  const text = (key: string, tag: string, cls = "") => { const v = str(P(key)); return v ? `<${tag}${cls ? ` class="${cls}"` : ""} data-slot=".${key}">${esc(v)}</${tag}>` : ""; };
  const lines = (key: string, tag: string) => { const v = rows(P(key)).map((r) => str(r.line)).filter(Boolean); return v.length ? `<${tag} data-slot=".${key}">${v.map((l) => `<span>${esc(l)}</span>`).join("")}</${tag}>` : ""; };
  const bg = (key: string) => { const src = safeImage(P(key)); return `<div class="hero-bg">${src ? `<img data-slot=".${key}" src="${esc(src)}"${crop(key)} alt="">` : ""}</div>`; };
  const photo = (key: string) => { const src = safeImage(P(key)); return src ? `<div class="crop-clip"><img class="photo" data-slot=".${key}" src="${esc(src)}"${crop(key)} alt=""></div>` : "<div></div>"; };
  const points = (key: string) => { const v = rows(P(key)).filter(hasText); return v.length ? `<div class="points" data-slot=".${key}">${v.map((r) => `<div class="point"><b>${esc(str(r.title))}</b><p>${esc(str(r.proof))}</p></div>`).join("")}</div>` : ""; };
  const logos = (key: string, cls: string) => { const v = (Array.isArray(P(key)) ? (P(key) as unknown[]) : []).map(safeImage).filter(Boolean); return v.length ? `<div class="${cls}" data-slot=".${key}">${v.map((src) => `<img src="${esc(src)}" alt="">`).join("")}</div>` : ""; };

  switch (type) {
    case "hero": {
      const btn = str(P("button")), href = safeHref(link(P("link")));
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

// Crop focus point and zoom → a style attribute. Only numbers in range get through
// (x, y: 0–100; zoom: 1–3).
function cropStyle(c: unknown): string {
  const o = c && typeof c === "object" ? (c as { x?: unknown; y?: unknown; z?: unknown }) : null;
  const ok = (n: unknown, lo: number, hi: number) => typeof n === "number" && Number.isFinite(n) && n >= lo && n <= hi;
  if (!o || !ok(o.x, 0, 100) || !ok(o.y, 0, 100)) return "";
  const x = Math.round(o.x as number), y = Math.round(o.y as number), z = ok(o.z, 1, 3) ? Math.round((o.z as number) * 100) / 100 : 1;
  return ` style="object-position:${x}% ${y}%${z > 1 ? `;transform:scale(${z});transform-origin:${x}% ${y}%` : ""}"`;
}

// ── A whole live page ──
export function renderLivePage(state: BuilderState, pageId: string): LivePage | null {
  const list = Array.isArray(state?.pages?.[pageId]) ? state.pages![pageId] : null;
  if (!list?.length) return null;
  const tpls: Record<string, Template> = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));
  const slots = state.slots && typeof state.slots === "object" ? state.slots : {};
  // Buttons that link to a Studio page are saved as "page:<id>" (optionally "#<section>"),
  // so they follow the page's current address. A missing or unpublished page means no link.
  const pages = pagesOf(state);
  const link = (v: unknown) => {
    const s = str(v);
    if (!s.startsWith("page:")) return s;
    const [pid, sec] = s.slice(5).split("#");
    const p = pages.find((x) => x.id === pid && !x.unpublished);
    return p ? p.path + (sec && ID.test(sec) ? "#" + sec : "") : "";
  };
  const sections: LiveSection[] = [];
  for (const inst of list) {
    const tpl = tpls[str(inst?.t)], uid = str(inst?.uid);
    if (!tpl || !ID.test(uid)) continue;
    const P = (key: string) => slots[`${uid}.${key}`]?.placed;
    const className = `sec t-${tpl.id} ${SECTION_CLASS[tpl.type]}`;
    // Mailing list: wording left empty in Studio falls back to the starting words.
    if (tpl.type === "mail") sections.push({ kind: "mail", id: uid, className, label: str(P("label")) || "Mailing list", headline: str(P("headline")), intro: str(P("intro")),
      nameLabel: str(P("name")) || "Name", emailLabel: str(P("email")) || "Email", button: str(P("button")) || "Sign up", thanks: str(P("thanks")) });
    else if (tpl.type === "calendly") sections.push({ kind: "calendly", id: uid, className });
    else {
      // A section with nothing placed in it is left off the live page.
      const html = drawSection(tpl.type, P, state.flip?.[uid] === true, (key) => cropStyle(state.crop?.[`${uid}.${key}`]), link);
      if (/<(img|h1|h2|h3|p|li|blockquote|cite|article)\b/.test(html)) sections.push({ kind: "html", id: uid, className, html });
    }
  }
  const first = tpls[str(list[0]?.t)];
  return { sections, navOverPhoto: !!first && PHOTO_TOP.includes(first.type) };
}

// The builder's starting pages. Andrew can rename them, change their addresses
// and add more in Studio; the list is saved as `pageList` in the state.
export const BUILDER_PAGES = [
  { id: "home", name: "Home", path: "/" },
  { id: "about", name: "About", path: "/about" },
  { id: "pricing", name: "Pricing", path: "/pricing" },
  { id: "book", name: "Book a call", path: "/book" },
] as const;
// `unpublished`: Andrew took the page off the site (it stays in Studio as work in progress).
export type BuilderPageInfo = { id: string; name: string; path: string; unpublished: boolean };

// Addresses Studio pages can't take: the site's own routes.
export const RESERVED_SLUGS = new Set(["clrcrm", "design-system", "privacy", "terms", "api", "studio-media", "tags", "_next", "login", "admin"]);
export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// The page list in a state, checked: Home is always "/", every other page has a
// unique, safe one-word address. Bad or missing entries fall back to the start list.
export function pagesOf(state: BuilderState | null | undefined): BuilderPageInfo[] {
  const list = Array.isArray(state?.pageList) ? state!.pageList : null;
  if (!list) return BUILDER_PAGES.map((p) => ({ ...p, unpublished: false }));
  const out: BuilderPageInfo[] = [], seen = new Set<string>();
  for (const p of list) {
    const id = str(p?.id);
    if (!ID.test(id) || out.some((x) => x.id === id)) continue;
    const name = str(p?.name).slice(0, 60) || id;
    const unpublished = p?.unpublished === true;
    if (id === "home") { out.push({ id, name, path: "/", unpublished }); continue; }
    const slug = str(p?.path).replace(/^\//, "");
    if (!SLUG.test(slug) || slug.length > 60 || RESERVED_SLUGS.has(slug) || seen.has(slug)) continue;
    seen.add(slug);
    out.push({ id, name, path: "/" + slug, unpublished });
  }
  return out;
}

// Pages visitors can see in this state: not unpublished, and something placed on them.
export function livePageIds(state: BuilderState | null | undefined): string[] {
  if (!state) return [];
  return pagesOf(state).filter((p) => !p.unpublished && (renderLivePage(state, p.id)?.sections.length ?? 0) > 0).map((p) => p.id);
}

// The same state with one page marked unpublished (or back on). Used on both the draft and
// the published copy, so Unpublish takes the page off the site at once without publishing
// anything else.
export function withUnpublished(state: BuilderState | null | undefined, pageId: string, unpublished: boolean): BuilderState {
  const base: BuilderState = state && typeof state === "object" ? { ...state } : {};
  const list = Array.isArray(base.pageList) ? base.pageList : BUILDER_PAGES.map((p) => ({ ...p }));
  base.pageList = list.map((p) => (p?.id === pageId ? { ...p, unpublished } : p));
  return base;
}
