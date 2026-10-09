import { LEGACY_OFFER_IDS, type CmsItem } from "./cms";
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

type Slot = { key: string; kind: "text" | "link" | "image" | "logos" | "list" | "offers" | "embed" };
type Template = { id: string; type: string; slots: Slot[] };

const s = (key: string, kind: Slot["kind"]): Slot => ({ key, kind });
const TEMPLATES: Template[] = [
  { id: "hero", type: "hero", slots: [s("image", "image"), s("headline", "text"), s("button", "text"), s("link", "link"), s("quote", "list"), s("stat", "list"), s("graphTitle", "text"), s("graphUnit", "text"), s("bars", "list"), s("rings", "list")] },
  { id: "heading", type: "header", slots: [s("tagline", "text"), s("headline", "list"), s("body", "text")] },
  { id: "logos", type: "cred", slots: [s("label", "text"), s("logos", "logos")] },
  { id: "photo-points", type: "photopoints", slots: [s("photo", "image"), s("points", "list"), s("graphTitle", "text"), s("graphUnit", "text"), s("line", "list"), s("bars", "list"), s("rings", "list")] },
  { id: "photo-text", type: "story", slots: [s("photo", "image"), s("body", "text"), s("graphTitle", "text"), s("graphUnit", "text"), s("line", "list"), s("bars", "list"), s("rings", "list")] },
  { id: "photo-tags", type: "plat", slots: [s("image", "image"), s("label", "text"), s("headline", "list"), s("tags", "list"), s("logos", "logos")] },
  { id: "offers", type: "offersonly", slots: [s("cards", "offers")] },
  // Design-system offer cards (canvas: Offer Card Full / Two / Three). Sizes per screen: builder-site.css.
  { id: "system", type: "system", slots: [s("image", "image"), s("label", "text"), s("headline", "text"), s("answer", "text"), s("cards", "list")] },
  { id: "engine", type: "engine", slots: [s("image", "image"), s("nodes", "list"), s("headline", "text"), s("body", "text")] },
  { id: "offer-full", type: "ocards", slots: [s("cards", "offers")] },
  { id: "offer-two", type: "ocards", slots: [s("cards", "offers")] },
  { id: "offer-three", type: "ocards", slots: [s("cards", "offers")] },
  { id: "points", type: "points", slots: [s("points", "list")] },
  { id: "quote", type: "quote", slots: [s("text", "text"), s("by", "text")] },
  { id: "mailing", type: "mail", slots: [s("label", "text"), s("headline", "text"), s("intro", "text"), s("name", "text"), s("email", "text"), s("button", "text"), s("thanks", "text")] },
  { id: "page-hero", type: "pagehero", slots: [s("image", "image"), s("headline", "text")] },
  { id: "video", type: "video", slots: [s("headline", "text"), s("video", "embed")] },
  { id: "calendly", type: "calendly", slots: [] },
];

// Offer cards come from the Studio CMS (Products): title CT100, subtitle CT200, price CP,
// price note = first CPDT line, photo CI-01, small "+" label = first tag. Cards are found by
// item id, by slug, or by the ids used before the CMS (LEGACY_OFFER_IDS).
type OfferCard = { title: string; sub: string; price: string; note: string; image: string | null; tag: string };
function offerCards(cms: CmsItem[]): (ref: unknown) => OfferCard | null {
  const products = cms.filter((i) => i.collection === "products");
  return (ref) => {
    const r = str(ref), slug = LEGACY_OFFER_IDS[r] || r;
    const i = products.find((x) => x.id === r || x.slug === slug);
    if (!i) return null;
    return { title: i.ct100, sub: i.ct200, price: i.cp, note: i.cpdt[0] || i.cpd, image: safeImage(i.media.find((m) => m.code === "CI-01")?.url), tag: i.tags[0] || "" };
  };
}

const SECTION_CLASS: Record<string, string> = { hero: "hero", cred: "cred", photopoints: "std", plat: "std plat", quote: "std quote-sec", mail: "mail", pagehero: "hero page-hero", story: "std", points: "std", header: "std", offersonly: "std", ocards: "std ocards", system: "std plat sys", engine: "std plat eng", video: "std", calendly: "std" };
const PHOTO_TOP = ["hero", "pagehero", "plat", "system", "engine"];

export type BuilderState = {
  pages?: Record<string, { uid: string; t: string; name?: string }[]>;
  slots?: Record<string, { placed?: unknown }>;
  flip?: Record<string, boolean>;
  // Image focus points (% from top-left) and zoom (1–3×): Desktop, plus optional tablet/phone crops.
  crop?: Record<string, { x?: unknown; y?: unknown; z?: unknown; tablet?: unknown; phone?: unknown }>;
  pageList?: { id: string; name?: string; path?: string; unpublished?: boolean }[];
  // Link names (#anchors) set in Studio, keyed by section id ("<uid>") or element ("<uid>.<key>").
  anchors?: Record<string, unknown>;
  // Global nav and Footer words and links: the site default, and pages' own versions.
  chrome?: { nav?: unknown; footer?: unknown };
  chromePage?: Record<string, { nav?: unknown; footer?: unknown } | undefined>;
};

// One section of a live page. Most are finished HTML; the mailing list and
// Calendly need real React parts (the sign-up form), so they carry their text instead.
export type LiveSection =
  // id: the section's address on the page (its link name, or its uid); uid: Studio's own id.
  | { kind: "html"; id: string; uid: string; className: string; html: string }
  | { kind: "mail"; id: string; uid: string; className: string; label: string; headline: string; intro: string; nameLabel: string; emailLabel: string; button: string; thanks: string }
  | { kind: "calendly"; id: string; uid: string; className: string };

// css: Tablet/Phone crops (rules for the page's 1000px and 700px breakpoints).
// Nav and footer content set in Studio, checked (null = not set in Studio: the site's built-in wording).
export type LiveLink = { label: string; href: string };
export type LiveNav = { links: LiveLink[]; cta: LiveLink | null };
export type LiveFooter = { tagline: string; meeting: LiveLink | null; address: string; copyright: string; privacy: LiveLink | null; terms: LiveLink | null };
export type LivePage = { sections: LiveSection[]; css: string; navOverPhoto: boolean; nav: LiveNav | null; footer: LiveFooter | null };

// ── Safe values ──
const esc = (t: unknown) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const ID = /^[a-z0-9-]{1,60}$/;

// Files Studio uploads live in the public Supabase Storage bucket "studio-media".
const UPLOADS = `${(process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "")}/storage/v1/object/public/studio-media/`;
function localOrUpload(v: unknown, ext: string): string | null {
  let src = str(v);
  if (src.startsWith("media/")) src = "/studio-media/" + src.slice(6);
  if (src.includes("..")) return null;
  if (new RegExp(`^\\/[a-z0-9._/-]+\\.(${ext})$`, "i").test(src)) return src;
  if (UPLOADS.startsWith("https://") && src.startsWith(UPLOADS) && new RegExp(`^[A-Za-z0-9._/-]+\\.(${ext})$`, "i").test(src.slice(UPLOADS.length))) return src;
  return null;
}
export function safeImage(v: unknown): string | null { return localOrUpload(v, "jpe?g|png|webp|gif|svg|avif"); }
export function safeVideo(v: unknown): string | null { return localOrUpload(v, "mp4|webm"); }
// A photo spot holds an image, or a short video that plays silently on a loop.
function mediaTag(v: unknown, attrs: string): string {
  const video = safeVideo(v);
  if (video) return `<video ${attrs} src="${esc(video)}" muted autoplay loop playsinline preload="metadata" aria-hidden="true"></video>`;
  const img = safeImage(v);
  return img ? `<img ${attrs} src="${esc(img)}" alt="">` : "";
}
// YouTube / Vimeo links (ids checked strictly) or an uploaded video, for the Video module.
function embedHtml(v: unknown): string {
  const u = str(v);
  let m = u.match(/^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  const frame = (src: string, title: string) => `<iframe src="${esc(src)}" title="${title}" loading="lazy" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  if (m) return frame(`https://www.youtube-nocookie.com/embed/${m[1]}?rel=0&playsinline=1`, "YouTube video");
  m = u.match(/^https:\/\/(?:www\.|player\.)?vimeo\.com\/(?:video\/)?(\d{6,12})(?:\/([0-9a-f]{6,20}))?/);
  if (m) return frame(`https://player.vimeo.com/video/${m[1]}?${m[2] ? `h=${m[2]}&` : ""}dnt=1&title=0&byline=0&portrait=0`, "Vimeo video");
  const file = safeVideo(u);
  return file ? `<video src="${esc(file)}" controls playsinline preload="metadata"></video>` : "";
}
export function safeHref(v: unknown): string | null {
  const href = str(v);
  if (/^https:\/\/[^\s"'<>]+$/i.test(href) || /^mailto:[^\s"'<>]+$/i.test(href)) return href;
  if (/^\/[a-z0-9._/#?=&-]*$/i.test(href) && !href.startsWith("//")) return href;
  return null;
}
const rows = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? v.filter((r) => r && typeof r === "object") : []);
const hasText = (r: Record<string, unknown>) => Object.values(r).some((x) => str(x));

// Hero stat chart: two numbers drawn as two rising lines (same drawing as Studio).
// A one-character symbol such as $ goes before the number; %, x and words go after.
// The numbers count up in the browser (components/CountUp.tsx); without it they simply show.
const statNum = (v: unknown) => parseFloat(str(v).replace(/[^0-9.-]/g, "")) || 0;
function withUnit(num: string, unit: string): string {
  const u = unit.trim();
  if (!u) return num;
  if (u.length === 1 && !/[\p{L}%]/u.test(u)) return esc(u) + num;
  return num + (/^\p{L}{2}/u.test(u) ? " " : "") + esc(u);
}
const statValue = (n: string, unit: string, delay: number) => withUnit(`<span data-count="${esc(n)}" data-delay="${delay}">${esc(n)}</span>`, unit);
// Graph colours: only brand colours (red = Rogue Cherry, blue = Tidal Azure, yellow = Solar Flare, green = Emerald Tide, white).
const gcClass = (v: unknown) => ({ red: " gc-red", blue: " gc-blue", yellow: " gc-yellow", green: " gc-green", white: " gc-white" } as Record<string, string>)[str(v).toLowerCase()] || "";
function growPath(end: number, max: number, seed: number): string {
  const W = 312, H = 120, pts: [number, number][] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10, v = end * (0.04 + 0.96 * (0.25 * t + 0.75 * t * t)) + end * 0.07 * Math.sin(i * 2.1 + seed) * t * (1 - t);
    pts.push([W * t, H - 2 - (Math.max(0, v) / max) * (H - 12)]);
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || pts[i + 1];
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
function lineGraph(d: Record<string, unknown>, unit: string, delay: number): string {
  const a = statNum(d.from), b = statNum(d.to), max = Math.max(a, b, 1) * 1.1, da = growPath(a, max, 1), db = growPath(b, max, 4);
  return `<svg class="hstat-chart" viewBox="0 0 312 120" aria-hidden="true"><path class="hstat-grid" d="M0 0.5H312M0 40.5H312M0 80.5H312M0 119.5H312"/><path class="hstat-area${gcClass(d.toColor)}" d="${db} L312 120 L0 120Z"/><path class="hstat-a${gcClass(d.fromColor)}" pathLength="1" d="${da}"/><path class="hstat-b${gcClass(d.toColor)}" pathLength="1" d="${db}"/></svg>`
    + `<div class="hstat-keys"><p class="hstat-key a${gcClass(d.fromColor)}"><b>${statValue(str(d.from), unit, delay)}</b><span>${esc(str(d.fromLabel))}</span></p><p class="hstat-key b${gcClass(d.toColor)}"><b>${statValue(str(d.to), unit, delay + 150)}</b><span>${esc(str(d.toLabel))}</span></p></div>`;
}
// Bars on a tidy scale (0 to five even steps), labels under the bars, the scale on the right.
function barsGraph(rows: Record<string, unknown>[], unit: string, delay: number): string {
  const vals = rows.map((r) => Math.max(0, statNum(r.value))), want = Math.max(...vals, 1) / 5, p = Math.pow(10, Math.floor(Math.log10(want)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * p).find((m) => m >= want - 1e-9) ?? 10 * p, top = step * 5, slot = 236 / rows.length, bw = Math.min(28, slot * 0.55);
  const grid = [0, 1, 2, 3, 4, 5].map((n) => { const y = 124 - n * 23.2; return `<path class="hstat-grid" d="M0 ${y.toFixed(1)}H236"/><text x="280" y="${(y + 3.5).toFixed(1)}" text-anchor="end">${withUnit(String(+(step * n).toFixed(2)), unit)}</text>`; }).join("");
  const bars = rows.map((r, n) => { const h = (vals[n] / top) * 116, x = slot * n + (slot - bw) / 2; return `<rect class="gfx-bar${gcClass(r.color)}" x="${x.toFixed(1)}" y="${(124 - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="4" style="animation-delay:${delay + n * 90}ms"/><text x="${(x + bw / 2).toFixed(1)}" y="143" text-anchor="middle">${esc(str(r.label))}</text>`; }).join("");
  return `<svg class="gfx-plot" viewBox="0 0 280 150" role="img" aria-label="${esc(rows.map((r) => `${str(r.label)} ${str(r.value)}${unit}`).join(", "))}">${grid}${bars}</svg>`;
}
// Rings fill from zero to the number: out of 100 for % (or no measure), otherwise out of the larger number.
function ringsGraph(rows: Record<string, unknown>[], unit: string, delay: number): string {
  const u = unit.trim() || "%", vals = rows.map((r) => Math.max(0, statNum(r.value))), max = u === "%" ? 100 : Math.max(...vals, 1);
  return `<div class="gfx-rings">${rows.map((r, n) => { const pct = Math.min(100, (vals[n] / max) * 100);
    return `<div class="gfx-ring${gcClass(r.color)}"><div class="gfx-dial"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="gfx-track" cx="50" cy="50" r="42"/><circle class="gfx-arc" cx="50" cy="50" r="42" pathLength="100" style="stroke-dasharray:${pct.toFixed(1)} 100;animation-delay:${delay + n * 150}ms"/></svg><b>${statValue(str(r.value), u, delay + n * 150)}</b></div><span>${esc(str(r.label))}</span></div>`; }).join("")}</div>`;
}

// The first filled graph (line, then bars, then rings) with its small heading, for Hero and
// Photo + text. Hero saved its title and measure inside the line row before Oct 9 (kicker, unit).
function pickGraph(P: (key: string) => unknown, lineKey: string, delay: number): { key: string; html: string } | null {
  const ln = rows(P(lineKey)).filter(hasText)[0], br = rows(P("bars")).filter(hasText).slice(0, 6), rg = rows(P("rings")).filter(hasText).slice(0, 2);
  const unit = str(P("graphUnit")) || str(ln?.unit), title = str(P("graphTitle")) || str(ln?.kicker);
  const pick = ln && (str(ln.from) || str(ln.to)) ? [lineKey, lineGraph(ln, unit, delay)] : br.length ? ["bars", barsGraph(br, unit, delay)] : rg.length ? ["rings", ringsGraph(rg, unit, delay)] : null;
  return pick && { key: pick[0], html: `${title ? `<small>${esc(title)}</small>` : ""}${pick[1]}` };
}

// ── Drawing each template (live mode: empty spots are simply left out) ──
function drawSection(type: string, P: (key: string) => unknown, flip: boolean, crop: (key: string) => string = () => "", link: (v: unknown) => unknown = (v) => v, offer: (ref: unknown) => OfferCard | null = () => null): string {
  const text = (key: string, tag: string, cls = "") => { const v = str(P(key)); return v ? `<${tag}${cls ? ` class="${cls}"` : ""} data-slot=".${key}">${esc(v)}</${tag}>` : ""; };
  const lines = (key: string, tag: string) => { const v = rows(P(key)).map((r) => str(r.line)).filter(Boolean); return v.length ? `<${tag} data-slot=".${key}">${v.map((l) => `<span>${esc(l)}</span>`).join("")}</${tag}>` : ""; };
  const bg = (key: string) => `<div class="hero-bg">${mediaTag(P(key), `data-slot=".${key}"${crop(key)}`)}</div>`;
  const photo = (key: string) => { const tag = mediaTag(P(key), `class="photo" data-slot=".${key}"${crop(key)}`); return tag ? `<div class="crop-clip">${tag}</div>` : "<div></div>"; };
  const points = (key: string) => { const v = rows(P(key)).filter(hasText); return v.length ? `<div class="points" data-slot=".${key}">${v.map((r) => `<div class="point"><b>${esc(str(r.title))}</b><p>${esc(str(r.proof))}</p></div>`).join("")}</div>` : ""; };
  // Photo + tags: up to 20 logos in two sliding rows (first half moves left, the rest right).
  // Each row repeats until long enough, then twice over (the copy hidden from screen readers) for a seamless loop.
  const mq = (key: string) => {
    const v = (Array.isArray(P(key)) ? (P(key) as unknown[]) : []).map(safeImage).filter(Boolean).slice(0, 20) as string[];
    if (!v.length) return "";
    const half = Math.ceil(v.length / 2), img = (src: string) => `<img src="${esc(src)}" alt="">`;
    const rows = [v.slice(0, half), v.slice(half)].filter((r) => r.length).map((r, n) => {
      const reps = Math.max(1, Math.ceil(8 / r.length)), set = Array.from({ length: reps }, () => r.map(img).join("")).join("");
      return `<div class="mq-row ${n ? "mq-right" : "mq-left"}"><div class="mq-track" style="--mq-time:${r.length * reps * 9}s">${set}<span style="display:contents" aria-hidden="true">${set}</span></div></div>`;
    });
    return `<div class="plat-logos mq" data-slot=".${key}">${rows.join("")}</div>`;
  };
  // Photo + text and Photo + points: the first filled graph (line, then bars, then rings) as a card over the photo.
  const photoWithGraph = () => { const g = pickGraph(P, "line", 600); return g ? `<div class="gfx-wrap">${photo("photo")}<aside class="gfx" data-slot=".${g.key}">${g.html}</aside></div>` : photo("photo"); };
  const logos = (key: string, cls: string, max = 20) => { const v = (Array.isArray(P(key)) ? (P(key) as unknown[]) : []).map(safeImage).filter(Boolean).slice(0, max); return v.length ? `<div class="${cls}" data-slot=".${key}">${v.map((src) => `<img src="${esc(src)}" alt="">`).join("")}</div>` : ""; };

  switch (type) {
    case "hero": {
      const btn = str(P("button")), href = safeHref(link(P("link")));
      const q = rows(P("quote")).filter(hasText)[0], old = rows(P("stat")).filter(hasText)[0], g = pickGraph(P, "stat", 1600);
      // An old one-number stat (before Oct 9) keeps its white card.
      const st = old && !str(old.from) && !str(old.to) && str(old.value) ? `<aside class="stat-card" data-slot=".stat"><small>${esc(str(old.kicker))}</small><b>${esc(str(old.value))}</b></aside>`
        : g ? `<aside class="hstat" data-slot=".${g.key}">${g.html}</aside>` : "";
      return `${bg("image")}<div class="hero-main">${text("headline", "h1")}${btn && href ? `<a class="cta" data-slot=".button" href="${esc(href)}"${href.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : ""}>${esc(btn)} →</a>` : ""}</div>`
        + (q || st ? `<div class="hero-bottom">${q ? `<figure class="glass" data-slot=".quote"><b>${esc(str(q.name))}</b><span>${esc(str(q.quote))}</span></figure>` : "<div></div>"}${st}</div>` : "");
    }
    case "cred": return `${text("label", "p", "tagline")}${logos("logos", "logo-row", 10)}`;
    case "photopoints": return `<div class="split${flip ? " flip" : ""}">${photoWithGraph()}${points("points")}</div>`;
    case "story": {
      const body = str(P("body"));
      return `<div class="split${flip ? " flip" : ""}">${photoWithGraph()}${body ? `<p class="body" data-slot=".body" style="font-size:20px;line-height:1.5;color:var(--iron-pine)">${esc(body)}</p>` : ""}</div>`; }
    case "plat": {
      const tags = rows(P("tags")).map((r) => str(r.tag)).filter(Boolean);
      return `${bg("image")}<div class="sh">${text("label", "p", "tagline")}${lines("headline", "h2")}</div><div class="plat-foot">${tags.length ? `<ul class="tag-pills" data-slot=".tags">${tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}${mq("logos")}</div>`;
    }
    case "quote": { const q = str(P("text")); return `${q ? `<blockquote data-slot=".text">“${esc(q)}”</blockquote>` : ""}${text("by", "cite")}`; }
    case "pagehero": return `${bg("image")}<div class="hero-main">${text("headline", "h1")}</div>`;
    case "points": return points("points");
    case "video": { const v = embedHtml(P("video")); return v ? `${text("headline", "h2", "video-title")}<div class="video-frame" data-slot=".video">${v}</div>` : ""; }
    case "header": { const body = str(P("body")); return `<div class="sh">${text("tagline", "p", "tagline")}<div>${lines("headline", "h2")}${body ? `<p class="body" data-slot=".body">${esc(body)}</p>` : ""}</div></div>`; }
    case "offersonly": {
      const ids = Array.isArray(P("cards")) ? (P("cards") as unknown[]) : [];
      const cards = ids.map(offer).filter((o): o is OfferCard => !!o);
      return cards.length ? `<div class="offer-grid" data-slot=".cards">${cards.map((o) => `<article class="offer">${o.image ? `<img src="${esc(o.image)}" alt="">` : ""}<div><h3>${esc(o.title)}</h3><p>${esc(o.sub)}</p></div><div class="foot"><span style="font-family:var(--font-button);font-size:13px">${o.tag ? `+ ${esc(o.tag)}` : ""}</span><div class="price">${esc(o.price)}<small>${esc(o.note)}</small></div></div></article>`).join("")}</div>` : "";
    }
    case "system": {
      const icons = ["<rect x=\"5\" y=\"4\" width=\"22\" height=\"24\" rx=\"2\"/><path d=\"M5 12h22M5 20h12M15 4v16\"/><path d=\"M20 26l3 3 6-7\"/>", "<rect x=\"3\" y=\"5\" width=\"26\" height=\"18\" rx=\"2\"/><path d=\"M7 15h4l2-4 3 7 2-3h3\"/><path d=\"M24 30s-5-3-5-6a2.5 2.5 0 0 1 5-1 2.5 2.5 0 0 1 5 1c0 3-5 6-5 6z\"/>", "<path d=\"M3 16h10l8-9h7M24 3l4 4-4 4\"/><path d=\"M13 16l8 9h7M24 21l4 4-4 4\"/>", "<path d=\"M5 28v-3M11 28v-6M17 28v-9M23 28v-12M29 28v-15\"/><path d=\"M4 18l8-7 6 4 11-10M24 5h5v5\"/>"];
      const cards = rows(P("cards")).filter(hasText).slice(0, 4);
      return `${bg("image")}<div class="sys-top">${text("label", "p", "tagline")}<div class="sys-statement">${text("headline", "h2", "sys-head")}${text("answer", "p", "sys-answer")}</div></div>${cards.length ? `<div class="sys-cards" data-slot=".cards">${cards.map((r, i) => `<article class="sys-card"><p class="sys-num">${String(i + 1).padStart(2, "0")} —</p><h3>${esc(str(r.title))}</h3><p class="sys-text">${esc(str(r.text))}</p><svg viewBox="0 0 32 32" aria-hidden="true">${icons[i]}</svg></article>`).join("")}</div>` : ""}`;
    }
    case "engine": {
      // Engine (T.O.E.): the icon for each place, the fan + laptop drawing, then the words. Hover moves: builder-site.css.
      const icons = ["<path d=\"M20 8a9 9 0 1 0 2.6 6.4\"/><path d=\"M22 6v5h-5\"/><path d=\"M14 10v5l3 2\"/>", "<rect x=\"5\" y=\"7\" width=\"18\" height=\"14\" rx=\"2\"/><path d=\"M9 12h4M9 16h3\"/><circle cx=\"20\" cy=\"14\" r=\"2\"/><path d=\"M20 16v4l-3 3\"/>", "<path d=\"M5 9V6h3M20 6h3v3M23 19v3h-3M8 22H5v-3\"/><circle cx=\"12\" cy=\"11\" r=\"2\"/><path d=\"M9 19l2-4 3 2\"/><path d=\"M19 14l4 7h-8z\"/><path d=\"M19 17v2\"/>", "<path d=\"M6 22v-2M10 22v-5M14 22v-8M18 22v-6M22 22v-11\"/><path d=\"M5 15l6-6 4 3 8-7M19 5h4v4\"/>", "<circle cx=\"11\" cy=\"10\" r=\"4\"/><path d=\"M4 23c0-4 3-6 7-6s7 2 7 6\"/><path d=\"M21 9v6M18 12h6\"/>"];
      const fan = "<svg class=\"eng-fan\" viewBox=\"0 0 1280 560\" aria-hidden=\"true\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\"><path d=\"M550 480H405A235 235 0 0 1 460 328.9L552.7 406.7\"/><path d=\"M552.7 406.7L448.5 319.3A250 250 0 0 1 575.3 238.5L620.2 406.1\"/><path d=\"M620.2 406.1L572.2 226.9A262 262 0 0 1 707.8 226.9L659.8 406.1\"/><path d=\"M659.8 406.1L705.2 236.6A252 252 0 0 1 833 318L727.3 406.7\"/><path d=\"M727.3 406.7L820 328.9A235 235 0 0 1 875 480H730\"/><path d=\"M405 480H552M728 480H875\"/><rect x=\"552\" y=\"408\" width=\"176\" height=\"108\" rx=\"8\"/><path d=\"M544 516H736L754 544H526Z\"/><path d=\"M624 533h32\" stroke-width=\"3\" stroke-linecap=\"round\"/></g><g fill=\"currentColor\"><path d=\"M596 454a22 22 0 1 0 22 22h-22z\"/><path d=\"M600 450v-18a18 18 0 0 1 18 18z\"/><rect x=\"650\" y=\"484\" width=\"9\" height=\"13\" rx=\"2\"/><rect x=\"664\" y=\"475\" width=\"9\" height=\"22\" rx=\"2\"/><rect x=\"678\" y=\"479\" width=\"9\" height=\"18\" rx=\"2\"/><rect x=\"692\" y=\"461\" width=\"9\" height=\"36\" rx=\"2\"/></g><path d=\"M650 468l13-15 11 9 20-22\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>";
      const nodes = rows(P("nodes")).filter(hasText).slice(0, 5);
      const icon = (i: number) => `<svg viewBox="0 0 28 28" aria-hidden="true">${icons[i]}</svg>`;
      const words = (r: Record<string, unknown>) => `<h3>${esc(str(r.title))}</h3><p>${esc(str(r.text)).replace(/\n/g, "<br>")}</p>`;
      return `${bg("image")}<div class="eng-stage">${fan}${nodes.map((r, i) => `<div class="eng-node eng-n${i + 1}" tabindex="0"><span class="eng-dot">${icon(i)}</span><div class="eng-label">${words(r)}</div></div>`).join("")}</div>`
        + `<div class="eng-copy">${text("headline", "h2", "eng-head")}${text("body", "p", "eng-body")}</div>`
        + (nodes.length ? `<ol class="eng-list" data-slot=".nodes">${nodes.map((r, i) => `<li><span class="eng-dot">${icon(i)}</span><div>${words(r)}</div></li>`).join("")}</ol>` : "");
    }
    case "ocards": {
      const ids = Array.isArray(P("cards")) ? (P("cards") as unknown[]) : [];
      const cards = ids.map(offer).filter((o): o is OfferCard => !!o);
      const plus = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
      return cards.length ? `<div class="oc-grid" data-slot=".cards">${cards.map((o) => `<article class="oc">${o.image ? `<img src="${esc(o.image)}" alt="">` : ""}<div class="oc-top"><h3 class="oc-t">${esc(o.title)}</h3>${o.sub ? `<p class="oc-s">${esc(o.sub)}</p>` : ""}</div><div class="oc-foot">${o.tag ? `<span class="oc-tag">${plus}${esc(o.tag)}</span>` : ""}${o.price ? `<div class="oc-price"><b>${esc(o.price)}</b>${o.note ? `<small>${esc(o.note)}</small>` : ""}</div>` : ""}</div></article>`).join("")}</div>` : "";
    }
    default: return "";
  }
}

// Crop focus point and zoom → a style attribute. Only numbers in range get through
// (x, y: 0–100; zoom: 1–3).
function cropParts(c: unknown): { x: number; y: number; z: number } | null {
  const o = c && typeof c === "object" ? (c as { x?: unknown; y?: unknown; z?: unknown }) : null;
  const ok = (n: unknown, lo: number, hi: number) => typeof n === "number" && Number.isFinite(n) && n >= lo && n <= hi;
  if (!o || !ok(o.x, 0, 100) || !ok(o.y, 0, 100)) return null;
  return { x: Math.round(o.x as number), y: Math.round(o.y as number), z: ok(o.z, 1, 3) ? Math.round((o.z as number) * 100) / 100 : 1 };
}
// Tablet / Phone crops for one section → container rules (same breakpoints as the page).
function cropRules(uid: string, secId: string, crops: BuilderState["crop"]): string {
  const out: string[] = [];
  for (const [id, c] of Object.entries(crops || {})) {
    if (!id.startsWith(uid + ".")) continue;
    const key = id.slice(uid.length + 1);
    if (!ID.test(key) || !c || typeof c !== "object") continue;
    for (const [bp, w] of [["tablet", 1000], ["phone", 700]] as const) {
      const v = cropParts((c as Record<string, unknown>)[bp]);
      if (v) out.push(`@container (max-width: ${w}px) { .site [id="${secId}"] :is(img, video)[data-slot=".${key}"] { object-position: ${v.x}% ${v.y}% !important; transform: ${v.z > 1 ? `scale(${v.z})` : "none"} !important; transform-origin: ${v.x}% ${v.y}% !important; } }`);
    }
  }
  return out.join("\n");
}
function cropStyle(c: unknown): string {
  const o = c && typeof c === "object" ? (c as { x?: unknown; y?: unknown; z?: unknown }) : null;
  const ok = (n: unknown, lo: number, hi: number) => typeof n === "number" && Number.isFinite(n) && n >= lo && n <= hi;
  if (!o || !ok(o.x, 0, 100) || !ok(o.y, 0, 100)) return "";
  const x = Math.round(o.x as number), y = Math.round(o.y as number), z = ok(o.z, 1, 3) ? Math.round((o.z as number) * 100) / 100 : 1;
  return ` style="object-position:${x}% ${y}%${z > 1 ? `;transform:scale(${z});transform-origin:${x}% ${y}%` : ""}"`;
}

// ── A whole live page ──
// Link names on one page: ref ("<uid>" or "<uid>.<key>") → name. Same rules as Studio's
// anchorMap(): a section without a (valid, unused) name keeps its uid; an element needs one.
const ANCHOR = /^[a-z][a-z0-9-]{0,39}$/;
function anchorsOn(state: BuilderState, pageId: string): Record<string, string> {
  const list = Array.isArray(state?.pages?.[pageId]) ? state.pages![pageId] : [];
  const names = state.anchors && typeof state.anchors === "object" ? state.anchors : {};
  const tpls: Record<string, Template> = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));
  const out: Record<string, string> = {}, used = new Set<string>();
  const take = (ref: string, fallback: string) => {
    const a = str(names[ref]), name = a && ANCHOR.test(a) && !used.has(a) ? a : fallback;
    if (name && !used.has(name)) { out[ref] = name; used.add(name); }
  };
  for (const inst of list) {
    const uid = str(inst?.uid), tpl = tpls[str(inst?.t)];
    if (!tpl || !ID.test(uid)) continue;
    take(uid, uid);
    for (const sl of tpl.slots) if (str(names[`${uid}.${sl.key}`])) take(`${uid}.${sl.key}`, "");
  }
  return out;
}

// cms: the site's CMS items visitors may see (published only), for offer cards.
export function renderLivePage(state: BuilderState, pageId: string, cms: CmsItem[] = []): LivePage | null {
  const list = Array.isArray(state?.pages?.[pageId]) ? state.pages![pageId] : null;
  if (!list?.length) return null;
  const tpls: Record<string, Template> = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));
  const slots = state.slots && typeof state.slots === "object" ? state.slots : {};
  // Buttons that link to a Studio page are saved as "page:<id>" (optionally "#<section>"),
  // so they follow the page's current address. A missing or unpublished page means no link.
  const pages = pagesOf(state);
  const offer = offerCards(cms);
  const anchorCache: Record<string, Record<string, string>> = {};
  const anchorsFor = (pid: string) => (anchorCache[pid] ||= anchorsOn(state, pid));
  const link = (v: unknown) => {
    const s = str(v);
    if (!s.startsWith("page:")) return s;
    const [pid, ref] = s.slice(5).split("#");
    const p = pages.find((x) => x.id === pid && !x.unpublished);
    if (!p) return "";
    // ref is a section or element id; the address uses its link name (an element that lost
    // its name falls back to its section).
    const m = ref ? anchorsFor(pid) : {}, a = ref ? m[ref] || m[ref.split(".")[0]] || "" : "";
    return p.path + (a ? "#" + a : "");
  };
  const here = anchorsFor(pageId);
  const sections: LiveSection[] = [];
  for (const inst of list) {
    const tpl = tpls[str(inst?.t)], uid = str(inst?.uid);
    if (!tpl || !ID.test(uid)) continue;
    const P = (key: string) => slots[`${uid}.${key}`]?.placed;
    const className = `sec t-${tpl.id} ${SECTION_CLASS[tpl.type]}`, id = here[uid] || uid;
    // Mailing list: wording left empty in Studio falls back to the starting words.
    if (tpl.type === "mail") sections.push({ kind: "mail", id, uid, className, label: str(P("label")) || "Mailing list", headline: str(P("headline")), intro: str(P("intro")),
      nameLabel: str(P("name")) || "Name", emailLabel: str(P("email")) || "Email", button: str(P("button")) || "Sign up", thanks: str(P("thanks")) });
    else if (tpl.type === "calendly") sections.push({ kind: "calendly", id, uid, className });
    else {
      // A section with nothing placed in it is left off the live page.
      let html = drawSection(tpl.type, P, state.flip?.[uid] === true, (key) => cropStyle(state.crop?.[`${uid}.${key}`]), link, offer);
      // Named elements get their link name as an id (the first element drawn for that spot).
      for (const sl of tpl.slots) { const a = here[`${uid}.${sl.key}`]; if (a) html = html.replace(`data-slot=".${sl.key}"`, `id="${a}" data-slot=".${sl.key}"`); }
      if (/<(img|video|iframe|h1|h2|h3|p|li|blockquote|cite|article)\b/.test(html)) sections.push({ kind: "html", id, uid, className, html });
    }
  }
  const first = tpls[str(list[0]?.t)];
  const css = sections.map((x) => cropRules(x.uid, x.id, state.crop)).filter(Boolean).join("\n");
  // Nav and footer: this page's own version if it has one, otherwise the site default.
  const obj = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : null);
  const own = obj(state.chromePage?.[pageId]);
  const navSrc = obj(own?.nav) || obj(state.chrome?.nav), footSrc = obj(own?.footer) || obj(state.chrome?.footer);
  const cut = (v: unknown, n: number) => str(v).trim().slice(0, n);
  const pair = (label: unknown, to: unknown): LiveLink | null => { const l = cut(label, 30), h = safeHref(link(to)); return l && h ? { label: l, href: h } : null; };
  const nav: LiveNav | null = navSrc ? {
    links: rows(navSrc.links).slice(0, 7).map((r) => pair(r.label, r.link)).filter((x): x is LiveLink => !!x),
    cta: pair(obj(navSrc.cta)?.label, obj(navSrc.cta)?.link),
  } : null;
  const footer: LiveFooter | null = footSrc ? {
    tagline: cut(footSrc.tagline, 140), meeting: pair(footSrc.meetLabel, footSrc.meetLink), address: cut(footSrc.address, 140),
    copyright: cut(footSrc.copyright, 140), privacy: pair(footSrc.privacyLabel, footSrc.privacyLink), terms: pair(footSrc.termsLabel, footSrc.termsLink),
  } : null;
  return { sections, css, navOverPhoto: !!first && PHOTO_TOP.includes(first.type), nav, footer };
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
export function livePageIds(state: BuilderState | null | undefined, cms: CmsItem[] = []): string[] {
  if (!state) return [];
  return pagesOf(state).filter((p) => !p.unpublished && (renderLivePage(state, p.id, cms)?.sections.length ?? 0) > 0).map((p) => p.id);
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
