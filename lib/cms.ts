import type { SupabaseClient } from "@supabase/supabase-js";

// The Studio CMS: collections (Products, Portfolio) of items, each filled from the content
// fields in docs/design-system/cards.md (CT100–CT300, CS, CL, CB/CBL, CP, CPT, CPS, CPD,
// CPDT), with media (CI-01 …) and tags kept in their own tables.
// status: "draft" = only in Studio; "published" = "Ready", shown on the live site.
// Visitors (anon key) only ever get published items: Supabase's row rules filter the rest.

export type CmsMedia = { code: string; url: string; alt: string };
export type CmsItem = {
  id: string; collection: string; slug: string; status: "draft" | "published"; sort: number;
  ct100: string; ct200: string; ct300: string; cs: string; cl: string; cb: string; cbl: string;
  cp: string; cpt: string; cps: string; cpd: string; cpdt: string[];
  media: CmsMedia[]; tags: string[];
};

const s = (v: unknown) => (typeof v === "string" ? v : "");

type Row = Record<string, unknown> & {
  collections?: { slug?: string } | null;
  media?: { code?: string; url?: string | null; storage_path?: string | null; alt?: string | null; sort_order?: number }[];
  item_tags?: { sort_order?: number; tags?: { name?: string } | null }[];
};

// Every item of a site (with its media and tags), in each collection's order.
export async function loadCms(supabase: SupabaseClient, siteId: string): Promise<CmsItem[]> {
  const { data, error } = await supabase
    .from("items")
    .select("id, slug, status, sort_order, ct100, ct200, ct300, cs, cl, cb, cbl, cp, cpt, cps, cpd, cpdt, collections!inner(slug, site_id), media(code, url, storage_path, alt, sort_order), item_tags(sort_order, tags(name))")
    .eq("collections.site_id", siteId)
    .order("sort_order");
  if (error || !data) return [];
  return (data as Row[]).map((r) => ({
    id: s(r.id), collection: s(r.collections?.slug), slug: s(r.slug), status: r.status === "published" ? "published" : "draft",
    sort: typeof r.sort_order === "number" ? r.sort_order : 0,
    ct100: s(r.ct100), ct200: s(r.ct200), ct300: s(r.ct300), cs: s(r.cs), cl: s(r.cl), cb: s(r.cb), cbl: s(r.cbl),
    cp: s(r.cp), cpt: s(r.cpt), cps: s(r.cps), cpd: s(r.cpd), cpdt: Array.isArray(r.cpdt) ? (r.cpdt as unknown[]).map(s).filter(Boolean) : [],
    media: (r.media || []).filter((m) => m.url).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || s(a.code).localeCompare(s(b.code)))
      .map((m) => ({ code: s(m.code), url: s(m.url), alt: s(m.alt) })),
    tags: (r.item_tags || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((t) => s(t.tags?.name)).filter(Boolean),
  }));
}

// Offer cards used to be typed into the code with these ids; old drafts may still hold them.
export const LEGACY_OFFER_IDS: Record<string, string> = {
  agency: "agency-systems", content: "content-system", publishing: "publishing-system", leadgen: "working-interview",
};

// ── Checking an item before it's saved ──
export const LIMITS = { title: 300, text: 2000, csWords: 144, clWords: 1500, cl: 15000, tags: 20, tag: 100, lines: 10, line: 200, alt: 200, media: 30 };
const words = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);
export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const okHref = (h: string) => !h || /^https:\/\/[^\s"'<>]+$/i.test(h) || /^mailto:[^\s"'<>]+$/i.test(h) || (/^\/[a-z0-9._/#?=&-]*$/i.test(h) && !h.startsWith("//"));

// media: the item's whole media list (images CI-01 …, videos CV-01 …), replacing what's saved.
// image: the older way (main image only), still accepted.
export type ItemInput = Partial<Omit<CmsItem, "media" | "sort">> & { image?: { url?: string; alt?: string } | null; media?: { code?: string; url?: string; alt?: string }[] | null };
export const MEDIA_CODE = /^C[IV]-\d{2}$/;

// Returns the clean item, or a message saying what to fix.
export function checkItem(x: ItemInput, imageOk: (url: string) => boolean, videoOk: (url: string) => boolean = () => false): { item?: Required<Omit<ItemInput, "id" | "image" | "media">> & { id?: string; image: { url: string; alt: string } | null; media: CmsMedia[] | null }; error?: string } {
  const t = (v: unknown, max: number) => s(v).trim().slice(0, max + 1);
  const item = {
    id: s(x.id) || undefined, collection: s(x.collection), slug: s(x.slug).trim(), status: x.status === "published" ? "published" as const : "draft" as const,
    ct100: t(x.ct100, LIMITS.title), ct200: t(x.ct200, LIMITS.title), ct300: t(x.ct300, LIMITS.title),
    cs: t(x.cs, LIMITS.text), cl: t(x.cl, LIMITS.cl), cb: t(x.cb, LIMITS.title), cbl: t(x.cbl, LIMITS.text),
    cp: t(x.cp, LIMITS.title), cpt: t(x.cpt, LIMITS.title), cps: t(x.cps, LIMITS.title), cpd: t(x.cpd, LIMITS.text),
    cpdt: (Array.isArray(x.cpdt) ? x.cpdt : []).map((l) => s(l).trim()).filter(Boolean),
    tags: [...new Set((Array.isArray(x.tags) ? x.tags : []).map((l) => s(l).trim()).filter(Boolean))],
    image: x.image && s(x.image.url) ? { url: s(x.image.url), alt: s(x.image.alt).trim() } : null,
    media: Array.isArray(x.media) ? x.media.map((m) => ({ code: s(m?.code), url: s(m?.url), alt: s(m?.alt).trim() })).filter((m) => m.url) : null,
  };
  if (!["products", "portfolio"].includes(item.collection)) return { error: "Unknown database" };
  if (!item.ct100) return { error: "Give it a title (CT100)." };
  if (!SLUG_RE.test(item.slug) || item.slug.length > 80) return { error: "The slug can only use lower-case letters, numbers and single dashes." };
  for (const [k, v] of [["CT100", item.ct100], ["CT200", item.ct200], ["CT300", item.ct300], ["CB", item.cb], ["CP", item.cp], ["CPT", item.cpt], ["CPS", item.cps]] as const)
    if (v.length > LIMITS.title) return { error: `${k} is too long (${LIMITS.title} characters at most).` };
  if (item.cs.length > LIMITS.text || words(item.cs) > LIMITS.csWords) return { error: `Content Short (CS) is up to ${LIMITS.csWords} words.` };
  if (item.cl.length > LIMITS.cl || words(item.cl) > LIMITS.clWords) return { error: `Content Long (CL) is up to ${LIMITS.clWords} words.` };
  if (item.cpd.length > LIMITS.text) return { error: "The price description (CPD) is too long." };
  if (!okHref(item.cbl)) return { error: "The button link (CBL) must start with https://, mailto: or / (a page on this site)." };
  if (item.cpdt.length > LIMITS.lines || item.cpdt.some((l) => l.length > LIMITS.line)) return { error: `Price dates (CPDT): up to ${LIMITS.lines} short lines.` };
  if (item.tags.length > LIMITS.tags || item.tags.some((l) => l.length > LIMITS.tag)) return { error: `Up to ${LIMITS.tags} tags, each up to ${LIMITS.tag} characters.` };
  if (item.image && (!imageOk(item.image.url) || item.image.alt.length > LIMITS.alt)) return { error: "That image can't be used (it must be one of the site's images or an upload)." };
  if (item.media) {
    if (item.media.length > LIMITS.media) return { error: `Up to ${LIMITS.media} images and videos per item.` };
    const codes = new Set<string>();
    for (const m of item.media) {
      if (!MEDIA_CODE.test(m.code) || codes.has(m.code)) return { error: "A media number (CI-01 …, CV-01 …) is missing or used twice." };
      codes.add(m.code);
      if (m.alt.length > LIMITS.alt) return { error: "A media description is too long." };
      const ok = m.code.startsWith("CV") ? videoOk(m.url) : imageOk(m.url);
      if (!ok) return { error: `${m.code} can't be used (it must be one of the site's ${m.code.startsWith("CV") ? "videos" : "images"} or an upload).` };
    }
  }
  return { item };
}

export const tagSlug = (name: string) => name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
