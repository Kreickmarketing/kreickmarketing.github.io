// Shared CRM definitions: the sales stages, their phases, and small helpers
// used by every CRM view. Stage names must match the check in supabase/crm-tables.sql.

export const STAGES = [
  "1. Ad Live",
  "2. Lead Magnet Downloaded",
  "3. Contact Captured",
  "4. Discovery Call Booked",
  "5. Discovery Call Held",
  "6. Presentation / Product Demo",
  "7. Pricing Presented",
  "8. Contract Sent",
  "9. Payment Collected",
  "10. Login / Onboarding Started",
  "11. Subscription Confirmed",
  "12. Custom System Delivered",
  "13. Coaching Calls (Ongoing)",
  "14. Objection Handling Trained",
  "15. Welcome / Swag",
  "16. Program Accepted (Active Customer)",
] as const;

export const LOST = "LOST";
export const ALL_STAGES: readonly string[] = [...STAGES, LOST];

export type Phase = { key: string; label: string; stages: readonly string[] };

export const PHASES: Phase[] = [
  { key: "mkt", label: "Marketing Funnel", stages: STAGES.slice(0, 3) },
  { key: "onb", label: "Onboarding & Payment", stages: STAGES.slice(3, 9) },
  { key: "saas", label: "SaaS Product / Service", stages: STAGES.slice(9, 16) },
  { key: "lost", label: "Lost", stages: [LOST] },
];

export type Client = {
  id: string;
  lead_code: string | null;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  stage: string | null;
  stage_entered_date: string | null;
  discovery_call_date: string | null;
  deal_value: number | null;
  probability: number | null;
  payment_status: string | null;
  next_action: string | null;
  next_action_date: string | null;
  owner: string | null;
  last_contact_date: string | null;
  notes: string | null;
};

export type Product = {
  id: string;
  product_code: string | null;
  name: string;
  category: string | null;
  price_type: string | null;
  price: number | null;
  price_min: number | null;
  price_max: number | null;
  billing_type: string | null;
  payment_route: string | null;
  funnel_url: string | null;
  description: string | null;
  status: string | null;
  notes: string | null;
};

// Stages 1-15 are "open": the deal is still moving. 16 is won, LOST is lost.
export function stageNumber(stage: string | null) {
  const n = stage ? parseInt(stage, 10) : NaN;
  return Number.isNaN(n) ? null : n;
}
export function isOpen(stage: string | null) {
  const n = stageNumber(stage);
  return n !== null && n <= 15;
}

export function phaseOf(stage: string | null) {
  return PHASES.find((p) => stage && p.stages.includes(stage)) ?? null;
}

// Supabase returns numeric columns as strings; turn them into numbers.
export function num(v: unknown) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function weighted(c: Client) {
  const v = num(c.deal_value);
  const p = num(c.probability);
  return v !== null && p !== null ? (v * p) / 100 : null;
}

export function money(v: number | null) {
  if (v === null) return "—";
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

// "2026-09-01" → "Sep 1, 2026". Dates are calendar days, so read them as UTC.
export function shortDate(d: string | null) {
  if (!d) return "—";
  return new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function daysSince(d: string | null) {
  if (!d) return null;
  return Math.floor((Date.parse(`${today()}T00:00:00Z`) - Date.parse(`${d}T00:00:00Z`)) / 86_400_000);
}

// Days in stage: under 7 is fine, 7-14 needs a nudge, over 14 is stuck.
export function ageLevel(days: number | null) {
  if (days === null) return null;
  return days > 14 ? "crit" : days >= 7 ? "warn" : "ok";
}
