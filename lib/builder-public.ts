import { getSupabase } from "./supabase";
import { livePageIds, pagesOf, renderLivePage, type BuilderState, type LivePage } from "./builder-site";
import { loadCms } from "./cms";

export type LiveBuilderPage = { page: LivePage; name: string; livePages: string[]; paths: Record<string, string> };

// The published page state, plus the CMS items visitors may see (published only, by RLS).
async function published(siteSlug: string) {
  const supabase = getSupabase();
  const { data: site } = await supabase.from("sites").select("id").eq("slug", siteSlug).maybeSingle();
  if (!site) return null;
  const { data } = await supabase.from("builder_sites").select("published").eq("site_id", site.id).maybeSingle();
  const state = (data?.published as BuilderState | null | undefined) ?? null;
  return state ? { state, cms: await loadCms(supabase, site.id) } : null;
}

// A page from the Studio builder, read the way visitors read it (anon key + RLS:
// only the published copy). Returns null if that page isn't published yet or
// Supabase can't be reached, so the caller can show its fallback. `livePages`
// lists every published page and `paths` their addresses, so the nav links to the real pages.
// Find it by its id ("home") or by its address ("/pricing").
export async function getBuilderPage(siteSlug: string, find: { id: string } | { path: string }): Promise<LiveBuilderPage | null> {
  try {
    const pub = await published(siteSlug);
    if (!pub) return null;
    const { state, cms } = pub;
    const pages = pagesOf(state);
    const info = "id" in find ? pages.find((p) => p.id === find.id) : pages.find((p) => p.path === find.path);
    const page = info ? renderLivePage(state, info.id, cms) : null;
    if (!info || info.unpublished || !page?.sections.length) return null;
    return { page, name: info.name, livePages: livePageIds(state, cms), paths: Object.fromEntries(pages.map((p) => [p.id, p.path])) };
  } catch {
    return null;
  }
}
