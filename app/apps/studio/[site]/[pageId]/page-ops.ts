import type { CardGrid, PageContent, StudioComponent, StudioSection } from "@/lib/studio";

// Every change to a page's layout, as small functions that return a new page
// and never change the old one (so Undo and "unsaved changes" stay simple).

const clamp = (n: number, max: number) => Math.max(0, Math.min(n, max));

function move<T>(list: T[], from: number, to: number): T[] {
  const copy = [...list];
  const [x] = copy.splice(from, 1);
  copy.splice(clamp(to, copy.length), 0, x);
  return copy;
}

// A name for a section or component that the page doesn't use yet:
// "hero", then "hero-2", "hero-3" …
export function freeId(content: PageContent, base: string) {
  const used = new Set(content.sections.flatMap((s) => [s.id, ...(s.components?.map((c) => c.id) ?? [])]));
  const clean = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "section";
  if (!used.has(clean)) return clean;
  let n = 2;
  while (used.has(`${clean}-${n}`)) n++;
  return `${clean}-${n}`;
}

const withSections = (c: PageContent, sections: StudioSection[]): PageContent => ({ ...c, sections });

// ── Sections ──
export const insertSection = (c: PageContent, at: number, s: StudioSection) => {
  const list = [...c.sections];
  list.splice(clamp(at, list.length), 0, s);
  return withSections(c, list);
};
export const moveSection = (c: PageContent, from: number, to: number) => withSections(c, move(c.sections, from, to));
export const removeSection = (c: PageContent, i: number) => withSections(c, c.sections.filter((_, j) => j !== i));
export const renameSection = (c: PageContent, i: number, id: string) =>
  withSections(c, c.sections.map((s, j) => (j === i ? { ...s, id } : s)));

// ── Components inside a section ──
function setComponents(c: PageContent, si: number, components: StudioComponent[]) {
  return withSections(c, c.sections.map((s, j) => (j === si ? { id: s.id, components } : s)));
}
export const moveComponent = (c: PageContent, si: number, ci: number, to: number) =>
  setComponents(c, si, move(c.sections[si].components ?? [], ci, to));

export const removeComponent = (c: PageContent, si: number, ci: number) => {
  const rest = (c.sections[si].components ?? []).filter((_, j) => j !== ci);
  return rest.length ? setComponents(c, si, rest) : removeSection(c, si);
};

// Moves a component to the end (moving down) or start (moving up) of another
// component section. A section left empty is removed.
export function moveComponentToSection(c: PageContent, si: number, ci: number, target: number) {
  const comp = c.sections[si].components?.[ci];
  const dest = c.sections[target];
  if (!comp || !dest?.components) return c;
  let next = setComponents(c, target, target > si ? [comp, ...dest.components] : [...dest.components, comp]);
  next = removeComponent(next, si, ci);
  return next;
}

// The nearest section above (-1) or below (+1) that holds components, if any.
export function neighbourWithComponents(c: PageContent, si: number, dir: -1 | 1) {
  for (let j = si + dir; j >= 0 && j < c.sections.length; j += dir) if (c.sections[j].components) return j;
  return -1;
}

// ── Cards inside a card grid ──
function setGrid(c: PageContent, si: number, change: (g: CardGrid) => CardGrid) {
  return withSections(c, c.sections.map((s, j) => (j === si && s.cards ? { id: s.id, cards: change(s.cards) } : s)));
}
export const moveCard = (c: PageContent, si: number, from: number, to: number) =>
  setGrid(c, si, (g) => ({ ...g, items: move(g.items, from, to) }));
export const removeCard = (c: PageContent, si: number, i: number) =>
  setGrid(c, si, (g) => ({ ...g, items: g.items.filter((_, j) => j !== i) }));
export const addCard = (c: PageContent, si: number, slug: string) =>
  setGrid(c, si, (g) => (g.items.includes(slug) ? g : { ...g, items: [...g.items, slug] }));
export const setCardWidth = (c: PageContent, si: number, width: CardGrid["width"]) =>
  setGrid(c, si, (g) => ({ ...g, width }));
