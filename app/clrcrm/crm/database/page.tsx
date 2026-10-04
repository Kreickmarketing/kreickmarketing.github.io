import Link from "next/link";
import { money, shortDate, weighted } from "../data";
import { getClients } from "../queries";

// Spreadsheet view: every lead, every column, in the same order as the old Google Sheet.
export default async function DatabasePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const needle = q.trim().toLowerCase();
  const all = await getClients();
  const clients = needle
    ? all.filter((c) => [c.lead_code, c.name, c.company, c.email, c.source, c.stage, c.notes, c.next_action]
        .some((v) => v?.toLowerCase().includes(needle)))
    : all;

  return (
    <div className="crm-page crm-page-wide">
      <div className="crm-page-head">
        <h1>Database</h1>
        <Link href="/clrcrm/crm/clients/new" className="button button-action">Add lead</Link>
      </div>
      <form className="crm-search" role="search">
        <input type="search" name="q" defaultValue={q} placeholder="Search name, company, stage, notes…" aria-label="Search leads" />
        <button type="submit" className="button button-dark">Search</button>
        {needle && <Link href="/clrcrm/crm/database" className="text-sm-normal">Clear</Link>}
      </form>
      <p className="crm-hint">{clients.length} of {all.length} leads. Tap a name to open or edit it.</p>

      <div className="crm-table-wrap">
        <table className="crm-table">
          <thead>
            <tr>
              {["Lead ID", "Name", "Company", "Email", "Phone", "Source / Campaign", "Stage", "Stage Entered", "Discovery Call",
                "Deal Value", "Probability", "Weighted", "Payment Status", "Next Action", "Next Action Date", "Owner", "Last Contact", "Notes"]
                .map((h) => <th key={h} scope="col">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id}>
                <td>{c.lead_code}</td>
                <th scope="row"><Link href={`/clrcrm/crm/clients/${c.id}`}>{c.name}</Link></th>
                <td>{c.company}</td>
                <td>{c.email && <a href={`mailto:${c.email}`}>{c.email}</a>}</td>
                <td>{c.phone}</td>
                <td>{c.source}</td>
                <td>{c.stage === "LOST" ? "Lost" : c.stage}</td>
                <td>{c.stage_entered_date && shortDate(c.stage_entered_date)}</td>
                <td>{c.discovery_call_date && shortDate(c.discovery_call_date)}</td>
                <td className="crm-num">{c.deal_value !== null && money(c.deal_value)}</td>
                <td className="crm-num">{c.probability !== null && `${c.probability}%`}</td>
                <td className="crm-num">{weighted(c) !== null && money(weighted(c))}</td>
                <td>{c.payment_status}</td>
                <td>{c.next_action}</td>
                <td>{c.next_action_date && shortDate(c.next_action_date)}</td>
                <td>{c.owner}</td>
                <td>{c.last_contact_date && shortDate(c.last_contact_date)}</td>
                <td className="crm-notes">{c.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
