import type { SupabaseClient } from "@supabase/supabase-js";

// The new CRM (clrcrm/crm): loads the crm_* tables (supabase/crm-v2.sql) and shapes them the
// way the page (docs/prototypes/crm/crm.html) draws them. Reads and writes always use the
// logged-in member's session, so Row Level Security decides what they can see and change.

export const STAGES = ["Lead", "Outreach", "Conversation", "Proposal", "Pilot", "Retainer"] as const;
export const STATUSES = ["Warm intro", "Contacted", "Awaiting reply", "In conversation", "Proposal sent", "Client", "Partner", "Author"] as const;

type Row = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v : "");
const day = (v: unknown) => s(v).slice(0, 10);
// "2026-10-11" → "Oct 11"
export const shortDay = (iso: string) => new Date(iso.slice(0, 10) + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
// Who is logged in, as the CRM shows it ("andrew" → "Andrew").
export const displayName = (username: string) => username.charAt(0).toUpperCase() + username.slice(1);

export const groupOut = (g: Row) => ({ id: s(g.id), name: s(g.name), ico: s(g.icon), color: s(g.color) });
export const dealOut = (d: Row, company: string) => ({
  id: s(d.id), name: s(d.name), company: company || "—", stage: s(d.stage), value: Number(d.value) || 0,
  est: d.estimate === true, owner: Array.isArray(d.owners) ? d.owners : [], tasks: Number(d.tasks) || 0, created: s(d.created_at).slice(0, 7),
});
export const personOut = (p: Row, company: string, notes: number) => ({
  id: s(p.id), name: s(p.name), company: company || "—", title: s(p.title) || "—", status: s(p.status) || null,
  last: day(p.last_interaction) || day(p.created_at), deal: s(p.deal_id) || null, email: s(p.email), phone: s(p.phone),
  market: s(p.market) || "—", owner: s(p.owner) || "—", notes, rem: Number(p.reminders) || 0, via: s(p.introduced_by) || "—",
  recap: Array.isArray(p.recap) ? p.recap : [], groups: Array.isArray(p.groups) ? p.groups : [],
});
export const noteOut = (n: Row) => [s(n.author), shortDay(s(n.created_at)), s(n.body)];

export async function loadCrm(supabase: SupabaseClient) {
  const [groups, companies, deals, people, notes, ix] = await Promise.all([
    supabase.from("crm_groups").select("*").order("sort").order("created_at"),
    supabase.from("crm_companies").select("*").order("name"),
    supabase.from("crm_deals").select("*").order("created_at"),
    supabase.from("crm_people").select("*").order("name"),
    supabase.from("crm_notes").select("*").order("created_at", { ascending: false }),
    supabase.from("crm_interactions").select("*").order("happened_on", { ascending: false }),
  ]);
  const failed = [groups, companies, deals, people, notes, ix].find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);

  const coName = new Map((companies.data ?? []).map((c) => [c.id as string, c.name as string]));
  const noteCount = new Map<string, number>();
  const notesBy: Record<string, string[][]> = {};
  for (const n of notes.data ?? []) {
    const pid = n.person_id as string;
    noteCount.set(pid, (noteCount.get(pid) ?? 0) + 1);
    (notesBy[pid] ||= []).push(noteOut(n));
  }
  const ixBy: Record<string, string[][]> = {};
  for (const i of ix.data ?? []) (ixBy[i.person_id as string] ||= []).push([s(i.kind), s(i.title), s(i.who), shortDay(s(i.happened_on))]);

  const dealList = (deals.data ?? []).map((d) => dealOut(d, coName.get(d.company_id as string) ?? ""));
  const peopleList = (people.data ?? []).map((p) => personOut(p, coName.get(p.company_id as string) ?? "", noteCount.get(p.id as string) ?? 0));
  const companyList = (companies.data ?? []).map((c) => {
    const open = (deals.data ?? []).filter((d) => d.company_id === c.id);
    return {
      id: s(c.id), name: s(c.name), industry: s(c.industry) || "—", market: s(c.market) || "—", status: s(c.status) || null,
      people: (people.data ?? []).filter((p) => p.company_id === c.id).length, deal: s(open[0]?.id) || null,
    };
  });
  return { groups: (groups.data ?? []).map(groupOut), companies: companyList, deals: dealList, people: peopleList, notes: notesBy, interactions: ixBy };
}
