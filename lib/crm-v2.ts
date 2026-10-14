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
export const personOut = (p: Row, company: string, notes: number, rem = 0) => ({
  id: s(p.id), name: s(p.name), company: company || "—", title: s(p.title) || "—", status: s(p.status) || null,
  last: day(p.last_interaction) || day(p.created_at), deal: s(p.deal_id) || null, email: s(p.email), phone: s(p.phone),
  market: s(p.market) || "—", owner: s(p.owner) || "—", notes, rem, via: s(p.introduced_by) || "—",
  recap: Array.isArray(p.recap) ? p.recap : [], groups: Array.isArray(p.groups) ? p.groups : [],
});
// Notes and interactions as rows the page reads: [author, date, text, id] and [kind, title, who, date].
export const noteOut = (n: Row) => [s(n.author), shortDay(s(n.created_at)), s(n.body), s(n.id)];
export const ixOut = (i: Row) => [s(i.kind), s(i.title), s(i.who), shortDay(s(i.happened_on))];
export const reminderOut = (r: Row) => ({ id: s(r.id), person: s(r.person_id), title: s(r.title), due: day(r.due) || null, done: r.done === true, by: s(r.created_by) });
export const sequenceOut = (q: Row) => ({
  id: s(q.id), subject: s(q.subject), body: s(q.body), follow: s(q.follow_up), wait: Number(q.wait_days) || 0,
  status: s(q.status) || "Draft", to: Array.isArray(q.recipients) ? (q.recipients as string[]) : [], sentAt: day(q.sent_at) || null, followSentAt: day(q.followup_sent_at) || null,
});
export const companyOut = (c: Row, people: number, deal: string | null) => ({
  id: s(c.id), name: s(c.name), industry: s(c.industry) || "—", market: s(c.market) || "—", status: s(c.status) || null, people, deal,
});

export async function loadCrm(supabase: SupabaseClient) {
  const [groups, companies, deals, people, notes, ix, rems, seqs] = await Promise.all([
    supabase.from("crm_groups").select("*").order("sort").order("created_at"),
    supabase.from("crm_companies").select("*").order("name"),
    supabase.from("crm_deals").select("*").order("created_at"),
    supabase.from("crm_people").select("*").order("name"),
    supabase.from("crm_notes").select("*").order("created_at", { ascending: false }),
    supabase.from("crm_interactions").select("*").order("happened_on", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("crm_reminders").select("*").order("due", { ascending: true, nullsFirst: false }).order("created_at"),
    supabase.from("crm_sequences").select("*").order("created_at"),
  ]);
  const failed = [groups, companies, deals, people, notes, ix, rems, seqs].find((r) => r.error);
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
  for (const i of ix.data ?? []) (ixBy[i.person_id as string] ||= []).push(ixOut(i));
  const reminders = (rems.data ?? []).map(reminderOut);
  const openRem = new Map<string, number>();
  for (const r of reminders) if (!r.done) openRem.set(r.person, (openRem.get(r.person) ?? 0) + 1);

  const dealList = (deals.data ?? []).map((d) => dealOut(d, coName.get(d.company_id as string) ?? ""));
  const peopleList = (people.data ?? []).map((p) => personOut(p, coName.get(p.company_id as string) ?? "", noteCount.get(p.id as string) ?? 0, openRem.get(p.id as string) ?? 0));
  const companyList = (companies.data ?? []).map((c) => companyOut(c,
    (people.data ?? []).filter((p) => p.company_id === c.id).length, s((deals.data ?? []).find((d) => d.company_id === c.id)?.id) || null));
  return { groups: (groups.data ?? []).map(groupOut), companies: companyList, deals: dealList, people: peopleList, notes: notesBy, interactions: ixBy, reminders, sequences: (seqs.data ?? []).map(sequenceOut) };
}

// ── Assistants ──
// Settings from the Assistants page (one crm_settings row).
export const FOLLOW_AFTER: Record<string, number> = { "3 days": 3, "1 week": 7, "2 weeks": 14, "1 month": 30 };
export type CrmSettings = { assist: { follow: boolean; recap: boolean; research: boolean; portal: boolean }; followAfter: string; signature: string };
// Added to the end of every email the CRM sends. Canada's anti-spam law (CASL) asks sales emails to
// say who they're from, give a mailing address, and offer a way to opt out.
export const DEFAULT_SIGNATURE = "--\nAndrew Kreick\nClearMark · clearmark.bz\n[Add your mailing address here]\n\nIf you'd rather not get emails from me, just reply and say so.";
export const DEFAULT_SETTINGS: CrmSettings = { assist: { follow: true, recap: true, research: false, portal: true }, followAfter: "1 week", signature: DEFAULT_SIGNATURE };
export function cleanSettings(v: unknown): CrmSettings {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const a = (o.assist && typeof o.assist === "object" ? o.assist : {}) as Record<string, unknown>;
  const flag = (k: keyof CrmSettings["assist"]) => (typeof a[k] === "boolean" ? (a[k] as boolean) : DEFAULT_SETTINGS.assist[k]);
  return {
    assist: { follow: flag("follow"), recap: flag("recap"), research: flag("research"), portal: flag("portal") },
    followAfter: typeof o.followAfter === "string" && o.followAfter in FOLLOW_AFTER ? o.followAfter : DEFAULT_SETTINGS.followAfter,
    signature: typeof o.signature === "string" ? o.signature.slice(0, 1000) : DEFAULT_SETTINGS.signature,
  };
}
export async function loadSettings(supabase: SupabaseClient) {
  const { data } = await supabase.from("crm_settings").select("data").eq("id", "crm").maybeSingle();
  return cleanSettings(data?.data);
}

export const FOLLOW_UP_BY = "Follow-up assistant";
// Follow-up assistant: for everyone with no interaction in the chosen time, add a
// "Follow up with …" reminder due today. Skips people who already have an open reminder,
// and people it already reminded about since their last interaction (so ticking one off
// doesn't bring it straight back). Runs when the CRM is opened. Returns how many it added.
export async function runFollowUps(supabase: SupabaseClient, settings: CrmSettings, now = new Date()) {
  if (!settings.assist.follow) return 0;
  const days = FOLLOW_AFTER[settings.followAfter] ?? 7;
  const [people, rems] = await Promise.all([
    supabase.from("crm_people").select("id, name, last_interaction, created_at"),
    supabase.from("crm_reminders").select("person_id, done, created_by, created_at"),
  ]);
  if (people.error || rems.error) throw new Error((people.error ?? rems.error)!.message);
  const todayIso = now.toISOString().slice(0, 10);
  const cutoff = new Date(now.getTime() - days * 864e5).toISOString().slice(0, 10);
  const rows = [];
  for (const p of people.data ?? []) {
    const last = day(p.last_interaction) || day(p.created_at);
    if (!last || last > cutoff) continue;
    const mine = (rems.data ?? []).filter((r) => r.person_id === p.id);
    if (mine.some((r) => !r.done)) continue;
    if (mine.some((r) => r.created_by === FOLLOW_UP_BY && day(r.created_at) >= last)) continue;
    const first = s(p.name).split(" ")[0] || s(p.name);
    rows.push({ person_id: p.id, title: `Follow up with ${first}: no contact since ${shortDay(last)}`, due: todayIso, created_by: FOLLOW_UP_BY });
  }
  if (!rows.length) return 0;
  const { error } = await supabase.from("crm_reminders").insert(rows);
  if (error) throw new Error(error.message);
  return rows.length;
}

// {first_name} and {company} filled in for one person (same rule as the page's preview).
export function fillMerge(text: string, person: { name?: unknown }, company: string) {
  const first = s(person.name).split(" ")[0] || "there";
  return text.replace(/\{first_name\}/g, first).replace(/\{company\}/g, company && company !== "—" ? company : "your team");
}
