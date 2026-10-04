"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveClient, type ClientFormState } from "./actions";
import { ALL_STAGES, type Client } from "./data";

type Field = { name: keyof Client; label: string; type?: string; wide?: boolean };

const groups: { title: string; fields: Field[] }[] = [
  { title: "Contact", fields: [
    { name: "name", label: "Name" },
    { name: "company", label: "Company" },
    { name: "email", label: "Email", type: "email" },
    { name: "phone", label: "Phone", type: "tel" },
    { name: "source", label: "Source / Campaign", wide: true },
  ] },
  { title: "Deal", fields: [
    { name: "stage_entered_date", label: "Stage entered", type: "date" },
    { name: "discovery_call_date", label: "Discovery call", type: "date" },
    { name: "deal_value", label: "Deal value ($)", type: "number" },
    { name: "probability", label: "Probability (%)", type: "number" },
    { name: "payment_status", label: "Payment status" },
    { name: "owner", label: "Owner" },
  ] },
  { title: "Follow-up", fields: [
    { name: "next_action", label: "Next action", wide: true },
    { name: "next_action_date", label: "Next action date", type: "date" },
    { name: "last_contact_date", label: "Last contact", type: "date" },
  ] },
];

// Add a lead (no client passed) or edit one. Blank boxes are saved as empty.
export default function ClientForm({ client }: { client?: Client }) {
  const [state, action, pending] = useActionState<ClientFormState, FormData>(saveClient, { error: "" });
  const value = (k: keyof Client) => (client?.[k] ?? "") as string | number;

  return (
    <form action={action} className="crm-form">
      {client && <input type="hidden" name="id" value={client.id} />}
      {groups.map((g, i) => (
        <fieldset key={g.title} className="crm-panel">
          <legend>{g.title}</legend>
          <div className="crm-fields">
            {i === 1 && (
              <div className="field crm-wide">
                <label htmlFor="stage" className="text-sm-semi-bold">Stage</label>
                <select id="stage" name="stage" defaultValue={client?.stage ?? ""}>
                  <option value="">No stage yet</option>
                  {ALL_STAGES.map((s) => <option key={s} value={s}>{s === "LOST" ? "Lost" : s}</option>)}
                </select>
              </div>
            )}
            {g.fields.map((f) => (
              <div key={f.name} className={`field${f.wide ? " crm-wide" : ""}`}>
                <label htmlFor={f.name} className="text-sm-semi-bold">{f.label}</label>
                <input
                  id={f.name}
                  name={f.name}
                  type={f.type ?? "text"}
                  defaultValue={value(f.name)}
                  required={f.name === "name"}
                  {...(f.name === "probability" ? { min: 0, max: 100, step: 1, inputMode: "numeric" as const } : {})}
                  {...(f.name === "deal_value" ? { min: 0, step: "0.01", inputMode: "decimal" as const } : {})}
                />
              </div>
            ))}
          </div>
        </fieldset>
      ))}
      <fieldset className="crm-panel">
        <legend>Notes</legend>
        <textarea id="notes" name="notes" rows={6} aria-label="Notes" defaultValue={client?.notes ?? ""} />
      </fieldset>

      {state.error && <p className="form-note-error text-sm-normal" role="alert">{state.error}</p>}
      <div className="crm-form-actions">
        <button type="submit" className="button button-action" disabled={pending}>
          {pending ? "Saving…" : client ? "Save changes" : "Add lead"}
        </button>
        <Link href={client ? `/clrcrm/crm/clients/${client.id}` : "/clrcrm/crm/clients"} className="text-sm-normal">Cancel</Link>
      </div>
    </form>
  );
}
