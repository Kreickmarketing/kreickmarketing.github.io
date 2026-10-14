import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCrmMember, getServerSupabase } from "@/lib/supabase-server";
import Anthropic from "@anthropic-ai/sdk";
import { AiError, research, writeRecap } from "@/lib/crm-ai";
import { STAGES, STATUSES, cleanSettings, companyOut, sequenceOut, dealOut, displayName, groupOut, ixOut, noteOut, personOut, reminderOut } from "@/lib/crm-v2";

// Saves changes made in the new CRM (clrcrm/crm). One POST per change, { action, ... }.
// Only CRM members get past the check, every value is checked here, and Row Level
// Security on the crm_* tables checks again in Supabase.
export const dynamic = "force-dynamic";
// The Recap and Research assistants ask Claude, which can take up to a minute with a web search.
export const maxDuration = 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GROUP_ID = /^[a-z0-9-]{1,40}$/;
const COLOR = /^#[0-9A-Fa-f]{6}$/;
const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
const today = () => new Date().toISOString().slice(0, 10);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// "" → null, so cleared fields are stored as empty.
const opt = (v: unknown, max: number) => text(v, max) || null;

// The company row for a name typed in the CRM: found, or made. "" or "—" means none.
async function companyId(supabase: SupabaseClient, name: string) {
  if (!name || name === "—") return null;
  const { data: found } = await supabase.from("crm_companies").select("id").eq("name", name).maybeSingle();
  if (found) return found.id as string;
  const { data: made, error } = await supabase.from("crm_companies").insert({ name }).select("id").single();
  if (error) throw new Error(error.message);
  return made.id as string;
}

export async function POST(request: Request) {
  const member = await getCrmMember();
  if (!member) return fail("Log in again", 401);
  const me = displayName(member.username);
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return fail("Bad request"); }
  const supabase = await getServerSupabase();

  try {
    switch (b.action) {
      case "addPerson": {
        const name = text(b.name, 200), company = text(b.company, 200), group = text(b.group, 40);
        if (!name) return fail("A name is needed");
        const status = (STATUSES as readonly string[]).includes(String(b.status)) ? String(b.status) : null;
        const { data, error } = await supabase.from("crm_people").insert({
          name, company_id: await companyId(supabase, company), title: text(b.title, 200) || null, status, owner: me,
          last_interaction: today(), groups: GROUP_ID.test(group) ? [group] : ["pipeline"], recap: ["New record. Add a note or run the research assistant."],
        }).select("*").single();
        if (error) throw new Error(error.message);
        return NextResponse.json({ person: personOut(data, company, 0) });
      }
      case "addDeal": {
        const name = text(b.name, 200), company = text(b.company, 200);
        if (!name) return fail("A deal name is needed");
        const stage = (STAGES as readonly string[]).includes(String(b.stage)) ? String(b.stage) : "Lead";
        const value = Math.min(Math.max(Math.round(Number(b.value) || 0), 0), 1_000_000_000);
        const { data, error } = await supabase.from("crm_deals").insert({ name, company_id: await companyId(supabase, company), stage, value, owners: [me] }).select("*").single();
        if (error) throw new Error(error.message);
        return NextResponse.json({ deal: dealOut(data, company) });
      }
      case "updatePerson": {
        const id = String(b.id), name = text(b.name, 200), company = text(b.company, 200), email = text(b.email, 320), dealId = String(b.dealId ?? "");
        if (!UUID.test(id) || !name) return fail(name ? "Bad request" : "A name is needed");
        if (email && !EMAIL.test(email)) return fail("That email doesn't look right");
        const status = (STATUSES as readonly string[]).includes(String(b.status)) ? String(b.status) : null;
        const recap = Array.isArray(b.recap) ? b.recap.map((r) => text(r, 300)).filter(Boolean).slice(0, 10) : [];
        const { data, error } = await supabase.from("crm_people").update({
          name, company_id: await companyId(supabase, company), title: opt(b.title, 200), email: email || null, phone: opt(b.phone, 40),
          status, market: opt(b.market, 100), owner: opt(b.owner, 100), introduced_by: opt(b.via, 200), deal_id: UUID.test(dealId) ? dealId : null, recap,
        }).eq("id", id).select("*").single();
        if (error) throw new Error(error.message);
        const { count } = await supabase.from("crm_notes").select("id", { count: "exact", head: true }).eq("person_id", id);
        const { count: rem } = await supabase.from("crm_reminders").select("id", { count: "exact", head: true }).eq("person_id", id).eq("done", false);
        return NextResponse.json({ person: personOut(data, company, count ?? 0, rem ?? 0) });
      }
      case "deletePerson": {
        const id = String(b.id);
        if (!UUID.test(id)) return fail("Bad request");
        const { data, error } = await supabase.from("crm_people").delete().eq("id", id).select("id");
        if (error) throw new Error(error.message);
        if (!data?.length) return fail("That person wasn't found", 404);
        return NextResponse.json({ ok: true });
      }
      case "updateDeal": {
        const id = String(b.id), name = text(b.name, 200), company = text(b.company, 200);
        if (!UUID.test(id) || !name) return fail(name ? "Bad request" : "A deal name is needed");
        const stage = (STAGES as readonly string[]).includes(String(b.stage)) ? String(b.stage) : "Lead";
        const value = Math.min(Math.max(Math.round(Number(b.value) || 0), 0), 1_000_000_000);
        const { data, error } = await supabase.from("crm_deals").update({ name, company_id: await companyId(supabase, company), stage, value, estimate: b.estimate === true }).eq("id", id).select("*").single();
        if (error) throw new Error(error.message);
        return NextResponse.json({ deal: dealOut(data, company) });
      }
      case "deleteDeal": {
        const id = String(b.id);
        if (!UUID.test(id)) return fail("Bad request");
        const { data, error } = await supabase.from("crm_deals").delete().eq("id", id).select("id");
        if (error) throw new Error(error.message);
        if (!data?.length) return fail("That deal wasn't found", 404);
        return NextResponse.json({ ok: true });
      }
      case "addCompany":
      case "updateCompany": {
        const id = String(b.id ?? ""), name = text(b.name, 200);
        if (!name || (b.action === "updateCompany" && !UUID.test(id))) return fail(name ? "Bad request" : "A company name is needed");
        const row = { name, industry: opt(b.industry, 200), market: opt(b.market, 100), status: opt(b.status, 40) };
        const q = b.action === "addCompany" ? supabase.from("crm_companies").insert(row) : supabase.from("crm_companies").update(row).eq("id", id);
        const { data, error } = await q.select("*").single();
        if (error?.code === "23505") return fail("A company with that name already exists", 409);
        if (error) throw new Error(error.message);
        const { count } = await supabase.from("crm_people").select("id", { count: "exact", head: true }).eq("company_id", data.id);
        const { data: deal } = await supabase.from("crm_deals").select("id").eq("company_id", data.id).limit(1).maybeSingle();
        return NextResponse.json({ company: companyOut(data, count ?? 0, (deal?.id as string) ?? null) });
      }
      case "deleteCompany": {
        const id = String(b.id);
        if (!UUID.test(id)) return fail("Bad request");
        const { data, error } = await supabase.from("crm_companies").delete().eq("id", id).select("id");
        if (error) throw new Error(error.message);
        if (!data?.length) return fail("That company wasn't found", 404);
        return NextResponse.json({ ok: true });
      }
      case "deleteNote": {
        const id = String(b.id);
        if (!UUID.test(id)) return fail("Bad request");
        const { data, error } = await supabase.from("crm_notes").delete().eq("id", id).select("id");
        if (error) throw new Error(error.message);
        if (!data?.length) return fail("That note wasn't found", 404);
        return NextResponse.json({ ok: true });
      }
      case "addInteraction": {
        const personId = String(b.personId), title = text(b.title, 300), date = text(b.date, 10);
        const kind = ["mail", "meet", "call"].includes(String(b.kind)) ? String(b.kind) : "mail";
        if (!UUID.test(personId) || !title || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) return fail(title ? "Bad request" : "Say what happened");
        const { data, error } = await supabase.from("crm_interactions").insert({ person_id: personId, kind, title, who: opt(b.who, 300) ?? me, happened_on: date }).select("*").single();
        if (error) throw new Error(error.message);
        // Keep "Last interaction" on the person up to date.
        const { data: p } = await supabase.from("crm_people").select("last_interaction").eq("id", personId).single();
        const last = !p?.last_interaction || String(p.last_interaction) < date ? date : String(p.last_interaction);
        if (last === date) await supabase.from("crm_people").update({ last_interaction: date }).eq("id", personId);
        return NextResponse.json({ interaction: ixOut(data), last });
      }
      case "addReminder": {
        const personId = String(b.personId), title = text(b.title, 300), due = text(b.due, 10);
        if (!UUID.test(personId) || !title) return fail(title ? "Bad request" : "Say what to follow up on");
        if (due && (!/^\d{4}-\d{2}-\d{2}$/.test(due) || Number.isNaN(Date.parse(due)))) return fail("That date doesn't look right");
        const { data, error } = await supabase.from("crm_reminders").insert({ person_id: personId, title, due: due || null, created_by: me }).select("*").single();
        if (error) throw new Error(error.message);
        return NextResponse.json({ reminder: reminderOut(data) });
      }
      case "setReminderDone": {
        const id = String(b.id);
        if (!UUID.test(id)) return fail("Bad request");
        const { data, error } = await supabase.from("crm_reminders").update({ done: b.done === true }).eq("id", id).select("*").single();
        if (error) throw new Error(error.message);
        return NextResponse.json({ reminder: reminderOut(data) });
      }
      case "saveSettings": {
        const settings = cleanSettings(b.settings);
        const { error } = await supabase.from("crm_settings").upsert({ id: "crm", data: settings });
        if (error) throw new Error(error.message);
        return NextResponse.json({ settings });
      }
      case "recap": {
        const personId = String(b.personId);
        if (!UUID.test(personId)) return fail("Bad request");
        return NextResponse.json({ recap: await writeRecap(supabase, personId) });
      }
      case "research": {
        const personId = String(b.personId);
        if (!UUID.test(personId)) return fail("Bad request");
        return NextResponse.json({ note: noteOut(await research(supabase, personId)) });
      }
      case "addSequence":
      case "updateSequence": {
        const id = String(b.id ?? "");
        if (b.action === "updateSequence" && !UUID.test(id)) return fail("Bad request");
        const to = Array.isArray(b.to) ? [...new Set(b.to.map(String).filter((x) => UUID.test(x)))].slice(0, 200) : [];
        const row = { subject: text(b.subject, 200), body: text(b.body, 10000), follow_up: text(b.follow, 5000), wait_days: Math.min(Math.max(Math.round(Number(b.wait) || 0), 0), 60), recipients: to };
        const q = b.action === "addSequence" ? supabase.from("crm_sequences").insert({ ...row, created_by: me }) : supabase.from("crm_sequences").update(row).eq("id", id);
        const { data, error } = await q.select("*").single();
        if (error) throw new Error(error.message);
        return NextResponse.json({ sequence: sequenceOut(data) });
      }
      case "deleteSequence": {
        const id = String(b.id);
        if (!UUID.test(id)) return fail("Bad request");
        const { data, error } = await supabase.from("crm_sequences").delete().eq("id", id).select("id");
        if (error) throw new Error(error.message);
        if (!data?.length) return fail("That sequence wasn't found", 404);
        return NextResponse.json({ ok: true });
      }
      // Until an email service is connected: logs an email interaction for each recipient,
      // moves their Last interaction to today, and adds a reminder to send the follow-up.
      case "markSequenceSent": {
        const id = String(b.id);
        if (!UUID.test(id)) return fail("Bad request");
        const { data: seq, error } = await supabase.from("crm_sequences").select("*").eq("id", id).single();
        if (error) throw new Error(error.message);
        const to = (seq.recipients as string[]) ?? [];
        if (!to.length) return fail("Add recipients first");
        const day0 = today(), due = new Date(Date.now() + (Number(seq.wait_days) || 0) * 864e5).toISOString().slice(0, 10);
        const subject = String(seq.subject || "Email");
        const ix = await supabase.from("crm_interactions").insert(to.map((p) => ({ person_id: p, kind: "mail", title: subject, who: me, happened_on: day0 }))).select("*");
        if (ix.error) throw new Error(ix.error.message);
        const up = await supabase.from("crm_people").update({ last_interaction: day0 }).in("id", to).or(`last_interaction.is.null,last_interaction.lt.${day0}`);
        if (up.error) throw new Error(up.error.message);
        let rems: Record<string, unknown>[] = [];
        if (String(seq.follow_up || "").trim()) {
          const r = await supabase.from("crm_reminders").insert(to.map((p) => ({ person_id: p, title: `Send the follow-up: ${subject}`.slice(0, 300), due, created_by: me }))).select("*");
          if (r.error) throw new Error(r.error.message);
          rems = r.data ?? [];
        }
        const { data: done, error: e3 } = await supabase.from("crm_sequences").update({ status: "Sent", sent_at: new Date().toISOString() }).eq("id", id).select("*").single();
        if (e3) throw new Error(e3.message);
        return NextResponse.json({ sequence: sequenceOut(done), interactions: (ix.data ?? []).map((i) => ({ person: i.person_id, row: ixOut(i) })), reminders: rems.map(reminderOut), day: day0 });
      }
      case "moveDeal": {
        const id = String(b.id), stage = String(b.stage);
        if (!UUID.test(id) || !(STAGES as readonly string[]).includes(stage)) return fail("Bad request");
        const { data, error } = await supabase.from("crm_deals").update({ stage }).eq("id", id).select("id");
        if (error) throw new Error(error.message);
        if (!data?.length) return fail("That deal wasn't found", 404);
        return NextResponse.json({ ok: true });
      }
      case "addNote": {
        const personId = String(b.personId), body = text(b.body, 5000);
        if (!UUID.test(personId) || !body) return fail("Bad request");
        const { data, error } = await supabase.from("crm_notes").insert({ person_id: personId, author: me, body }).select("*").single();
        if (error) throw new Error(error.message);
        return NextResponse.json({ note: noteOut(data) });
      }
      case "addToGroup": {
        const personId = String(b.personId), groupId = String(b.groupId);
        if (!UUID.test(personId) || !GROUP_ID.test(groupId)) return fail("Bad request");
        const { data: p, error } = await supabase.from("crm_people").select("groups").eq("id", personId).single();
        if (error) throw new Error(error.message);
        const groups = Array.isArray(p.groups) ? (p.groups as string[]) : [];
        if (!groups.includes(groupId)) {
          const { error: e2 } = await supabase.from("crm_people").update({ groups: [...groups, groupId] }).eq("id", personId);
          if (e2) throw new Error(e2.message);
        }
        return NextResponse.json({ ok: true });
      }
      case "addGroup": {
        const name = text(b.name, 60), color = String(b.color);
        if (!name) return fail("A group name is needed");
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || "group";
        const { data: last } = await supabase.from("crm_groups").select("sort").order("sort", { ascending: false }).limit(1).maybeSingle();
        const { data, error } = await supabase.from("crm_groups").insert({
          id: `${slug}-${Math.random().toString(36).slice(2, 7)}`, name, icon: [...name][0].toUpperCase(),
          color: COLOR.test(color) ? color : "#0099CE", sort: (Number(last?.sort) || 0) + 1,
        }).select("*").single();
        if (error) throw new Error(error.message);
        return NextResponse.json({ group: groupOut(data) });
      }
      case "orderGroups": {
        const ids = Array.isArray(b.ids) ? b.ids.map(String).filter((x) => GROUP_ID.test(x)).slice(0, 50) : [];
        for (const [i, id] of ids.entries()) {
          const { error } = await supabase.from("crm_groups").update({ sort: i }).eq("id", id);
          if (error) throw new Error(error.message);
        }
        return NextResponse.json({ ok: true });
      }
      default:
        return fail("Unknown action");
    }
  } catch (e) {
    if (e instanceof AiError) return fail(e.message, 422);
    // Claude errors, in plain words (most specific first).
    if (e instanceof Anthropic.AuthenticationError) return fail("Claude's key isn't valid: check ANTHROPIC_API_KEY in Vercel", 502);
    if (e instanceof Anthropic.PermissionDeniedError) return fail("Claude's key can't use this model or tool", 502);
    if (e instanceof Anthropic.RateLimitError) return fail("Claude is busy right now; try again in a minute", 503);
    if (e instanceof Anthropic.APIConnectionError) return fail("Couldn't reach Claude; try again", 503);
    if (e instanceof Anthropic.APIError) {
      console.error("Claude error:", e.status, e.message);
      // Anthropic's own reason (e.g. "Your credit balance is too low…"); it never contains the key.
      const why = String((e.error as { error?: { message?: unknown } } | undefined)?.error?.message ?? "").slice(0, 200);
      return fail(`Claude couldn't answer (error ${e.status ?? "?"}${why ? `: ${why}` : ""})`, 502);
    }
    console.error("CRM save failed:", e);
    return fail("Not saved", 500);
  }
}
