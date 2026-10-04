import Link from "next/link";
import { PHASES, money } from "../data";
import { getClients } from "../queries";
import StageAge from "../StageAge";
import StageSelect from "../StageSelect";

// Pipeline board: one column per phase, each lead as a card.
// Change a card's stage with its dropdown; it saves straight away.
export default async function FunnelPage() {
  const clients = await getClients();
  // Lost and No-stage columns only show when they have someone in them.
  const columns = [
    ...PHASES.map((p) => ({ key: p.key, label: p.label, items: clients.filter((c) => c.stage && p.stages.includes(c.stage)) })),
    { key: "none", label: "No stage yet", items: clients.filter((c) => !c.stage) },
  ].filter((col) => (col.key !== "lost" && col.key !== "none") || col.items.length > 0);

  return (
    <div className="crm-page crm-page-wide">
      <div className="crm-page-head">
        <h1>Funnel</h1>
        <Link href="/clrcrm/crm/clients/new" className="button button-action">Add lead</Link>
      </div>
      <div className="crm-board">
        {columns.map((col) => {
          const value = col.items.reduce((s, c) => s + (c.deal_value ?? 0), 0);
          return (
            <section key={col.key} className={`crm-col crm-col-${col.key}`} aria-label={col.label}>
              <header>
                <h2>{col.label}</h2>
                <span>{col.items.length} {col.items.length === 1 ? "deal" : "deals"}{value > 0 && ` · ${money(value)}`}</span>
              </header>
              {col.items.length === 0 && <p className="crm-empty">Empty</p>}
              {col.items.map((c) => (
                <article key={c.id} className="crm-card">
                  <div className="crm-card-top">
                    <Link href={`/clrcrm/crm/clients/${c.id}`} className="crm-card-name">{c.name}</Link>
                    <StageAge since={c.stage ? c.stage_entered_date : null} />
                  </div>
                  {c.company && <p className="crm-card-co">{c.company}</p>}
                  {c.deal_value !== null && <p className="crm-card-val">{money(c.deal_value)}{c.probability !== null && ` · ${c.probability}%`}</p>}
                  <StageSelect id={c.id} stage={c.stage} label={c.name} />
                </article>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
