import Link from "next/link";
import { notFound } from "next/navigation";
import { STAGES, money, shortDate, stageNumber, weighted } from "../../data";
import { getClient } from "../../queries";
import StageAge from "../../StageAge";
import StageSelect from "../../StageSelect";

// One client's card: contact details, deal, where they are in the 16 stages.
export default async function ClientCard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await getClient(id);
  if (!c) notFound();
  const current = stageNumber(c.stage);

  const rows: [string, React.ReactNode][] = [
    ["Company", c.company],
    ["Email", c.email && <a href={`mailto:${c.email}`}>{c.email}</a>],
    ["Phone", c.phone && <a href={`tel:${c.phone}`}>{c.phone}</a>],
    ["Source", c.source],
    ["Discovery call", c.discovery_call_date && shortDate(c.discovery_call_date)],
    ["Deal value", c.deal_value !== null && money(c.deal_value)],
    ["Probability", c.probability !== null && `${c.probability}%`],
    ["Weighted value", weighted(c) !== null && money(weighted(c))],
    ["Payment status", c.payment_status],
    ["Next action", c.next_action],
    ["Next action date", c.next_action_date && shortDate(c.next_action_date)],
    ["Owner", c.owner],
    ["Last contact", c.last_contact_date && shortDate(c.last_contact_date)],
  ];

  return (
    <div className="crm-page">
      <p className="crm-back"><Link href="/clrcrm/crm/clients">← All clients</Link></p>
      <div className="crm-page-head">
        <div>
          <span className="crm-code">{c.lead_code}</span>
          <h1>{c.name}</h1>
        </div>
        <Link href={`/clrcrm/crm/clients/${c.id}/edit`} className="button button-dark">Edit</Link>
      </div>

      <section className="crm-panel">
        <div className="crm-card-top">
          <h2>Stage</h2>
          <StageAge since={c.stage ? c.stage_entered_date : null} />
        </div>
        <ol className="crm-steps" aria-label="Stage progress">
          {STAGES.map((s) => {
            const n = stageNumber(s)!;
            const state = c.stage === "LOST" || current === null ? "" : n < current ? "done" : n === current ? "now" : "";
            return <li key={s} className={state} aria-current={state === "now" ? "step" : undefined} title={s}>{n}</li>;
          })}
        </ol>
        <p className="crm-hint">
          {c.stage === "LOST" ? "Marked as lost" : c.stage ?? "No stage yet"}
          {c.stage_entered_date && ` · since ${shortDate(c.stage_entered_date)}`}
        </p>
        <StageSelect id={c.id} stage={c.stage} label={c.name} />
      </section>

      <section className="crm-panel">
        <h2>Details</h2>
        <dl className="crm-rows">
          {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v || "—"}</dd></div>)}
        </dl>
      </section>

      {c.notes && (
        <section className="crm-panel">
          <h2>Notes</h2>
          <p className="crm-notes-full">{c.notes}</p>
        </section>
      )}
      <p className="crm-hint">Call transcripts and AI summaries come in a later step.</p>
    </div>
  );
}
