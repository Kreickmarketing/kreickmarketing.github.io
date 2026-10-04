"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCrmMember, getServerSupabase } from "@/lib/supabase-server";
import { ALL_STAGES, today } from "./data";

export type ClientFormState = { error: string };

// Every change checks the login again. Supabase's row rules (RLS) also block
// anyone who isn't on the CRM member list, so this is a second lock.
async function requireMember() {
  const member = await getCrmMember();
  if (!member) redirect("/clrcrm/login?denied=1");
  return member;
}

const text = (fd: FormData, key: string, max = 2000) => {
  const v = String(fd.get(key) ?? "").trim();
  return v ? v.slice(0, max) : null;
};
const date = (fd: FormData, key: string) => {
  const v = text(fd, key, 10);
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
};
const amount = (fd: FormData, key: string) => {
  const v = text(fd, key, 20)?.replace(/[$,\s]/g, "");
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};

// Moves a lead to another stage (Funnel board and client card).
// The database stamps today's date as the "stage entered" date.
export async function moveStage(formData: FormData) {
  await requireMember();
  const id = String(formData.get("id") ?? "");
  const stage = String(formData.get("stage") ?? "");
  if (!id || !ALL_STAGES.includes(stage)) return;

  const supabase = await getServerSupabase();
  await supabase.from("clients").update({ stage }).eq("id", id);
  revalidatePath("/clrcrm/crm", "layout");
}

// Adds a new lead, or saves edits to an existing one.
export async function saveClient(_prev: ClientFormState, formData: FormData): Promise<ClientFormState> {
  await requireMember();
  const id = text(formData, "id", 64);
  const name = text(formData, "name", 200);
  if (!name) return { error: "Add a name." };

  const stage = text(formData, "stage", 80);
  if (stage && !ALL_STAGES.includes(stage)) return { error: "Pick a stage from the list." };

  const probabilityRaw = text(formData, "probability", 5);
  const probability = probabilityRaw === null ? null : Number(probabilityRaw);
  if (probability !== null && !(Number.isInteger(probability) && probability >= 0 && probability <= 100)) {
    return { error: "Probability is a whole number from 0 to 100." };
  }

  const row = {
    name,
    company: text(formData, "company", 200),
    email: text(formData, "email", 320),
    phone: text(formData, "phone", 50),
    source: text(formData, "source", 200),
    stage,
    stage_entered_date: date(formData, "stage_entered_date"),
    discovery_call_date: date(formData, "discovery_call_date"),
    deal_value: amount(formData, "deal_value"),
    probability,
    payment_status: text(formData, "payment_status", 50),
    next_action: text(formData, "next_action", 500),
    next_action_date: date(formData, "next_action_date"),
    owner: text(formData, "owner", 100),
    last_contact_date: date(formData, "last_contact_date"),
    notes: text(formData, "notes", 5000),
  };

  const supabase = await getServerSupabase();
  let savedId = id;
  if (id) {
    const { error } = await supabase.from("clients").update(row).eq("id", id);
    if (error) return { error: "Couldn't save. Try again." };
  } else {
    // New leads get the next ID in the L-1001, L-1002 … series.
    const { data: codes } = await supabase.from("clients").select("lead_code").like("lead_code", "L-%");
    const next = Math.max(1000, ...(codes ?? []).map((c) => parseInt(String(c.lead_code).slice(2), 10) || 0)) + 1;
    const { data, error } = await supabase
      .from("clients")
      .insert({ ...row, lead_code: `L-${next}`, stage_entered_date: row.stage_entered_date ?? (stage ? today() : null) })
      .select("id")
      .single();
    if (error || !data) return { error: "Couldn't add the lead. Try again." };
    savedId = data.id;
  }

  revalidatePath("/clrcrm/crm", "layout");
  redirect(`/clrcrm/crm/clients/${savedId}`);
}
