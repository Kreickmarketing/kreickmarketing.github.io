// The sites the Studio builder can edit (/apps/studio/builder?site=<slug>). ClearMark is the
// default; Kreick Marketing (Oct 21, 2026) uses the km-* templates (lib/km-sections.ts).
// Kreick's live pages are app/kreick-site, shown only on the Kreick addresses below (next.config.ts).
export const BUILDER_SITES = ["clearmark", "kreick"] as const;
export type BuilderSite = (typeof BUILDER_SITES)[number];
export function builderSite(v: string | null | undefined): BuilderSite {
  return BUILDER_SITES.includes(v as BuilderSite) ? (v as BuilderSite) : "clearmark";
}
export const builderSiteFrom = (request: Request) => builderSite(new URL(request.url).searchParams.get("site"));

// Kreick went live on the test address new.kreickmarketing.com (Oct 22, 2026), then moved from Framer to
// www.kreickmarketing.com (Nov 21, 2026). kreickmarketing.com and new. forward to www (Vercel, next.config.ts).
export const KREICK_URL = "https://www.kreickmarketing.com";
export const KREICK_HOSTS = "(?:new\\.|www\\.)?kreickmarketing\\.com";
