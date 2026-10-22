// The sites the Studio builder can edit (/apps/studio/builder?site=<slug>). ClearMark is the
// default; Kreick Marketing (Oct 21, 2026) uses the km-* templates (lib/km-sections.ts).
// Kreick's live pages are app/kreick-site, shown only on the Kreick addresses below (next.config.ts).
export const BUILDER_SITES = ["clearmark", "kreick"] as const;
export type BuilderSite = (typeof BUILDER_SITES)[number];
export function builderSite(v: string | null | undefined): BuilderSite {
  return BUILDER_SITES.includes(v as BuilderSite) ? (v as BuilderSite) : "clearmark";
}
export const builderSiteFrom = (request: Request) => builderSite(new URL(request.url).searchParams.get("site"));

// Kreick goes live on a test address first (Oct 22, 2026); kreickmarketing.com stays on Framer until
// Andrew swaps it. Every Kreick address is listed in KREICK_HOSTS, so the swap needs no code change.
export const KREICK_URL = "https://new.kreickmarketing.com";
export const KREICK_HOSTS = "(?:new\\.|www\\.)?kreickmarketing\\.com";
