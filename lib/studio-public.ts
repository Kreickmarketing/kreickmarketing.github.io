import { getSupabase } from "./supabase";
import { loadCards } from "./studio-cards";
import { PUBLIC_PAGE_COLUMNS, type PageContent, type SiteSettings } from "./studio";

// A published Studio page, read the way visitors read it (anon key + RLS:
// published content only). Returns null if it isn't published yet or
// Supabase can't be reached, so the caller can show its fallback.
export async function getPublishedPage(siteSlug: string, pageSlug: string) {
  try {
    const supabase = getSupabase();
    const { data: site } = await supabase.from("sites").select("id, settings").eq("slug", siteSlug).maybeSingle();
    if (!site) return null;
    const { data: page } = await supabase.from("pages").select(PUBLIC_PAGE_COLUMNS)
      .eq("site_id", site.id).eq("slug", pageSlug).maybeSingle();
    const published = (page as { published: PageContent | null } | null)?.published;
    if (!published) return null;
    const cards = await loadCards(supabase, site.id, published);
    return { content: published, settings: site.settings as SiteSettings, cards, page: page as unknown as { title: string; description: string | null } };
  } catch {
    return null;
  }
}
