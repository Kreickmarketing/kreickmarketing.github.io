// The sites the Studio builder can edit (/apps/studio/builder?site=<slug>). ClearMark is the
// default; Kreick Marketing (Oct 21, 2026) uses the km-* templates (lib/km-sections.ts) and
// can't be published yet (it has no live route until it moves to clearmark.bz).
export const BUILDER_SITES = ["clearmark", "kreick"] as const;
export type BuilderSite = (typeof BUILDER_SITES)[number];
export function builderSite(v: string | null | undefined): BuilderSite {
  return BUILDER_SITES.includes(v as BuilderSite) ? (v as BuilderSite) : "clearmark";
}
export const builderSiteFrom = (request: Request) => builderSite(new URL(request.url).searchParams.get("site"));
