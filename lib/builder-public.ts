import { getSupabase } from "./supabase";
import { livePageIds, renderLivePage, type BuilderState, type LivePage } from "./builder-site";

// A page from the Studio builder, read the way visitors read it (anon key + RLS:
// only the published copy). Returns null if that page isn't published yet or
// Supabase can't be reached, so the caller can show its fallback. `livePages`
// lists every published page, so the nav can link to the real pages.
export async function getBuilderPage(siteSlug: string, pageId: string): Promise<{ page: LivePage; livePages: string[] } | null> {
  try {
    const supabase = getSupabase();
    const { data: site } = await supabase.from("sites").select("id").eq("slug", siteSlug).maybeSingle();
    if (!site) return null;
    const { data } = await supabase.from("builder_sites").select("published").eq("site_id", site.id).maybeSingle();
    const published = data?.published as BuilderState | null | undefined;
    const page = published ? renderLivePage(published, pageId) : null;
    return page && page.sections.length ? { page, livePages: livePageIds(published) } : null;
  } catch {
    return null;
  }
}
