import Link from "next/link";
import { getClients } from "../queries";
import StageAge from "../StageAge";

// Client cards: pick a lead to see everything about them.
export default async function ClientsPage() {
  const clients = await getClients();
  return (
    <div className="crm-page">
      <div className="crm-page-head">
        <h1>Clients</h1>
        <Link href="/clrcrm/crm/clients/new" className="button button-action">Add lead</Link>
      </div>
      <ul className="crm-people">
        {clients.map((c) => (
          <li key={c.id}>
            <Link href={`/clrcrm/crm/clients/${c.id}`}>
              <span className="crm-card-name">{c.name}</span>
              <span className="crm-card-co">{[c.company, c.stage === "LOST" ? "Lost" : c.stage ?? "No stage yet"].filter(Boolean).join(" · ")}</span>
            </Link>
            <StageAge since={c.stage ? c.stage_entered_date : null} />
          </li>
        ))}
      </ul>
    </div>
  );
}
