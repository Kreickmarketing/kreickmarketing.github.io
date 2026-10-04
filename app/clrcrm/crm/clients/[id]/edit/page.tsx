import { notFound } from "next/navigation";
import ClientForm from "../../../ClientForm";
import { getClient } from "../../../queries";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  return (
    <div className="crm-page">
      <div className="crm-page-head"><h1>Edit {client.name}</h1></div>
      <ClientForm client={client} />
    </div>
  );
}
