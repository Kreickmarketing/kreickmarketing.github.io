import { getSupabase } from "./supabase";
import { renderLivePage, type BuilderState } from "./builder-site";

// A page from the Studio builder, read the way visitors read it (anon key + RLS:
// only the published copy). Returns null if nothing is published yet or Supabase
// can't be reached, so the caller can show its fallback.
export async function getBuilderPage(siteSlug: string, pageId: string) {
  try {
    const supabase = getSupabase();
    const { data: site } = await supabase.from("sites").select("id").eq("slug", siteSlug).maybeSingle();
    if (!site) return null;
    const { data } = await supabase.from("builder_sites").select("published").eq("site_id", site.id).maybeSingle();
    const published = data?.published as BuilderState | null | undefined;
    return published ? renderLivePage(published, pageId) : null;
  } catch {
    return null;
  }
}
