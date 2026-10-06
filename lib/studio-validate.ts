import { CARD_WIDTHS } from "@/components/Card";
import type { PageContent } from "./studio";

// Checks a page's JSON before it is saved, so the live site never gets
// something it can't draw, and links can only be web, email, phone, a page on
// the site (/about) or a spot on the page (#pricing).

const COMPONENT_TYPES = ["hero", "section-header", "credibility", "platforms"];
const ID = /^[a-z0-9-]{1,60}$/;
const SAFE_LINK = /^(https?:\/\/[^\s]+|mailto:[^\s]+|tel:[+\d\s()-]+|\/(?!\/)[^\s]*|#[^\s]*)$/i;
const LINK_KEYS = ["href", "cbl"];
// Images are files in public/ until uploads arrive (step 7).
const IMAGE_KEYS = ["image", "src", "avatar"];
const LOCAL_FILE = /^\/(?!\/)[A-Za-z0-9/_.-]+$/;
const MAX_BYTES = 200_000;

export function validatePageContent(input: unknown): { ok: true; content: PageContent } | { ok: false; error: string } {
  try {
    if (JSON.stringify(input).length > MAX_BYTES) return { ok: false, error: "This page is too big to save." };
    const c = input as PageContent;
    if (!c || !Array.isArray(c.sections) || c.sections.length > 100) return { ok: false, error: "The page has no sections list." };

    const ids = new Set<string>();
    for (const s of c.sections) {
      if (!ID.test(s?.id)) return { ok: false, error: "A section's link name can only use small letters, numbers and dashes." };
      if (ids.has(s.id)) return { ok: false, error: `Two sections are both called "#${s.id}". Give one a different link name.` };
      ids.add(s.id);
      if (s.components) {
        if (!Array.isArray(s.components) || s.components.length > 20) return { ok: false, error: `Section "${s.id}" has a bad component list.` };
        for (const comp of s.components) {
          if (!ID.test(comp?.id) || !COMPONENT_TYPES.includes(comp.type)) return { ok: false, error: `Section "${s.id}" has an unknown component.` };
          if (!comp.props || typeof comp.props !== "object") return { ok: false, error: `"${comp.id}" has no content.` };
          const bad = checkValues(comp.props, 0);
          if (bad) return { ok: false, error: `${comp.id}: ${bad}` };
        }
      } else if (s.cards) {
        const g = s.cards;
        if (!ID.test(g.collection) || !Array.isArray(g.items) || g.items.length > 50 || !g.items.every((i) => ID.test(i))
          || !(g.width === "image-text" || (CARD_WIDTHS as readonly number[]).includes(g.width))) {
          return { ok: false, error: `Section "${s.id}" has a bad card grid.` };
        }
      } else {
        return { ok: false, error: `Section "${(s as { id: string }).id}" is empty.` };
      }
    }
    return { ok: true, content: c };
  } catch {
    return { ok: false, error: "The page could not be read." };
  }
}

// Walks every value: text must be short enough, links must be safe.
function checkValues(v: unknown, depth: number, key = ""): string | null {
  if (depth > 6) return "content is nested too deeply.";
  if (typeof v === "string") {
    if (v.length > 5000) return "a text is too long.";
    if (LINK_KEYS.includes(key) && v !== "" && !SAFE_LINK.test(v.trim())) {
      return `"${v}" isn't a valid link. Use https://…, mailto:…, tel:…, /page or #section.`;
    }
    if (IMAGE_KEYS.includes(key) && !LOCAL_FILE.test(v)) return `"${v}" isn't an image file on the site.`;
    return null;
  }
  if (typeof v === "number" || typeof v === "boolean" || v === null) return null;
  if (Array.isArray(v)) {
    if (v.length > 100) return "a list is too long.";
    for (const x of v) { const bad = checkValues(x, depth + 1, key); if (bad) return bad; }
    return null;
  }
  if (typeof v === "object") {
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) { const bad = checkValues(x, depth + 1, k); if (bad) return bad; }
    return null;
  }
  return "it has a value that can't be saved.";
}
