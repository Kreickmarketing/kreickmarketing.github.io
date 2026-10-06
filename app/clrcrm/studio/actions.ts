"use server";

import { revalidatePath } from "next/cache";
import { getCrmMember, getServerSupabase } from "@/lib/supabase-server";
import { validatePageContent } from "@/lib/studio-validate";

// The site this codebase serves. Publishing one of its pages refreshes the live page.
const LIVE_SITE = "clearmark";

export type SaveResult = { ok: true; at: string } | { ok: false; error: string };

// Every save checks the login again. Supabase's row rules (RLS) also block
// anyone who isn't on the CRM member list, so this is a second lock.
async function save(pageId: string, content: unknown) {
  const member = await getCrmMember();
  if (!member) return { ok: false as const, error: "You're logged out. Log in again, then save." };
  const checked = validatePageContent(content);
  if (!checked.ok) return checked;

  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from("pages")
    .update({ draft: checked.content })
    .eq("id", pageId)
    .select("slug, updated_at, sites(slug)")
    .maybeSingle();
  if (error) return { ok: false as const, error: error.message };
  if (!data) return { ok: false as const, error: "That page doesn't exist any more." };
  return { ok: true as const, supabase, page: data as unknown as { slug: string; updated_at: string; sites: { slug: string } } };
}

export async function saveDraft(pageId: string, content: unknown): Promise<SaveResult> {
  const r = await save(pageId, content);
  if (!r.ok) return r;
  revalidatePath(`/clrcrm/studio/${r.page.sites.slug}`);
  return { ok: true, at: r.page.updated_at };
}

// Saves the draft, then publishes it in one database step (see publish_page in
// supabase/studio.sql): copies it live, keeps a version, publishes its cards.
export async function publishPage(pageId: string, content: unknown, summary: string): Promise<SaveResult> {
  const r = await save(pageId, content);
  if (!r.ok) return r;
  const { data, error } = await r.supabase.rpc("publish_page", { p_page: pageId, p_summary: summary.slice(0, 300) });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/clrcrm/studio/${r.page.sites.slug}`);
  if (r.page.sites.slug === LIVE_SITE) revalidatePath(r.page.slug);
  return { ok: true, at: data as string };
}
