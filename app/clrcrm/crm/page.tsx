import Link from "next/link";
import { STAGES, isOpen, money, shortDate, today, weighted, daysSince } from "./data";
import { getClients } from "./queries";
import StageAge from "./StageAge";

export default async function CrmHome() {
  const clients = await getClients();
  const open = clients.filter((c) => isOpen(c.stage));

  const pipeline = open.reduce((sum, c) => sum + (c.deal_value ?? 0), 0);
  const weightedTotal = open.reduce((sum, c) => sum + (weighted(c) ?? 0), 0);

  // Bottleneck: the open stage holding the most deals.
  const counts = STAGES.slice(0, 15).map((s) => ({ stage: s, n: open.filter((c) => c.stage === s).length }));
  const bottleneck = counts.reduce((a, b) => (b.n > a.n ? b : a), { stage: "", n: 0 });

  const due = clients
    .filter((c) => c.next_action)
    .sort((a, b) => (a.next_action_date ?? "9999").localeCompare(b.next_action_date ?? "9999"));
  const stuck = open
    .filter((c) => (daysSince(c.stage_entered_date) ?? 0) > 14)
    .sort((a, b) => (a.stage_entered_date ?? "").localeCompare(b.stage_entered_date ?? ""));
  const noStage = clients.filter((c) => !c.stage);
  const now = today();

  return (
    <div className="crm-page">
      <div className="crm-page-head">
        <h1>Pipeline</h1>
        <Link href="/clrcrm/crm/clients/new" className="button button-action">Add lead</Link>
      </div>

      <dl className="crm-kpis">
        <div><dt>Open pipeline</dt><dd>{money(pipeline)}</dd></div>
        <div><dt>Weighted value</dt><dd>{money(weightedTotal)}</dd></div>
        <div><dt>Open deals</dt><dd>{open.length}</dd></div>
        <div><dt>Bottleneck</dt><dd className="crm-kpi-small">{bottleneck.n ? `${bottleneck.stage} (${bottleneck.n})` : "—"}</dd></div>
      </dl>
      {pipeline === 0 && open.length > 0 && (
        <p className="crm-hint">Totals are $0 because no deal values are filled in yet. Add them on each client card.</p>
      )}

      <div className="crm-panels">
        <section className="crm-panel">
          <h2>Next actions</h2>
          {due.length === 0 ? <p className="crm-empty">Nothing planned.</p> : (
            <ul className="crm-list">
              {due.map((c) => (
                <li key={c.id}>
                  <Link href={`/clrcrm/crm/clients/${c.id}`} className="crm-list-name">{c.name}</Link>
                  <span>{c.next_action}</span>
                  <span className={`crm-when${c.next_action_date && c.next_action_date < now ? " crm-overdue" : ""}`}>
                    {c.next_action_date ? shortDate(c.next_action_date) : "No date set"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="crm-panel">
          <h2>Stuck over 14 days</h2>
          {stuck.length === 0 ? <p className="crm-empty">No open deal is stuck.</p> : (
            <ul className="crm-list">
              {stuck.map((c) => (
                <li key={c.id}>
                  <Link href={`/clrcrm/crm/clients/${c.id}`} className="crm-list-name">{c.name}</Link>
                  <span>{c.stage}</span>
                  <StageAge since={c.stage_entered_date} />
                </li>
              ))}
            </ul>
          )}
          {noStage.length > 0 && (
            <>
              <h3 className="crm-subtitle">No stage yet</h3>
              <ul className="crm-list">
                {noStage.map((c) => (
                  <li key={c.id}><Link href={`/clrcrm/crm/clients/${c.id}`} className="crm-list-name">{c.name}</Link></li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
      <p className="crm-hint">Calendar and email panels come in a later step.</p>
    </div>
  );
}
